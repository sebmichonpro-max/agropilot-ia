import { ModuleLayout } from '@/components/shared/module-layout'
import { ProductForm } from '../components/product-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nouveau produit — AgroPilot.IA',
}

export default async function NouveauProduitPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  return (
    <ModuleLayout
      title="Nouveau produit"
      breadcrumbs={[
        { label: 'Produits', href: `/${orgSlug}/produits` },
        { label: 'Nouveau' },
      ]}
    >
      <ProductForm orgSlug={orgSlug} />
    </ModuleLayout>
  )
}
