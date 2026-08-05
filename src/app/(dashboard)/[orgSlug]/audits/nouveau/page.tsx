import { ModuleLayout } from '@/components/shared/module-layout'
import { AuditForm } from '../components/audit-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nouvel audit — AgroPilot.IA',
}

export default async function NouvelAuditPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  return (
    <ModuleLayout
      title="Planifier un audit"
      breadcrumbs={[
        { label: 'Audits', href: `/${orgSlug}/audits` },
        { label: 'Nouveau' },
      ]}
    >
      <AuditForm orgSlug={orgSlug} />
    </ModuleLayout>
  )
}
