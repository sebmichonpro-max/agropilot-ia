import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ModuleLayout } from '@/components/shared/module-layout'
import { KmBadge } from '../../components/km-badge'
import { KmGauge } from '../../components/km-gauge'
import { PalletQuantityChart, PalletKmChart } from '../../components/pallet-detail'
import { PdfExportButton } from '../../components/pdf-export-button'
import { calculateKm, buildDailyCurve, getKmLevel } from '@/modules/km/calculator'
import {
  formatWeight,
  formatDays,
  formatCurrency,
} from '@/modules/km/formatters'
import {
  STORAGE_TYPE_LABELS,
  PALLET_STATUS_LABELS,
  MOVEMENT_TYPE_LABELS,
  KM_LEVELS,
} from '@/modules/km/constants'
import type {
  Pallet,
  PalletMovement,
  StorageZone,
  ProductReference,
  KmSettings,
} from '@/modules/km/types'

export default async function PalletDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; palletId: string }>
}) {
  const { orgSlug, palletId } = await params
  const supabase = await createServerClient()

  const { data: pallet } = await supabase
    .from('pallets')
    .select('*')
    .eq('id', palletId)
    .is('deleted_at', null)
    .single<Pallet>()

  if (!pallet) notFound()

  const [refResult, zoneResult, movementsResult, settingsResult] =
    await Promise.all([
      supabase
        .from('product_references')
        .select('*')
        .eq('id', pallet.product_reference_id)
        .single<ProductReference>(),
      supabase
        .from('storage_zones')
        .select('*')
        .eq('id', pallet.storage_zone_id)
        .single<StorageZone>(),
      supabase
        .from('pallet_movements')
        .select('*')
        .eq('pallet_id', palletId)
        .order('movement_date', { ascending: true })
        .returns<PalletMovement[]>(),
      supabase
        .from('km_settings')
        .select('*')
        .eq('organization_id', pallet.organization_id)
        .single<KmSettings>(),
    ])

  const reference = refResult.data
  const zone = zoneResult.data
  const movements = movementsResult.data ?? []
  const settings = settingsResult.data

  if (!reference || !zone) notFound()

  const capitalCostRate = settings?.capital_cost_rate ?? 500

  const kmResult = calculateKm({
    initialQuantityGrams: pallet.initial_quantity,
    unitPriceCents: pallet.unit_price_cents,
    dailyCostCents: zone.daily_cost_cents,
    thermalFactor: zone.thermal_factor,
    capitalCostRate,
    entryDate: new Date(pallet.entry_date),
    movements: movements.map((m) => ({
      date: new Date(m.movement_date),
      quantityGrams: m.quantity,
    })),
  })

  const dailyCurve = buildDailyCurve({
    initialQuantityGrams: pallet.initial_quantity,
    unitPriceCents: pallet.unit_price_cents,
    dailyCostCents: zone.daily_cost_cents,
    thermalFactor: zone.thermal_factor,
    capitalCostRate,
    entryDate: new Date(pallet.entry_date),
    movements: movements.map((m) => ({
      date: new Date(m.movement_date),
      quantityGrams: m.quantity,
    })),
  })

  const levelInfo = KM_LEVELS[kmResult.level]

  return (
    <ModuleLayout
      title={reference.name}
      description={`${reference.code} — Lot ${pallet.lot_number ?? '—'}`}
      breadcrumbs={[
        { label: 'Stocks', href: `/${orgSlug}/achats/stocks` },
        { label: 'Palettes', href: `/${orgSlug}/achats/stocks/palettes` },
        { label: reference.name },
      ]}
    >
      <div className="flex flex-wrap gap-2">
        {pallet.status === 'in_stock' && (
          <Link href={`/${orgSlug}/achats/stocks/palettes/${palletId}/mouvement`}>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" /> Enregistrer un prélèvement
            </Button>
          </Link>
        )}
        <PdfExportButton orgSlug={orgSlug} />
      </div>

      {/* Identity card */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Zone</dt>
              <dd>{zone.name} ({STORAGE_TYPE_LABELS[zone.storage_type]})</dd>

              <dt className="text-muted-foreground">Date d&apos;entrée</dt>
              <dd>{new Date(pallet.entry_date).toLocaleDateString('fr-FR')}</dd>

              <dt className="text-muted-foreground">Quantité initiale</dt>
              <dd>{formatWeight(pallet.initial_quantity)}</dd>

              <dt className="text-muted-foreground">Quantité restante</dt>
              <dd>{formatWeight(pallet.current_quantity)}</dd>

              <dt className="text-muted-foreground">Prix unitaire</dt>
              <dd>{formatCurrency(pallet.unit_price_cents)}/kg</dd>

              <dt className="text-muted-foreground">Valeur produit</dt>
              <dd>{formatCurrency(kmResult.productValue)}</dd>

              <dt className="text-muted-foreground">Jours en stock</dt>
              <dd>{formatDays(kmResult.daysInStock)}</dd>

              <dt className="text-muted-foreground">Statut</dt>
              <dd>
                <Badge variant="secondary">
                  {PALLET_STATUS_LABELS[pallet.status]}
                </Badge>
              </dd>

              <dt className="text-muted-foreground">Coût logistique</dt>
              <dd>{formatCurrency(kmResult.logisticCost)}</dd>

              <dt className="text-muted-foreground">Coût financier</dt>
              <dd>{formatCurrency(kmResult.financialCost)}</dd>

              <dt className="text-muted-foreground">Coût total</dt>
              <dd className="font-semibold">{formatCurrency(kmResult.totalCost)}</dd>
            </dl>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center justify-center">
          <CardContent className="pt-6">
            <KmGauge value={kmResult.value} level={kmResult.level} />
            <p className="mt-4 text-xs text-center text-muted-foreground">
              {levelInfo.action}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {dailyCurve.length > 1 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <PalletQuantityChart dailyCurve={dailyCurve} />
          <PalletKmChart dailyCurve={dailyCurve} />
        </div>
      )}

      {/* Movements table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Mouvements ({movements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Quantité</th>
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 font-medium hidden sm:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      {new Date(m.movement_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-2 pr-4">-{formatWeight(m.quantity)}</td>
                    <td className="py-2 pr-4">
                      {MOVEMENT_TYPE_LABELS[m.movement_type] ?? m.movement_type}
                    </td>
                    <td className="py-2 hidden sm:table-cell text-muted-foreground">
                      {m.notes ?? '—'}
                    </td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground">
                      Aucun mouvement enregistré
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </ModuleLayout>
  )
}
