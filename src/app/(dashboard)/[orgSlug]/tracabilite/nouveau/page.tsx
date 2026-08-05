import { ModuleLayout } from '@/components/shared/module-layout'
import { LotForm } from '../components/lot-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nouveau lot — AgroPilot.IA',
}

export default async function NouveauLotPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  return (
    <ModuleLayout
      title="Nouveau lot"
      breadcrumbs={[
        { label: 'Traçabilité', href: `/${orgSlug}/tracabilite` },
        { label: 'Nouveau' },
      ]}
    >
      <LotForm orgSlug={orgSlug} />
    </ModuleLayout>
  )
}
