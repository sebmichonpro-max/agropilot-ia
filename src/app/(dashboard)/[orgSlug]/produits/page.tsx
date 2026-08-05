import { ModuleLayout } from '@/components/shared/module-layout'
import { ProductList } from './components/product-list'
import { getProducts } from './actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fiches produits — AgroPilot.IA',
}

export default async function ProduitsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const products = await getProducts()

  return (
    <ModuleLayout
      title="Fiches produits"
      description="Gérez vos produits, compositions et allergènes"
    >
      <ProductList products={products} orgSlug={orgSlug} />
    </ModuleLayout>
  )
}
