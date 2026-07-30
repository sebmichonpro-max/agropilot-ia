'use client'

import { AlertTriangle, TrendingDown, Clock } from 'lucide-react'
import type { MarginLevel } from '@/types/database'

interface Sheet {
  id: string
  name: string
  margin_level: string | null
  margin_rate_bps: number | null
}

interface MarginAlertsProps {
  sheets: Sheet[]
  freshnessDays: number
  stalePricesCount: number
}

export function MarginAlerts({ sheets, freshnessDays, stalePricesCount }: MarginAlertsProps) {
  const lossProducts = sheets.filter((s) => s.margin_level === 'loss')
  const criticalProducts = sheets.filter((s) => s.margin_level === 'critical')
  const warningProducts = sheets.filter((s) => s.margin_level === 'warning')

  if (lossProducts.length === 0 && criticalProducts.length === 0 && warningProducts.length === 0 && stalePricesCount === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-ap-cream-200 bg-white p-5">
      <h3 className="text-sm font-medium text-ap-green-900 mb-3">Alertes actives</h3>
      <div className="space-y-2">
        {lossProducts.map((s) => (
          <div key={s.id} className="flex items-center gap-3 text-sm">
            <TrendingDown className="h-4 w-4 text-red-600 shrink-0" />
            <span className="text-ap-green-900 font-medium">{s.name}</span>
            <span className="text-red-700">en perte ({((s.margin_rate_bps ?? 0) / 100).toFixed(1)}%)</span>
          </div>
        ))}
        {criticalProducts.map((s) => (
          <div key={s.id} className="flex items-center gap-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <span className="text-ap-green-900 font-medium">{s.name}</span>
            <span className="text-red-600">marge critique ({((s.margin_rate_bps ?? 0) / 100).toFixed(1)}%)</span>
          </div>
        ))}
        {warningProducts.map((s) => (
          <div key={s.id} className="flex items-center gap-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-ap-green-900 font-medium">{s.name}</span>
            <span className="text-amber-700">marge alerte ({((s.margin_rate_bps ?? 0) / 100).toFixed(1)}%)</span>
          </div>
        ))}
        {stalePricesCount > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-amber-700">{stalePricesCount} prix n&apos;ont pas été mis à jour depuis {freshnessDays} jours</span>
          </div>
        )}
      </div>
    </div>
  )
}
