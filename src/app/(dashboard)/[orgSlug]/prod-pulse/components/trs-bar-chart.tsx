'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface TrsBarChartProps {
  data: Array<{ name: string; trs: number }>
}

export function TrsBarChart({ data }: TrsBarChartProps) {
  if (data.length === 0) return null

  const chartData = data.map((d) => ({
    name: d.name,
    trs: Math.round(d.trs * 1000) / 10,
  }))

  function getBarColor(trs: number) {
    if (trs >= 85) return '#4a9a72'
    if (trs >= 70) return '#95d1ae'
    if (trs >= 55) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="rounded-xl border border-ap-cream-200 bg-white p-5">
      <h3 className="text-sm font-medium text-ap-green-900 mb-4">TRS par ligne</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3dac8" />
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
          <Tooltip formatter={(value) => `${value}%`} />
          <Bar dataKey="trs" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={getBarColor(entry.trs)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
