'use client'

import { formatDuration } from '../../lib/trs-calculations'
import { CATEGORY_COLORS } from '../../lib/trs-constants'
import type { StopCategory } from '@/types/database'

interface SessionDetailProps {
  stops: Array<{
    id: string
    started_at: string
    ended_at: string | null
    duration_seconds: number | null
    stop_causes: { name: string; category: string; icon: string; is_planned: boolean } | null
  }>
}

export function SessionDetail({ stops }: SessionDetailProps) {
  if (stops.length === 0) {
    return (
      <div className="px-4 py-4 bg-ap-cream-100 border-t border-ap-cream-200">
        <p className="text-sm text-ap-cream-600 text-center">Aucun arrêt enregistré pour cette session.</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 bg-ap-cream-100 border-t border-ap-cream-200">
      <h4 className="text-sm font-medium text-ap-green-900 mb-3">Timeline des arrêts ({stops.length})</h4>
      <div className="space-y-2">
        {stops.map((stop) => {
          const cause = stop.stop_causes
          const cat = (cause?.category ?? 'availability') as StopCategory
          const colors = CATEGORY_COLORS[cat]

          return (
            <div key={stop.id} className="flex items-center gap-3 text-sm">
              <span className="text-xs text-ap-cream-600 w-14 shrink-0">
                {new Date(stop.started_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                {cause?.name ?? 'Inconnue'}
              </span>
              {cause?.is_planned && (
                <span className="text-xs text-ap-cream-500">(planifié)</span>
              )}
              <span className="text-xs text-ap-cream-700 ml-auto">
                {stop.duration_seconds != null ? formatDuration(stop.duration_seconds) : 'en cours'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
