import { notFound } from 'next/navigation'
import { ModuleLayout } from '@/components/shared/module-layout'
import { HaccpPlanForm } from '../components/haccp-plan-form'
import { getHaccpPlan } from '../actions'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const plan = await getHaccpPlan(id)
  return { title: `${plan?.name ?? 'Plan HACCP'} — AgroPilot.IA` }
}

export default async function HaccpPlanDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}) {
  const { orgSlug, id } = await params
  const plan = await getHaccpPlan(id)

  if (!plan) notFound()

  return (
    <ModuleLayout
      title={plan.name}
      breadcrumbs={[
        { label: 'HACCP', href: `/${orgSlug}/haccp` },
        { label: plan.name },
      ]}
    >
      <HaccpPlanForm orgSlug={orgSlug} plan={plan} />
    </ModuleLayout>
  )
}
