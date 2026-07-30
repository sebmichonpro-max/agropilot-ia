'use client'

import * as LucideIcons from 'lucide-react'
import type { StopCause } from '@/types/database'
import { CATEGORY_COLORS } from '../../lib/trs-constants'

interface StopCauseGridProps {
  causes: StopCause[]
  onSelect: (causeId: string) => void
  isPending: boolean
}

function getIcon(iconName: string) {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
  return icons[iconName] ?? LucideIcons.AlertTriangle
}

export function StopCauseGrid({ causes, onSelect, isPending }: StopCauseGridProps) {
  const nonPlanned = causes.filter((c) => !c.is_planned)
  const planned = causes.filter((c) => c.is_planned)

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-ap-green-900 mb-3">Signaler un arrêt</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {nonPlanned.map((cause) => {
          const Icon = getIcon(cause.icon)
          const colors = CATEGORY_COLORS[cause.category]
          return (
            <button
              key={cause.id}
              onClick={() => onSelect(cause.id)}
              disabled={isPending}
              className={`flex flex-col items-center justify-center rounded-xl p-4 min-h-[80px] transition-colors disabled:opacity-50 ${colors.bg} hover:opacity-80`}
            >
              <Icon className={`h-6 w-6 mb-1.5 ${colors.text}`} />
              <span className={`text-xs font-medium text-center leading-tight ${colors.text}`}>{cause.name}</span>
            </button>
          )
        })}
      </div>

      {planned.length > 0 && (
        <>
          <h4 className="text-xs text-ap-cream-600 mt-4 mb-2">Arrêts planifiés</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {planned.map((cause) => {
              const Icon = getIcon(cause.icon)
              return (
                <button
                  key={cause.id}
                  onClick={() => onSelect(cause.id)}
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 bg-ap-cream-100 hover:bg-ap-cream-200 transition-colors disabled:opacity-50"
                >
                  <Icon className="h-4 w-4 text-ap-cream-700" />
                  <span className="text-xs text-ap-cream-800">{cause.name}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
