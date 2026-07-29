import Link from 'next/link'
import type { Metadata } from 'next'
import { Plus, Settings, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModuleLayout } from '@/components/shared/module-layout'
import { KmKpiCards } from './components/km-dashboard'
import { AlertPanel } from './components/alert-panel'
import { KmByFamily } from './components/km-by-family'
import { KmDistribution } from './components/km-distribution'
import { KmTrendChart } from './components/km-trend-chart'
import { PalletTable } from './components/pallet-table'
import { PdfExportButton } from './components/pdf-export-button'
import { getKmDashboardData } from './actions'
import { buildDailyCurve, calculateWeightedAverageKm } from '@/modules/km/calculator'

export const metadata: Metadata = {
  title: 'Stocks & Coefficient Michon — AgroPilot.IA',
}

export default async function StocksPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const data = await getKmDashboardData(orgSlug)

  if (!data) return null

  const {
    batchResult,
    familyData,
    alertPallets,
    avgOccupancy,
    palletsWithMovements,
  } = data

  const hasPallets = palletsWithMovements.length > 0

  const alertCount = batchResult.countByLevel.warning +
    batchResult.countByLevel.critical +
    batchResult.countByLevel.destruction

  // Build 30-day trend from all pallets (last 30 daily points of weighted average)
  const trendData: { date: string; km: number }[] = []
  if (hasPallets) {
    const today = new Date()
    for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
      const calcDate = new Date(today)
      calcDate.setDate(calcDate.getDate() - daysAgo)

      const dailyResults = palletsWithMovements.map((pw) => {
        const entryDate = new Date(pw.pallet.entry_date)
        if (calcDate < entryDate) return null
        const curve = buildDailyCurve({
          initialQuantityGrams: pw.pallet.initial_quantity,
          unitPriceCents: pw.pallet.unit_price_cents,
          dailyCostCents: pw.zone.daily_cost_cents,
          thermalFactor: pw.zone.thermal_factor,
          capitalCostRate: data.settings?.capital_cost_rate ?? 500,
          entryDate,
          movements: pw.movements.map((m) => ({
            date: new Date(m.movement_date),
            quantityGrams: m.quantity,
          })),
          calculationDate: calcDate,
        })
        const lastPoint = curve[curve.length - 1]
        if (!lastPoint) return null
        return {
          value: lastPoint.km,
          productValue: (pw.pallet.initial_quantity / 1000) * pw.pallet.unit_price_cents,
          level: 'excellent' as const,
          logisticCost: 0,
          financialCost: 0,
          totalCost: 0,
          daysInStock: 0,
          occupancyDays: 0,
        }
      }).filter((r): r is NonNullable<typeof r> => r !== null)

      const avg = calculateWeightedAverageKm(dailyResults)
      trendData.push({
        date: calcDate.toISOString().split('T')[0],
        km: Math.round(avg * 10000) / 10000,
      })
    }
  }

  // Build table data
  const tableData = palletsWithMovements.map((pw) => ({
    pallet: pw.pallet,
    reference: pw.reference,
    zone: pw.zone,
    result: batchResult.results.get(pw.pallet.id)!,
  })).filter((x) => x.result)

  return (
    <ModuleLayout
      title="Stocks & Coefficient Michon"
      description="Mesurez la destruction de valeur par palette et optimisez vos rotations"
      breadcrumbs={[
        { label: 'Achats', href: `/${orgSlug}/achats/stocks` },
        { label: 'Stocks' },
      ]}
    >
      <div className="flex flex-wrap gap-2">
        <Link href={`/${orgSlug}/achats/stocks/palettes/nouveau`}>
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> Entrée palette
          </Button>
        </Link>
        <Link href={`/${orgSlug}/achats/stocks/zones`}>
          <Button variant="outline" size="sm">Zones</Button>
        </Link>
        <Link href={`/${orgSlug}/achats/stocks/references`}>
          <Button variant="outline" size="sm">Références</Button>
        </Link>
        <PdfExportButton orgSlug={orgSlug} />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KmKpiCards
          weightedAverage={batchResult.weightedAverage}
          alertCount={alertCount}
          totalStockValue={batchResult.totalStockValue}
          avgOccupancy={avgOccupancy}
          hasPallets={hasPallets}
          orgSlug={orgSlug}
        />
      </div>

      {hasPallets && (
        <>
          {/* Middle row: alerts + by family */}
          <div className="grid gap-4 lg:grid-cols-2">
            <AlertPanel orgSlug={orgSlug} alerts={alertPallets} />
            <KmByFamily data={familyData} />
          </div>

          {/* Bottom row: distribution + trend */}
          <div className="grid gap-4 lg:grid-cols-2">
            <KmDistribution countByLevel={batchResult.countByLevel} />
            <KmTrendChart data={trendData} />
          </div>

          {/* Pallet table */}
          <PalletTable orgSlug={orgSlug} pallets={tableData} />
        </>
      )}
    </ModuleLayout>
  )
}
