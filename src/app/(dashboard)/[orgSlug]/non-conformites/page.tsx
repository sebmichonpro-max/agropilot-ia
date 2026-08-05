import { ModuleLayout } from '@/components/shared/module-layout'
import { NcList } from './components/nc-list'
import { getNonConformities } from './actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Non-conformités — AgroPilot.IA',
}

export default async function NonConformitesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const nonConformities = await getNonConformities()

  return (
    <ModuleLayout
      title="Non-conformités"
      description="Déclarez, analysez et suivez les non-conformités"
    >
      <NcList nonConformities={nonConformities} orgSlug={orgSlug} />
    </ModuleLayout>
  )
}
