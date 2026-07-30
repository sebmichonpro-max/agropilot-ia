'use client'

import { useState, useEffect, useTransition } from 'react'
import { Activity } from 'lucide-react'
import { getDashboardData } from '../actions'
import { TrsGauges } from './trs-gauges'
import { TrsKpiCards } from './trs-kpi-cards'
import { TrsBarChart } from './trs-bar-chart'
import { TrsParetoChart } from './trs-pareto-chart'
import type { TrsLevel } from '@/types/database'

type Period = 'today' | '7d' | '30d'

interface DashboardData {
  avgTrs: number
  avgAvail: number
  avgPerf: number
  avgQual: number
  sessionCount: number
  totalLossCents: number
  trsPerLine: Array<{ name: string; trs: number }>
  topCauses: Array<{ name: string; category: string; totalSeconds: number; percent: number }>
  recentSessions: Array<{
    id: string
    started_at: string
    ended_at: string | null
    trs: number | null
    trs_level: TrsLevel | null
    production_lines: unknown
    pp_products: unknown
  }>
  lines: Array<{ id: string; name: string }>
}

function getDateRange(period: Period): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString()
  let from: Date

  switch (period) {
    case 'today':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case '7d':
      from = new Date(now.getTime() - 7 * 24 * 3600 * 1000)
      break
    case '30d':
      from = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
      break
  }

  return { from: from.toISOString(), to }
}

interface TrsDashboardProps {
  orgSlug: string
}

export function TrsDashboard({ orgSlug }: TrsDashboardProps) {
  const [period, setPeriod] = useState<Period>('7d')
  const [lineFilter, setLineFilter] = useState<string>('')
  const [data, setData] = useState<DashboardData | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const { from, to } = getDateRange(period)
    startTransition(async () => {
      const result = await getDashboardData(from, to, lineFilter || undefined)
      setData(result as DashboardData | null)
    })
  }, [period, lineFilter])

  void orgSlug

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-ap-green-700" />
          <h1 className="text-2xl font-semibold text-ap-green-900">PROD&apos;PULSE — Suivi TRS</h1>
        </div>
        <div className="flex gap-2">
          {(['today', '7d', '30d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-ap-green-900 text-ap-green-100'
                  : 'bg-ap-cream-100 text-ap-cream-800 hover:bg-ap-cream-200'
              }`}
            >
              {p === 'today' ? "Aujourd'hui" : p === '7d' ? '7 jours' : '30 jours'}
            </button>
          ))}
        </div>
      </div>

      {/* Line filter */}
      {data && data.lines.length > 1 && (
        <div className="mb-4">
          <select
            value={lineFilter}
            onChange={(e) => setLineFilter(e.target.value)}
            className="rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Toutes les lignes</option>
            {data.lines.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
      )}

      {isPending && !data && (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-ap-cream-200 rounded-xl" />)}
          </div>
        </div>
      )}

      {data && data.sessionCount === 0 && (
        <div className="rounded-xl border border-ap-cream-200 bg-white p-12 text-center">
          <Activity className="h-12 w-12 mx-auto text-ap-cream-300 mb-4" />
          <p className="text-lg font-medium text-ap-green-900 mb-2">Aucune session sur cette période</p>
          <p className="text-sm text-ap-cream-700">Lancez une saisie atelier pour commencer à suivre votre TRS.</p>
        </div>
      )}

      {data && data.sessionCount > 0 && (
        <>
          {/* Gauges */}
          <TrsGauges trs={data.avgTrs} availability={data.avgAvail} performance={data.avgPerf} quality={data.avgQual} />

          {/* KPI + Loss */}
          <TrsKpiCards sessionCount={data.sessionCount} totalLossCents={data.totalLossCents} />

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <TrsBarChart data={data.trsPerLine} />
            <TrsParetoChart data={data.topCauses} />
          </div>

          {/* Recent sessions table */}
          <div className="mt-6 rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
            <h3 className="text-sm font-medium text-ap-green-900 px-4 py-3 border-b border-ap-cream-200">
              Dernières sessions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ap-cream-300">
                    <th className="text-left px-4 py-2 text-ap-cream-700 font-normal">Date</th>
                    <th className="text-left px-4 py-2 text-ap-cream-700 font-normal">Ligne</th>
                    <th className="text-left px-4 py-2 text-ap-cream-700 font-normal">Produit</th>
                    <th className="text-right px-4 py-2 text-ap-cream-700 font-normal">TRS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSessions.map((s) => {
                    const line = s.production_lines as { name: string } | null
                    const prod = s.pp_products as { name: string } | null
                    return (
                      <tr key={s.id} className="border-b border-ap-cream-200 hover:bg-ap-cream-100">
                        <td className="px-4 py-2 text-ap-cream-800">
                          {new Date(s.started_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-2 text-ap-green-900 font-medium">{line?.name}</td>
                        <td className="px-4 py-2 text-ap-cream-800">{prod?.name}</td>
                        <td className="px-4 py-2 text-right">
                          {s.trs != null ? (
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              s.trs_level === 'excellent' ? 'bg-ap-green-100 text-ap-green-800' :
                              s.trs_level === 'good' ? 'bg-ap-green-300 text-ap-green-900' :
                              s.trs_level === 'warning' ? 'bg-amber-50 text-amber-800' :
                              'bg-red-50 text-red-800'
                            }`}>
                              {(Number(s.trs) * 100).toFixed(1)}%
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
