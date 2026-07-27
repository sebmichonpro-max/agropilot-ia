import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ModuleLayout } from '@/components/shared/module-layout'
import { STORAGE_TYPE_LABELS } from '@/modules/km/constants'
import { formatCurrency } from '@/modules/km/formatters'
import type { StorageZone } from '@/modules/km/types'

export default async function ZonesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const supabase = await createServerClient()

  const { data: zones } = await supabase
    .from('storage_zones')
    .select('*')
    .is('deleted_at', null)
    .order('name')
    .returns<StorageZone[]>()

  return (
    <ModuleLayout
      title="Zones de stockage"
      breadcrumbs={[
        { label: 'Stocks', href: `/${orgSlug}/achats/stocks` },
        { label: 'Zones' },
      ]}
    >
      <Link href={`/${orgSlug}/achats/stocks/zones/nouveau`}>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> Nouvelle zone
        </Button>
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(zones ?? []).map((zone) => (
          <Card key={zone.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{zone.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Badge variant="secondary">
                {STORAGE_TYPE_LABELS[zone.storage_type]}
              </Badge>
              {zone.temperature_min != null && zone.temperature_max != null && (
                <p className="text-muted-foreground">
                  {zone.temperature_min}°C à {zone.temperature_max}°C
                </p>
              )}
              <p>
                Coût : {formatCurrency(zone.daily_cost_cents)}/jour
              </p>
              <p className="text-muted-foreground">
                Facteur thermique : {(zone.thermal_factor / 100).toFixed(1)}
              </p>
              {zone.capacity_pallets && (
                <p className="text-muted-foreground">
                  Capacité : {zone.capacity_pallets} palettes
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {(!zones || zones.length === 0) && (
          <p className="text-muted-foreground col-span-full">
            Aucune zone de stockage créée
          </p>
        )}
      </div>
    </ModuleLayout>
  )
}
