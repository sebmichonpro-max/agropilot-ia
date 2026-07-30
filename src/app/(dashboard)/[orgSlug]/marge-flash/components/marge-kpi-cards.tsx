'use client'

import { TrendingUp, AlertTriangle, TrendingDown, Clock } from 'lucide-react'
import { formatBps } from '../lib/cost-calculations'

interface MargeKpiCardsProps {
  avgMarginBps: number
  alertCount: number
  lossCount: number
  stalePricesCount: number
}

export function MargeKpiCards({ avgMarginBps, alertCount, lossCount, stalePricesCount }: MargeKpiCardsProps) {
  const cards = [
    {
      label: 'Marge moyenne',
      value: formatBps(avgMarginBps),
      icon: TrendingUp,
      bg: avgMarginBps >= 2000 ? 'bg-ap-green-100' : avgMarginBps >= 1000 ? 'bg-amber-50' : 'bg-red-50',
    },
    {
      label: 'Produits en alerte',
      value: String(alertCount),
      icon: AlertTriangle,
      bg: alertCount > 0 ? 'bg-amber-50' : 'bg-ap-green-100',
    },
    {
      label: 'Produits en perte',
      value: String(lossCount),
      icon: TrendingDown,
      bg: lossCount > 0 ? 'bg-red-50' : 'bg-ap-green-100',
    },
    {
      label: 'Prix à actualiser',
      value: String(stalePricesCount),
      icon: Clock,
      bg: stalePricesCount > 0 ? 'bg-amber-50' : 'bg-ap-green-100',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className={`rounded-lg p-4 ${card.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4 text-ap-cream-700" />
              <span className="text-xs text-ap-cream-700">{card.label}</span>
            </div>
            <p className="text-2xl font-medium text-ap-green-900">{card.value}</p>
          </div>
        )
      })}
    </div>
  )
}
