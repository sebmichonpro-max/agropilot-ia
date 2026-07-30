'use client'

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { SimulationResults } from '@/types/database'

interface ResultChartsProps {
  results: SimulationResults
}

const DONUT_COLORS = ['#2d6148', '#e6f1fb', '#faeeda', '#e0f2e7']

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function ResultCharts({ results }: ResultChartsProps) {
  const donutData = [
    { name: 'Salaire net', value: Math.round(results.netAvantImpot) },
    { name: 'Cotis. salariales', value: Math.round(results.cotisationsSalariales) },
    { name: 'Cotis. patronales', value: Math.round(results.cotisationsPatronales) },
    { name: 'Allègement RGDU', value: Math.round(-results.rgdu) },
  ].filter((d) => d.value !== 0)

  const barData = [
    {
      name: 'Répartition',
      net: Math.round(results.netAvantImpot),
      salariales: Math.round(results.cotisationsSalariales),
      patronales: Math.round(results.cotisationsPatronales - results.rgdu),
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Donut */}
      <div className="rounded-lg border border-ap-cream-200 bg-white p-4">
        <h3 className="text-sm font-medium text-ap-green-900 mb-3">Répartition du coût</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={donutData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
            >
              {donutData.map((_, i) => (
                <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${formatCurrency(Number(value))} €`} />
            <Legend
              verticalAlign="bottom"
              formatter={(value: string) => <span className="text-xs text-ap-cream-800">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar */}
      <div className="rounded-lg border border-ap-cream-200 bg-white p-4">
        <h3 className="text-sm font-medium text-ap-green-900 mb-3">Brut → Net</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 10 }}>
            <XAxis type="number" tickFormatter={(v) => `${formatCurrency(v)} €`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip formatter={(value) => `${formatCurrency(Number(value))} €`} />
            <Legend
              formatter={(value: string) => <span className="text-xs text-ap-cream-800">{value}</span>}
            />
            <Bar dataKey="net" name="Salaire net" stackId="a" fill="#2d6148" radius={[4, 0, 0, 4]} />
            <Bar dataKey="salariales" name="Cotis. salariales" stackId="a" fill="#0c447c" />
            <Bar dataKey="patronales" name="Cotis. patronales (net)" stackId="a" fill="#854f0b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
