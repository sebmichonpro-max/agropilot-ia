'use client'

import { formatKm, getKmColor } from '@/modules/km/formatters'
import { KM_LEVELS } from '@/modules/km/constants'
import type { KmLevel } from '@/modules/km/types'

interface KmGaugeProps {
  value: number
  level: KmLevel
  size?: number
}

export function KmGauge({ value, level, size = 180 }: KmGaugeProps) {
  const info = KM_LEVELS[level]
  const color = getKmColor(level)

  // Map Km value to angle (0 to 180 degrees)
  // 0 = left, 180 = right
  const maxKm = 2.0
  const clampedValue = Math.min(value, maxKm)
  const angle = (clampedValue / maxKm) * 180

  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 16

  const startAngle = Math.PI
  const endAngle = startAngle - (angle * Math.PI) / 180

  const x1 = cx + radius * Math.cos(startAngle)
  const y1 = cy - radius * Math.sin(startAngle)
  const x2 = cx + radius * Math.cos(endAngle)
  const y2 = cy - radius * Math.sin(endAngle)

  const largeArc = angle > 180 ? 1 : 0

  const bgX1 = cx + radius * Math.cos(startAngle)
  const bgY1 = cy - radius * Math.sin(startAngle)
  const bgX2 = cx + radius * Math.cos(0)
  const bgY2 = cy - radius * Math.sin(0)

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size / 2 + 20}
        viewBox={`0 0 ${size} ${size / 2 + 20}`}
      >
        {/* Background arc */}
        <path
          d={`M ${bgX1} ${bgY1} A ${radius} ${radius} 0 1 1 ${bgX2} ${bgY2}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* Value arc */}
        {angle > 0 && (
          <path
            d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeLinecap="round"
          />
        )}
        {/* Center value */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="text-2xl font-bold"
          fill={color}
        >
          {formatKm(value)}
        </text>
      </svg>
      <span
        className="text-sm font-medium -mt-2"
        style={{ color }}
      >
        {info.label}
      </span>
      <span className="text-xs text-muted-foreground mt-0.5">
        {info.description}
      </span>
    </div>
  )
}
