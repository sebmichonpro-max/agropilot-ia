import { notFound } from 'next/navigation'
import { ModuleLayout } from '@/components/shared/module-layout'
import { AuditForm } from '../components/audit-form'
import { getAudit } from '../actions'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const audit = await getAudit(id)
  return { title: `${audit?.title ?? 'Audit'} — AgroPilot.IA` }
}

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}) {
  const { orgSlug, id } = await params
  const audit = await getAudit(id)

  if (!audit) notFound()

  return (
    <ModuleLayout
      title={`${audit.audit_number} — ${audit.title}`}
      breadcrumbs={[
        { label: 'Audits', href: `/${orgSlug}/audits` },
        { label: audit.audit_number },
      ]}
    >
      <AuditForm orgSlug={orgSlug} audit={audit} />
    </ModuleLayout>
  )
}
