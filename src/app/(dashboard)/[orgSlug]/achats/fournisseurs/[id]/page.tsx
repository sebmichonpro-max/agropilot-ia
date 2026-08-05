import { notFound } from 'next/navigation'
import { ModuleLayout } from '@/components/shared/module-layout'
import { SupplierForm } from '../components/supplier-form'
import { getSupplier } from '../actions'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supplier = await getSupplier(id)
  return { title: `${supplier?.name ?? 'Fournisseur'} — AgroPilot.IA` }
}

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}) {
  const { orgSlug, id } = await params
  const supplier = await getSupplier(id)

  if (!supplier) notFound()

  return (
    <ModuleLayout
      title={supplier.name}
      breadcrumbs={[
        { label: 'Fournisseurs', href: `/${orgSlug}/achats/fournisseurs` },
        { label: supplier.name },
      ]}
    >
      <SupplierForm orgSlug={orgSlug} supplier={supplier} />
    </ModuleLayout>
  )
}
