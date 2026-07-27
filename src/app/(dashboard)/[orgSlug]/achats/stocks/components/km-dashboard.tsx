'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Package, AlertTriangle, Wallet, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatKm, formatCurrency, formatPercent, getKmColor } from '@/modules/km/formatters'
import { getKmLevel } from '@/modules/km/calculator'
import type { KmBatchResult, KmLevel } from '@/modules/km/types'
import { seedDemoData } from '../actions'

interface KmKpiCardsProps {
  weightedAverage: number
  alertCount: number
  totalStockValue: number
  avgOccupancy: number
  hasPallets: boolean
  orgSlug: string
}

export function KmKpiCards({
  weightedAverage,
  alertCount,
  totalStockValue,
  avgOccupancy,
  hasPallets,
  orgSlug,
}: KmKpiCardsProps) {
  const router = useRouter()
  const [seedLoading, setSeedLoading] = useState(false)
  const avgLevel = getKmLevel(Math.round(weightedAverage * 10000))

  async function handleSeed() {
    setSeedLoading(true)
    const result = await seedDemoData(orgSlug)
    setSeedLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Données de démonstration chargées')
      router.refresh()
    }
  }

  if (!hasPallets) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            Aucune palette en stock. Commencez par créer des zones de stockage et
            des références produit, puis enregistrez vos premières palettes.
          </p>
          <Button onClick={handleSeed} disabled={seedLoading}>
            {seedLoading
              ? 'Chargement...'
              : 'Charger les données de démonstration'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Km moyen global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className="text-3xl font-bold"
            style={{ color: getKmColor(avgLevel) }}
          >
            {formatKm(weightedAverage)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Palettes en alerte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-3xl font-bold ${alertCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {alertCount}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Valeur en stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {formatCurrency(totalStockValue)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Package className="h-4 w-4" />
            Occupation moyenne
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {formatPercent(avgOccupancy * 100)}
          </p>
        </CardContent>
      </Card>
    </>
  )
}
