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
import { getKmColor } from '@/modules/km/formatters'
import { getKmLevel } from '@/modules/km/calculator'

interface KmByFamilyProps {
  data: { family: string; avgKm: number; count: number }[]
}

export function KmByFamily({ data }: KmByFamilyProps) {
  const sorted = [...data].sort((a, b) => b.avgKm - a.avgKm)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Km moyen par famille
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="family"
                type="category"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(v: number) => [v.toFixed(4), 'Km moyen']}
              />
              <Bar dataKey="avgKm" name="Km moyen" radius={[0, 4, 4, 0]}>
                {sorted.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={getKmColor(getKmLevel(Math.round(entry.avgKm * 10000)))}
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
