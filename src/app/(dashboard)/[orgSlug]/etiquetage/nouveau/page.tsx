import { ModuleLayout } from '@/components/shared/module-layout'
import { LabelForm } from '../components/label-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nouvelle étiquette — AgroPilot.IA',
}

export default async function NouvelleEtiquettePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  return (
    <ModuleLayout
      title="Nouvelle étiquette"
      breadcrumbs={[
        { label: 'Étiquetage', href: `/${orgSlug}/etiquetage` },
        { label: 'Nouvelle' },
      ]}
    >
      <LabelForm orgSlug={orgSlug} />
    </ModuleLayout>
  )
}
