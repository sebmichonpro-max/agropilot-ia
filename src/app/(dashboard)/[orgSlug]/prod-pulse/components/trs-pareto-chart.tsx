'use client'

import { formatDuration } from '../lib/trs-calculations'
import { CATEGORY_COLORS } from '../lib/trs-constants'
import type { StopCategory } from '@/types/database'

interface TrsParetoChartProps {
  data: Array<{ name: string; category: string; totalSeconds: number; percent: number }>
}

export function TrsParetoChart({ data }: TrsParetoChartProps) {
  if (data.length === 0) return null

  const maxSeconds = data[0]?.totalSeconds ?? 1

  return (
    <div className="rounded-xl border border-ap-cream-200 bg-white p-5">
      <h3 className="text-sm font-medium text-ap-green-900 mb-4">Top 5 causes d&apos;arrêt</h3>
      <div className="space-y-3">
        {data.map((cause, i) => {
          const colors = CATEGORY_COLORS[cause.category as StopCategory] ?? { bg: 'bg-ap-cream-100', text: 'text-ap-cream-800' }
          const widthPercent = (cause.totalSeconds / maxSeconds) * 100

          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-ap-green-900 font-medium">{cause.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                    {cause.percent}%
                  </span>
                  <span className="text-xs text-ap-cream-600">{formatDuration(cause.totalSeconds)}</span>
                </div>
              </div>
              <div className="h-3 bg-ap-cream-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    cause.category === 'availability' ? 'bg-blue-400' :
                    cause.category === 'performance' ? 'bg-amber-400' :
                    'bg-red-400'
                  }`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-4 text-xs text-ap-cream-600">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Disponibilité</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Performance</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Qualité</span>
      </div>
    </div>
  )
}
