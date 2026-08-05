import { ModuleLayout } from '@/components/shared/module-layout'
import { HaccpPlanList } from './components/haccp-plan-list'
import { getHaccpPlans } from './actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HACCP — AgroPilot.IA',
}

export default async function HaccpPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const plans = await getHaccpPlans()

  return (
    <ModuleLayout
      title="HACCP"
      description="Plans HACCP, points critiques et enregistrements de surveillance"
    >
      <HaccpPlanList plans={plans} orgSlug={orgSlug} />
    </ModuleLayout>
  )
}
