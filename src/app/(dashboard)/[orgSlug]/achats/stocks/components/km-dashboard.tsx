'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Package, AlertTriangle, Wallet, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatKm, formatCurrency, formatPercent, getKmColor } from '@/modules/km/formatters'
import { getKmLevel } from '@/modules/km/calculator'
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
      <Card className="col-span-full border-ap-cream-200 rounded-xl">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <Package className="h-12 w-12 text-ap-cream-600" />
          <p className="text-ap-cream-800 text-center">
            Aucune palette en stock. Commencez par créer des zones de stockage et
            des références produit, puis enregistrez vos premières palettes.
          </p>
          <Button onClick={handleSeed} disabled={seedLoading} className="bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800">
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
      <div className="rounded-lg bg-ap-green-100 p-4">
        <div className="flex items-center gap-2 text-xs text-ap-green-800">
          <BarChart3 className="h-4 w-4" />
          Km moyen global
        </div>
        <p
          className="text-2xl font-medium mt-1"
          style={{ color: getKmColor(avgLevel) }}
        >
          {formatKm(weightedAverage)}
        </p>
      </div>

      <div className={`rounded-lg p-4 ${alertCount > 0 ? 'bg-amber-50' : 'bg-ap-green-100'}`}>
        <div className={`flex items-center gap-2 text-xs ${alertCount > 0 ? 'text-amber-800' : 'text-ap-green-800'}`}>
          <AlertTriangle className="h-4 w-4" />
          Palettes en alerte
        </div>
        <p className={`text-2xl font-medium mt-1 ${alertCount > 0 ? 'text-amber-900' : 'text-ap-green-900'}`}>
          {alertCount}
        </p>
      </div>

      <div className="rounded-lg bg-ap-cream-100 p-4">
        <div className="flex items-center gap-2 text-xs text-ap-cream-700">
          <Wallet className="h-4 w-4" />
          Valeur en stock
        </div>
        <p className="text-2xl font-medium mt-1 text-ap-green-900">
          {formatCurrency(totalStockValue)}
        </p>
      </div>

      <div className="rounded-lg bg-ap-cream-100 p-4">
        <div className="flex items-center gap-2 text-xs text-ap-cream-700">
          <Package className="h-4 w-4" />
          Occupation moyenne
        </div>
        <p className="text-2xl font-medium mt-1 text-ap-green-900">
          {formatPercent(avgOccupancy * 100)}
        </p>
      </div>
    </>
  )
}
