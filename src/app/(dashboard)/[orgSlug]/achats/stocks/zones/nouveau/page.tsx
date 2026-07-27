import { ModuleLayout } from '@/components/shared/module-layout'
import { ZoneForm } from '../../components/zone-form'

export default async function NewZonePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  return (
    <ModuleLayout
      title="Nouvelle zone"
      breadcrumbs={[
        { label: 'Stocks', href: `/${orgSlug}/achats/stocks` },
        { label: 'Zones', href: `/${orgSlug}/achats/stocks/zones` },
        { label: 'Nouveau' },
      ]}
    >
      <div className="max-w-lg">
        <ZoneForm orgSlug={orgSlug} />
      </div>
    </ModuleLayout>
  )
}
