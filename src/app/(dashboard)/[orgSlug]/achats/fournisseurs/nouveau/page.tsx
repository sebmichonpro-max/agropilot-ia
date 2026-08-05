import { ModuleLayout } from '@/components/shared/module-layout'
import { SupplierForm } from '../components/supplier-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nouveau fournisseur — AgroPilot.IA',
}

export default async function NouveauFournisseurPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  return (
    <ModuleLayout
      title="Nouveau fournisseur"
      breadcrumbs={[
        { label: 'Fournisseurs', href: `/${orgSlug}/achats/fournisseurs` },
        { label: 'Nouveau' },
      ]}
    >
      <SupplierForm orgSlug={orgSlug} />
    </ModuleLayout>
  )
}
