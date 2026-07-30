'use client'

import type { MarginLevel } from '@/types/database'
import { marginLevelLabel, marginLevelClasses } from '../lib/cost-calculations'

interface MarginBadgeProps {
  level: MarginLevel | null
}

export function MarginBadge({ level }: MarginBadgeProps) {
  if (!level) return <span className="text-xs text-ap-cream-600">—</span>
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${marginLevelClasses(level)}`}>
      {marginLevelLabel(level)}
    </span>
  )
}
