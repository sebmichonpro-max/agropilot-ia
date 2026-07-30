'use client'

import { useState, useEffect, useTransition } from 'react'
import { getDashboardData } from '../actions'
import { MargeKpiCards } from './marge-kpi-cards'
import { ProductsMarginTable } from './products-margin-table'
import { CostBreakdownChart } from './cost-breakdown-chart'
import { MarginAlerts } from './margin-alerts'

interface MargeDashboardProps {
  orgSlug: string
}

interface DashboardData {
  sheets: Array<{
    id: string
    name: string
    mp_cost_cents: number | null
    packaging_cost_cents: number | null
    labor_cost_cents: number | null
    total_cost_cents: number | null
    selling_price_cents: number | null
    margin_cents: number | null
    margin_rate_bps: number | null
    margin_level: string | null
    product_categories: { name: string } | null
    customers: { name: string } | null
  }>
  avgMarginBps: number
  alertCount: number
  lossCount: number
  stalePricesCount: number
  freshnessDays: number
}

export function MargeDashboard({ orgSlug }: MargeDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isPending, startTransition] = useTransition()
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterCustomer, setFilterCustomer] = useState<string>('')

  useEffect(() => {
    startTransition(async () => {
      const result = await getDashboardData()
      setData(result as DashboardData | null)
    })
  }, [])

  if (isPending && !data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-ap-cream-200 rounded-xl" />)}
        </div>
        <div className="h-64 bg-ap-cream-200 rounded-xl" />
      </div>
    )
  }

  if (!data) return null

  const categories = [...new Set(data.sheets.map((s) => s.product_categories?.name).filter(Boolean))] as string[]
  const customers = [...new Set(data.sheets.map((s) => s.customers?.name).filter(Boolean))] as string[]

  const filtered = data.sheets.filter((s) => {
    if (filterCategory && s.product_categories?.name !== filterCategory) return false
    if (filterCustomer && s.customers?.name !== filterCustomer) return false
    return true
  })

  return (
    <div className="space-y-6">
      <MargeKpiCards
        avgMarginBps={data.avgMarginBps}
        alertCount={data.alertCount}
        lossCount={data.lossCount}
        stalePricesCount={data.stalePricesCount}
      />

      <div className="flex flex-wrap gap-3">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-ap-cream-300 bg-white px-3 py-1.5 text-sm text-ap-cream-800"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterCustomer}
          onChange={(e) => setFilterCustomer(e.target.value)}
          className="rounded-lg border border-ap-cream-300 bg-white px-3 py-1.5 text-sm text-ap-cream-800"
        >
          <option value="">Tous les clients</option>
          {customers.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <ProductsMarginTable sheets={filtered} orgSlug={orgSlug} />

      {filtered.length >= 2 && (
        <CostBreakdownChart sheets={filtered.slice(0, 10)} />
      )}

      <MarginAlerts sheets={data.sheets} freshnessDays={data.freshnessDays} stalePricesCount={data.stalePricesCount} />
    </div>
  )
}
