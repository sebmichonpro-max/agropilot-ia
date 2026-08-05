import { notFound } from 'next/navigation'
import { ModuleLayout } from '@/components/shared/module-layout'
import { LabelForm } from '../components/label-form'
import { getLabel } from '../actions'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const label = await getLabel(id)
  return { title: `${label?.label_name ?? 'Étiquette'} — AgroPilot.IA` }
}

export default async function LabelDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}) {
  const { orgSlug, id } = await params
  const label = await getLabel(id)

  if (!label) notFound()

  return (
    <ModuleLayout
      title={label.label_name}
      breadcrumbs={[
        { label: 'Étiquetage', href: `/${orgSlug}/etiquetage` },
        { label: label.label_name },
      ]}
    >
      <LabelForm orgSlug={orgSlug} label={label} />
    </ModuleLayout>
  )
}
