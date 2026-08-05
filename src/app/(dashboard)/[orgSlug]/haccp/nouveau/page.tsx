import { ModuleLayout } from '@/components/shared/module-layout'
import { HaccpPlanForm } from '../components/haccp-plan-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nouveau plan HACCP — AgroPilot.IA',
}

export default async function NouveauHaccpPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  return (
    <ModuleLayout
      title="Nouveau plan HACCP"
      breadcrumbs={[
        { label: 'HACCP', href: `/${orgSlug}/haccp` },
        { label: 'Nouveau' },
      ]}
    >
      <HaccpPlanForm orgSlug={orgSlug} />
    </ModuleLayout>
  )
}
