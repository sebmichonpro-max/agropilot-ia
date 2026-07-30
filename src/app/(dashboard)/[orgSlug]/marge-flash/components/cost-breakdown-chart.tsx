'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Sheet {
  name: string
  mp_cost_cents: number | null
  packaging_cost_cents: number | null
  labor_cost_cents: number | null
}

interface CostBreakdownChartProps {
  sheets: Sheet[]
}

export function CostBreakdownChart({ sheets }: CostBreakdownChartProps) {
  const data = sheets.map((s) => ({
    name: s.name.length > 20 ? s.name.slice(0, 18) + '…' : s.name,
    'Matières premières': (s.mp_cost_cents ?? 0) / 100,
    Packaging: (s.packaging_cost_cents ?? 0) / 100,
    "Main-d'œuvre": (s.labor_cost_cents ?? 0) / 100,
  }))

  return (
    <div className="rounded-xl border border-ap-cream-200 bg-white p-5">
      <h3 className="text-sm font-medium text-ap-green-900 mb-4">Répartition des coûts (top 10)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3dac8" />
          <XAxis type="number" tickFormatter={(v) => `${v} €`} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => `${Number(value).toFixed(2)} €`} />
          <Legend />
          <Bar dataKey="Matières premières" stackId="cost" fill="#2d6148" />
          <Bar dataKey="Packaging" stackId="cost" fill="#6db88f" />
          <Bar dataKey="Main-d'œuvre" stackId="cost" fill="#95d1ae" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
