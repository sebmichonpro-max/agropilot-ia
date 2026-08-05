import { notFound } from 'next/navigation'
import { ModuleLayout } from '@/components/shared/module-layout'
import { NcForm } from '../components/nc-form'
import { getNonConformity } from '../actions'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const nc = await getNonConformity(id)
  return { title: `${nc?.nc_number ?? 'NC'} — AgroPilot.IA` }
}

export default async function NcDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}) {
  const { orgSlug, id } = await params
  const nc = await getNonConformity(id)

  if (!nc) notFound()

  return (
    <ModuleLayout
      title={`${nc.nc_number} — ${nc.title}`}
      breadcrumbs={[
        { label: 'Non-conformités', href: `/${orgSlug}/non-conformites` },
        { label: nc.nc_number },
      ]}
    >
      <NcForm orgSlug={orgSlug} nc={nc} />
    </ModuleLayout>
  )
}
