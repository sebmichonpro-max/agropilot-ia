import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ModuleLayout } from '@/components/shared/module-layout'
import { MovementForm } from '../../../components/movement-form'
import type { Pallet, ProductReference } from '@/modules/km/types'

export default async function MovementPage({
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
    .single<Pallet>()

  if (!pallet || pallet.status !== 'in_stock') notFound()

  const { data: reference } = await supabase
    .from('product_references')
    .select('*')
    .eq('id', pallet.product_reference_id)
    .single<ProductReference>()

  if (!reference) notFound()

  return (
    <ModuleLayout
      title="Enregistrer un prélèvement"
      breadcrumbs={[
        { label: 'Stocks', href: `/${orgSlug}/achats/stocks` },
        { label: reference.name, href: `/${orgSlug}/achats/stocks/palettes/${palletId}` },
        { label: 'Mouvement' },
      ]}
    >
      <div className="max-w-lg">
        <MovementForm
          orgSlug={orgSlug}
          palletId={palletId}
          currentQuantityGrams={pallet.current_quantity}
          referenceName={reference.name}
        />
      </div>
    </ModuleLayout>
  )
}
