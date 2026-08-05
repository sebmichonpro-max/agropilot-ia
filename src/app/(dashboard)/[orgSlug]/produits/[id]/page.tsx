import { notFound } from 'next/navigation'
import { ModuleLayout } from '@/components/shared/module-layout'
import { ProductForm } from '../components/product-form'
import { getProduct } from '../actions'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  return { title: `${product?.name ?? 'Produit'} — AgroPilot.IA` }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}) {
  const { orgSlug, id } = await params
  const product = await getProduct(id)

  if (!product) notFound()

  return (
    <ModuleLayout
      title={product.name}
      breadcrumbs={[
        { label: 'Produits', href: `/${orgSlug}/produits` },
        { label: product.name },
      ]}
    >
      <ProductForm orgSlug={orgSlug} product={product} />
    </ModuleLayout>
  )
}
