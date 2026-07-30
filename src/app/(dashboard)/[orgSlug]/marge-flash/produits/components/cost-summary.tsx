'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { MarginLevel } from '@/types/database'
import { formatCents, formatBps, marginLevelLabel, marginLevelClasses } from '../../lib/cost-calculations'

interface CostSummaryProps {
  sheet: {
    selling_price_cents: number | null
    mp_cost_cents: number | null
    packaging_cost_cents: number | null
    labor_cost_cents: number | null
    total_cost_cents: number | null
    margin_cents: number | null
    margin_rate_bps: number | null
    margin_level: string | null
  }
}

const COLORS = ['#2d6148', '#6db88f', '#95d1ae']

export function CostSummary({ sheet }: CostSummaryProps) {
  const mp = sheet.mp_cost_cents ?? 0
  const pkg = sheet.packaging_cost_cents ?? 0
  const labor = sheet.labor_cost_cents ?? 0
  const total = sheet.total_cost_cents ?? 0

  const pieData = [
    { name: 'Matières premières', value: mp / 100 },
    { name: 'Packaging', value: pkg / 100 },
    { name: "Main-d'œuvre", value: labor / 100 },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-ap-cream-200 bg-white p-5 text-center">
          <span className="text-xs text-ap-cream-700">Coût de revient</span>
          <p className="text-2xl font-medium text-ap-green-900 mt-1">{formatCents(total)}</p>
        </div>
        <div className="rounded-xl border border-ap-cream-200 bg-white p-5 text-center">
          <span className="text-xs text-ap-cream-700">Prix de vente</span>
          <p className="text-2xl font-medium text-ap-green-900 mt-1">
            {sheet.selling_price_cents != null ? formatCents(sheet.selling_price_cents) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-ap-cream-200 bg-white p-5 text-center">
          <span className="text-xs text-ap-cream-700">Marge brute</span>
          <p className="text-2xl font-medium text-ap-green-900 mt-1">
            {sheet.margin_cents != null ? formatCents(sheet.margin_cents) : '—'}
          </p>
          {sheet.margin_rate_bps != null && sheet.margin_level && (
            <div className="mt-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${marginLevelClasses(sheet.margin_level as MarginLevel)}`}>
                {marginLevelLabel(sheet.margin_level as MarginLevel)} — {formatBps(sheet.margin_rate_bps)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="rounded-xl border border-ap-cream-200 bg-white p-5">
          <h3 className="text-sm font-medium text-ap-green-900 mb-4">Répartition des coûts</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${Number(value).toFixed(2)} €`} />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS[0] }} />
              <span className="text-ap-cream-700">MP</span>
              <p className="font-medium text-ap-green-900">{formatCents(mp)}</p>
              {total > 0 && <p className="text-xs text-ap-cream-600">{((mp / total) * 100).toFixed(0)}%</p>}
            </div>
            <div>
              <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS[1] }} />
              <span className="text-ap-cream-700">Packaging</span>
              <p className="font-medium text-ap-green-900">{formatCents(pkg)}</p>
              {total > 0 && <p className="text-xs text-ap-cream-600">{((pkg / total) * 100).toFixed(0)}%</p>}
            </div>
            <div>
              <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS[2] }} />
              <span className="text-ap-cream-700">MO</span>
              <p className="font-medium text-ap-green-900">{formatCents(labor)}</p>
              {total > 0 && <p className="text-xs text-ap-cream-600">{((labor / total) * 100).toFixed(0)}%</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
