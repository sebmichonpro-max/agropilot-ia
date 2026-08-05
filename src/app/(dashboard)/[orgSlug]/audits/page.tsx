import { ModuleLayout } from '@/components/shared/module-layout'
import { AuditList } from './components/audit-list'
import { getAudits } from './actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Audits — AgroPilot.IA',
}

export default async function AuditsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const audits = await getAudits()

  return (
    <ModuleLayout
      title="Audits"
      description="Planifiez, réalisez et suivez vos audits qualité"
    >
      <AuditList audits={audits} orgSlug={orgSlug} />
    </ModuleLayout>
  )
}
