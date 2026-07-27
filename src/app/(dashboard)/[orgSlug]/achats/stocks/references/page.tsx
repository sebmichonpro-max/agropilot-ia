import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ModuleLayout } from '@/components/shared/module-layout'
import { STORAGE_TYPE_LABELS } from '@/modules/km/constants'
import { formatCurrency } from '@/modules/km/formatters'
import type { ProductReference } from '@/modules/km/types'

export default async function ReferencesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const supabase = await createServerClient()

  const { data: refs } = await supabase
    .from('product_references')
    .select('*')
    .is('deleted_at', null)
    .order('name')
    .returns<ProductReference[]>()

  return (
    <ModuleLayout
      title="Références produit"
      breadcrumbs={[
        { label: 'Stocks', href: `/${orgSlug}/achats/stocks` },
        { label: 'Références' },
      ]}
    >
      <Link href={`/${orgSlug}/achats/stocks/references/nouveau`}>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> Nouvelle référence
        </Button>
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(refs ?? []).map((ref) => (
          <Card key={ref.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{ref.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{ref.code}</p>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>
                Prix : {formatCurrency(ref.unit_price_cents)}/{ref.unit}
              </p>
              {ref.family && (
                <Badge variant="secondary">{ref.family}</Badge>
              )}
              {ref.supplier && (
                <p className="text-muted-foreground">
                  Fournisseur : {ref.supplier}
                </p>
              )}
              {ref.default_storage_type && (
                <p className="text-muted-foreground">
                  Stockage : {STORAGE_TYPE_LABELS[ref.default_storage_type]}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {(!refs || refs.length === 0) && (
          <p className="text-muted-foreground col-span-full">
            Aucune référence produit créée
          </p>
        )}
      </div>
    </ModuleLayout>
  )
}
