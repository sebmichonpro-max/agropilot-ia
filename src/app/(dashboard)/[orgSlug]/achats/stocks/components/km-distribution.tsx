'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KM_LEVELS } from '@/modules/km/constants'
import { getKmColor } from '@/modules/km/formatters'
import type { KmLevel } from '@/modules/km/types'

interface KmDistributionProps {
  countByLevel: Record<KmLevel, number>
}

export function KmDistribution({ countByLevel }: KmDistributionProps) {
  const levels: KmLevel[] = [
    'excellent',
    'good',
    'warning',
    'critical',
    'destruction',
  ]

  const data = levels.map((level) => ({
    name: KM_LEVELS[level].label,
    count: countByLevel[level],
    level,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Répartition par niveau
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" name="Palettes" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.level}
                    fill={getKmColor(entry.level)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
