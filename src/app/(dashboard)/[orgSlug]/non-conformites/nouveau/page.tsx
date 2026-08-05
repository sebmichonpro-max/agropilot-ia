import { ModuleLayout } from '@/components/shared/module-layout'
import { NcForm } from '../components/nc-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nouvelle NC — AgroPilot.IA',
}

export default async function NouvelleNcPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  return (
    <ModuleLayout
      title="Déclarer une non-conformité"
      breadcrumbs={[
        { label: 'Non-conformités', href: `/${orgSlug}/non-conformites` },
        { label: 'Nouvelle' },
      ]}
    >
      <NcForm orgSlug={orgSlug} />
    </ModuleLayout>
  )
}
