'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { toast } from 'sonner'
import type { ProductionLine, PpProduct, StopCause, ProductionSession } from '@/types/database'
import { startSession, endSession, getActiveSession, startStop, endStop, getActiveStop, getSessionStops, getLineProducts } from '../../actions'
import { SessionControls } from './session-controls'
import { StopCauseGrid } from './stop-cause-grid'
import { EndSessionForm } from './end-session-form'

interface SaisieClientProps {
  orgSlug: string
  lines: ProductionLine[]
  products: PpProduct[]
  causes: StopCause[]
}

type SessionState = 'idle' | 'running' | 'stopped'

export function SaisieClient({ orgSlug, lines, products, causes }: SaisieClientProps) {
  const [selectedLineId, setSelectedLineId] = useState(lines[0]?.id ?? '')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [availableProducts, setAvailableProducts] = useState<PpProduct[]>(products)
  const [session, setSession] = useState<ProductionSession | null>(null)
  const [activeStopId, setActiveStopId] = useState<string | null>(null)
  const [activeStopCause, setActiveStopCause] = useState<string | null>(null)
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [showEndForm, setShowEndForm] = useState(false)
  const [stops, setStops] = useState<Array<{ id: string; cause_id: string; duration_seconds: number | null; stop_causes: unknown }>>([])
  const [isPending, startTransition] = useTransition()

  const loadActiveSession = useCallback(async () => {
    if (!selectedLineId) return
    const active = await getActiveSession(selectedLineId)
    if (active) {
      setSession(active as ProductionSession)
      setSessionState('running')
      const stop = await getActiveStop(active.id)
      if (stop) {
        setActiveStopId(stop.id)
        setActiveStopCause((stop.stop_causes as { name: string } | null)?.name ?? null)
        setSessionState('stopped')
      }
      const sessionStops = await getSessionStops(active.id)
      setStops(sessionStops as Array<{ id: string; cause_id: string; duration_seconds: number | null; stop_causes: unknown }>)
    } else {
      setSession(null)
      setSessionState('idle')
      setActiveStopId(null)
      setActiveStopCause(null)
      setStops([])
    }
  }, [selectedLineId])

  useEffect(() => {
    loadActiveSession()
  }, [loadActiveSession])

  useEffect(() => {
    if (!selectedLineId) { setAvailableProducts(products); return }
    startTransition(async () => {
      const lp = await getLineProducts(selectedLineId)
      if (lp.length > 0) {
        const linkedIds = new Set(lp.map((l) => l.product_id))
        setAvailableProducts(products.filter((p) => linkedIds.has(p.id)))
      } else {
        setAvailableProducts(products)
      }
    })
  }, [selectedLineId, products])

  function handleStart() {
    if (!selectedLineId || !selectedProductId) {
      toast.error('Sélectionnez une ligne et un produit')
      return
    }
    const product = products.find((p) => p.id === selectedProductId)
    if (!product) return

    startTransition(async () => {
      const result = await startSession(orgSlug, selectedLineId, selectedProductId, product.cycle_time_ms)
      if ('error' in result) { toast.error(result.error); return }
      toast.success('Session démarrée')
      await loadActiveSession()
    })
  }

  function handleStopCause(causeId: string) {
    if (!session) return
    startTransition(async () => {
      const result = await startStop(orgSlug, session.id, causeId)
      if ('error' in result) { toast.error(result.error); return }
      toast.success('Arrêt enregistré')
      await loadActiveSession()
    })
  }

  function handleResume() {
    if (!activeStopId) return
    startTransition(async () => {
      const result = await endStop(orgSlug, activeStopId)
      if ('error' in result) { toast.error(result.error); return }
      toast.success('Production reprise')
      await loadActiveSession()
    })
  }

  function handleEndSession(qtyProduced: number, qtyConforming: number) {
    if (!session) return
    startTransition(async () => {
      const result = await endSession(orgSlug, session.id, qtyProduced, qtyConforming)
      if ('error' in result) { toast.error(result.error); return }
      toast.success('Lot validé — TRS calculé')
      setShowEndForm(false)
      setSession(null)
      setSessionState('idle')
      setActiveStopId(null)
      setStops([])
    })
  }

  const product = session
    ? products.find((p) => p.id === session.product_id)
    : products.find((p) => p.id === selectedProductId)

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ap-green-900 mb-6">Saisie atelier</h1>

      {/* Line & product selection */}
      {sessionState === 'idle' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-ap-green-900 mb-1">Ligne</label>
            <select
              value={selectedLineId}
              onChange={(e) => { setSelectedLineId(e.target.value); setSelectedProductId('') }}
              className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-3 text-sm focus:ring-2 focus:ring-ap-green-500"
            >
              <option value="">Sélectionner…</option>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ap-green-900 mb-1">Produit</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-3 text-sm focus:ring-2 focus:ring-ap-green-500"
            >
              <option value="">Sélectionner…</option>
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({(p.cycle_time_ms / 1000).toFixed(1)}s/{p.unit_label})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Session info banner */}
      {session && (
        <div className="rounded-lg bg-ap-green-100 px-4 py-3 mb-4 flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-ap-green-900">
              {lines.find((l) => l.id === session.line_id)?.name} — {product?.name}
            </span>
          </div>
          <span className="text-xs text-ap-green-700">
            Démarré {new Date(session.started_at).toLocaleTimeString('fr-FR')}
          </span>
        </div>
      )}

      {/* Controls */}
      <SessionControls
        state={sessionState}
        session={session}
        activeStopCause={activeStopCause}
        isPending={isPending}
        onStart={handleStart}
        onResume={handleResume}
        onEnd={() => setShowEndForm(true)}
      />

      {/* Cause grid (only when running) */}
      {sessionState === 'running' && (
        <StopCauseGrid
          causes={causes}
          onSelect={handleStopCause}
          isPending={isPending}
        />
      )}

      {/* Stop list */}
      {stops.length > 0 && (
        <div className="mt-6 rounded-xl border border-ap-cream-200 bg-white p-4">
          <h3 className="text-sm font-medium text-ap-green-900 mb-2">Arrêts de la session ({stops.length})</h3>
          <div className="space-y-1">
            {stops.map((s) => {
              const cause = s.stop_causes as { name: string } | null
              return (
                <div key={s.id} className="flex items-center justify-between text-sm px-3 py-1.5 rounded bg-ap-cream-100">
                  <span className="text-ap-cream-800">{cause?.name ?? 'Inconnue'}</span>
                  <span className="text-ap-cream-600">
                    {s.duration_seconds != null ? `${Math.floor(s.duration_seconds / 60)}min ${s.duration_seconds % 60}s` : 'en cours…'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* End session modal */}
      {showEndForm && (
        <EndSessionForm
          unitLabel={product?.unit_label ?? 'pièce'}
          isPending={isPending}
          onSubmit={handleEndSession}
          onCancel={() => setShowEndForm(false)}
        />
      )}
    </div>
  )
}
