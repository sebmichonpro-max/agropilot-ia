import { ModuleLayout } from '@/components/shared/module-layout'
import { LabelList } from './components/label-list'
import { getLabels } from './actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Étiquetage INCO — AgroPilot.IA',
}

export default async function EtiquetagePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const labels = await getLabels()

  return (
    <ModuleLayout
      title="Étiquetage"
      description="Générez des étiquettes conformes au règlement INCO (UE 1169/2011)"
    >
      <LabelList labels={labels} orgSlug={orgSlug} />
    </ModuleLayout>
  )
}
