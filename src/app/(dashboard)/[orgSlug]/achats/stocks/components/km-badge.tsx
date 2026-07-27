import { Badge } from '@/components/ui/badge'
import { KM_LEVELS } from '@/modules/km/constants'
import { formatKm, getKmBgClass } from '@/modules/km/formatters'
import type { KmLevel } from '@/modules/km/types'

interface KmBadgeProps {
  value: number
  level: KmLevel
  showValue?: boolean
}

export function KmBadge({ value, level, showValue = true }: KmBadgeProps) {
  const info = KM_LEVELS[level]

  return (
    <Badge
      className={`${getKmBgClass(level)} text-white border-0`}
    >
      {showValue ? `${formatKm(value)} — ${info.label}` : info.label}
    </Badge>
  )
}
