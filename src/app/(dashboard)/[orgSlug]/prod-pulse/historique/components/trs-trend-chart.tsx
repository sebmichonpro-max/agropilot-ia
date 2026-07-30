'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { TrsLevel } from '@/types/database'

interface TrsTrendChartProps {
  sessions: Array<{
    id: string
    started_at: string
    trs: number | null
    trs_level: TrsLevel | null
  }>
}

export function TrsTrendChart({ sessions }: TrsTrendChartProps) {
  const sorted = [...sessions]
    .filter((s) => s.trs != null)
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())

  if (sorted.length < 2) return null

  const data = sorted.map((s) => ({
    date: new Date(s.started_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    trs: Math.round(Number(s.trs) * 1000) / 10,
  }))

  return (
    <div className="rounded-xl border border-ap-cream-200 bg-white p-5">
      <h3 className="text-sm font-medium text-ap-green-900 mb-4">Tendance TRS</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3dac8" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => `${value}%`} />
          <ReferenceLine y={85} stroke="#95d1ae" strokeDasharray="5 5" label={{ value: '85%', position: 'right', fontSize: 10 }} />
          <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: '70%', position: 'right', fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="trs"
            stroke="#2d6148"
            strokeWidth={2}
            dot={{ r: 4, fill: '#2d6148' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
