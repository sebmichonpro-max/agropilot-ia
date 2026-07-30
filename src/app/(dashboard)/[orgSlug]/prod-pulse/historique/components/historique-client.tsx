'use client'

import { useState, useTransition } from 'react'
import { Download, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { TrsLevel } from '@/types/database'
import { deleteSession, getSessionStops } from '../../actions'
import { formatDuration, trsLevelBadgeClasses } from '../../lib/trs-calculations'
import { TrsTrendChart } from './trs-trend-chart'
import { SessionDetail } from './session-detail'

interface SessionRow {
  id: string
  started_at: string
  ended_at: string | null
  qty_produced: number | null
  qty_conforming: number | null
  trs: number | null
  availability: number | null
  performance: number | null
  quality: number | null
  trs_level: TrsLevel | null
  line_id: string
  production_lines: { name: string } | null
  pp_products: { name: string; unit_label: string } | null
}

interface HistoriqueClientProps {
  orgSlug: string
  lines: Array<{ id: string; name: string }>
  sessions: SessionRow[]
}

export function HistoriqueClient({ orgSlug, lines, sessions }: HistoriqueClientProps) {
  const [lineFilter, setLineFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [stopData, setStopData] = useState<Array<{ id: string; started_at: string; ended_at: string | null; duration_seconds: number | null; stop_causes: { name: string; category: string; icon: string; is_planned: boolean } | null }>>([])
  const [isPending, startTransition] = useTransition()

  const filtered = lineFilter
    ? sessions.filter((s) => s.line_id === lineFilter)
    : sessions

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    startTransition(async () => {
      const stops = await getSessionStops(id)
      setStopData(stops as typeof stopData)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteSession(orgSlug, id)
      if ('error' in result) toast.error(result.error)
      else toast.success('Session supprimée')
    })
  }

  function exportCsv() {
    const header = 'Date;Ligne;Produit;Durée (min);TRS %;Dispo %;Perf %;Qualité %;Qté produite;Qté conforme\n'
    const rows = filtered.map((s) => {
      const dur = s.ended_at ? Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000) : 0
      return [
        new Date(s.started_at).toLocaleDateString('fr-FR'),
        (s.production_lines as { name: string } | null)?.name ?? '',
        (s.pp_products as { name: string } | null)?.name ?? '',
        dur,
        s.trs != null ? (Number(s.trs) * 100).toFixed(1) : '',
        s.availability != null ? (Number(s.availability) * 100).toFixed(1) : '',
        s.performance != null ? (Number(s.performance) * 100).toFixed(1) : '',
        s.quality != null ? (Number(s.quality) * 100).toFixed(1) : '',
        s.qty_produced ?? '',
        s.qty_conforming ?? '',
      ].join(';')
    }).join('\n')

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prod-pulse-historique-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-ap-green-900">Historique</h1>
        <div className="flex gap-2">
          <select
            value={lineFilter}
            onChange={(e) => setLineFilter(e.target.value)}
            className="rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Toutes les lignes</option>
            {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <Button variant="outline" onClick={exportCsv} className="gap-2">
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      {/* Trend chart */}
      {filtered.length > 1 && (
        <TrsTrendChart sessions={filtered} />
      )}

      {/* Sessions table */}
      <div className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ap-cream-300">
                <th className="text-left px-4 py-3 text-ap-cream-700 font-normal">Date</th>
                <th className="text-left px-4 py-3 text-ap-cream-700 font-normal">Ligne</th>
                <th className="text-left px-4 py-3 text-ap-cream-700 font-normal">Produit</th>
                <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">Durée</th>
                <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">TRS</th>
                <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">D</th>
                <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">P</th>
                <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">Q</th>
                <th className="text-right px-4 py-3 text-ap-cream-700 font-normal w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const line = s.production_lines as { name: string } | null
                const prod = s.pp_products as { name: string } | null
                const durSec = s.ended_at ? Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000) : 0
                const isExpanded = expandedId === s.id

                return (
                  <tr key={s.id} className="border-b border-ap-cream-200 hover:bg-ap-cream-100 group">
                    <td className="px-4 py-2.5 text-ap-cream-800">
                      {new Date(s.started_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-2.5 text-ap-green-900 font-medium">{line?.name}</td>
                    <td className="px-4 py-2.5 text-ap-cream-800">{prod?.name}</td>
                    <td className="px-4 py-2.5 text-right text-ap-cream-800">{formatDuration(durSec)}</td>
                    <td className="px-4 py-2.5 text-right">
                      {s.trs != null && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${trsLevelBadgeClasses(s.trs_level ?? 'critical')}`}>
                          {(Number(s.trs) * 100).toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-ap-cream-800">
                      {s.availability != null ? `${(Number(s.availability) * 100).toFixed(0)}%` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-ap-cream-800">
                      {s.performance != null ? `${(Number(s.performance) * 100).toFixed(0)}%` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-ap-cream-800">
                      {s.quality != null ? `${(Number(s.quality) * 100).toFixed(0)}%` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => toggleExpand(s.id)}
                          className="p-1.5 rounded hover:bg-ap-cream-200 text-ap-cream-700"
                          aria-label="Détail"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-ap-cream-600">
                    Aucune session trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Expanded detail */}
        {expandedId && (
          <SessionDetail stops={stopData} />
        )}
      </div>
    </div>
  )
}
