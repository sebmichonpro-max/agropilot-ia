import { createServerClient } from '@/lib/supabase/server'
import { ModuleLayout } from '@/components/shared/module-layout'
import { PalletForm } from '../../components/pallet-form'
import type { StorageZone, ProductReference } from '@/modules/km/types'

export default async function NewPalletPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const supabase = await createServerClient()

  const [zonesResult, refsResult] = await Promise.all([
    supabase
      .from('storage_zones')
      .select('*')
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('name')
      .returns<StorageZone[]>(),
    supabase
      .from('product_references')
      .select('*')
      .is('deleted_at', null)
      .order('name')
      .returns<ProductReference[]>(),
  ])

  return (
    <ModuleLayout
      title="Entrée palette"
      breadcrumbs={[
        { label: 'Stocks', href: `/${orgSlug}/achats/stocks` },
        { label: 'Palettes', href: `/${orgSlug}/achats/stocks/palettes` },
        { label: 'Nouveau' },
      ]}
    >
      <div className="max-w-lg">
        <PalletForm
          orgSlug={orgSlug}
          zones={zonesResult.data ?? []}
          references={refsResult.data ?? []}
        />
      </div>
    </ModuleLayout>
  )
}
