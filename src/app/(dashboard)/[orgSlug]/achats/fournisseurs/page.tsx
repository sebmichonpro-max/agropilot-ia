import { ModuleLayout } from '@/components/shared/module-layout'
import { SupplierList } from './components/supplier-list'
import { getSuppliers } from './actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fournisseurs — AgroPilot.IA',
}

export default async function FournisseursPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const suppliers = await getSuppliers()

  return (
    <ModuleLayout
      title="Fournisseurs"
      description="Gérez vos fournisseurs, agréments et évaluations"
    >
      <SupplierList suppliers={suppliers} orgSlug={orgSlug} />
    </ModuleLayout>
  )
}
