import { KM_LEVELS } from '@/modules/km/constants'
import { formatKm, getKmBgClass, getKmTextClass } from '@/modules/km/formatters'
import type { KmLevel } from '@/modules/km/types'

interface KmBadgeProps {
  value: number
  level: KmLevel
  showValue?: boolean
}

export function KmBadge({ value, level, showValue = true }: KmBadgeProps) {
  const info = KM_LEVELS[level]

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getKmBgClass(level)} ${getKmTextClass(level)}`}
    >
      {showValue ? `${formatKm(value)} — ${info.label}` : info.label}
    </span>
  )
}
