'use client'

import { useState, useEffect } from 'react'
import { Play, Square, RotateCcw } from 'lucide-react'
import type { ProductionSession } from '@/types/database'
import { formatPercent } from '../../lib/trs-calculations'

interface SessionControlsProps {
  state: 'idle' | 'running' | 'stopped'
  session: ProductionSession | null
  activeStopCause: string | null
  isPending: boolean
  onStart: () => void
  onResume: () => void
  onEnd: () => void
}

export function SessionControls({ state, session, activeStopCause, isPending, onStart, onResume, onEnd }: SessionControlsProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!session) { setElapsed(0); return }
    const start = new Date(session.started_at).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session])

  const hours = Math.floor(elapsed / 3600)
  const minutes = Math.floor((elapsed % 3600) / 60)
  const seconds = elapsed % 60
  const timer = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  if (state === 'idle') {
    return (
      <div className="flex justify-center py-8">
        <button
          onClick={onStart}
          disabled={isPending}
          className="w-40 h-40 rounded-full bg-ap-green-700 hover:bg-ap-green-800 text-white flex flex-col items-center justify-center transition-colors disabled:opacity-50"
        >
          <Play className="h-12 w-12 mb-1" />
          <span className="text-lg font-medium">DÉMARRER</span>
        </button>
      </div>
    )
  }

  if (state === 'stopped') {
    return (
      <div className="text-center py-6">
        <p className="text-4xl font-mono font-medium text-ap-green-900 mb-2">{timer}</p>
        <div className="rounded-lg bg-amber-50 px-4 py-2 mb-4 inline-block">
          <p className="text-sm text-amber-800 font-medium">ARRÊT — {activeStopCause ?? 'Cause inconnue'}</p>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={onResume}
            disabled={isPending}
            className="w-32 h-32 rounded-full bg-ap-green-700 hover:bg-ap-green-800 text-white flex flex-col items-center justify-center transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-8 w-8 mb-1" />
            <span className="text-sm font-medium">REPRENDRE</span>
          </button>
          <button
            onClick={onEnd}
            disabled={isPending}
            className="w-32 h-32 rounded-full bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center transition-colors disabled:opacity-50"
          >
            <Square className="h-8 w-8 mb-1" />
            <span className="text-sm font-medium">FIN DE LOT</span>
          </button>
        </div>
      </div>
    )
  }

  // state === 'running'
  return (
    <div className="text-center py-6">
      <p className="text-5xl font-mono font-medium text-ap-green-900 mb-2">{timer}</p>
      {session?.trs != null && (
        <p className="text-sm text-ap-cream-700 mb-4">TRS en cours : {formatPercent(Number(session.trs))}</p>
      )}
      <div className="flex justify-center mb-4">
        <button
          onClick={onEnd}
          disabled={isPending}
          className="w-36 h-36 rounded-full bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center transition-colors disabled:opacity-50"
        >
          <Square className="h-10 w-10 mb-1" />
          <span className="text-lg font-medium">FIN DE LOT</span>
        </button>
      </div>
      <p className="text-xs text-ap-cream-600">Appuyez sur une cause ci-dessous pour enregistrer un arrêt</p>
    </div>
  )
}
