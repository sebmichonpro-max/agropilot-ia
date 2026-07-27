import { ModuleLayout } from '@/components/shared/module-layout'
import { ReferenceForm } from '../../components/reference-form'

export default async function NewReferencePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  return (
    <ModuleLayout
      title="Nouvelle référence"
      breadcrumbs={[
        { label: 'Stocks', href: `/${orgSlug}/achats/stocks` },
        { label: 'Références', href: `/${orgSlug}/achats/stocks/references` },
        { label: 'Nouveau' },
      ]}
    >
      <div className="max-w-lg">
        <ReferenceForm orgSlug={orgSlug} />
      </div>
    </ModuleLayout>
  )
}
