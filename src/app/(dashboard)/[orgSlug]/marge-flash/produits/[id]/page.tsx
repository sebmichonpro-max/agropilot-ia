export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { notFound } from 'next/navigation'
import { MargeTabs } from '../../components/marge-tabs'
import { ProductDetail } from '../components/product-detail'
import {
  getProductSheet,
  getRecipeLines,
  getPackagingLines,
  getProductLabor,
  getIngredients,
  getPackagingItems,
  getLaborPoles,
  getCategories,
  getCustomers,
} from '../../actions'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sheet = await getProductSheet(id)
  return { title: `${sheet?.name ?? 'Fiche produit'} — Marge Flash — AgroPilot.IA` }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}) {
  const { orgSlug, id } = await params
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single<Pick<Profile, 'organization_id'>>()
  if (!profile?.organization_id) return null

  const sheet = await getProductSheet(id)
  if (!sheet) notFound()

  const [recipeLines, packagingLines, productLabor, ingredients, packagingItems, laborPoles, categories, customers] = await Promise.all([
    getRecipeLines(id),
    getPackagingLines(id),
    getProductLabor(id),
    getIngredients(),
    getPackagingItems(),
    getLaborPoles(),
    getCategories(),
    getCustomers(),
  ])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ap-green-900 mb-4">Marge Flash</h1>
      <MargeTabs orgSlug={orgSlug} />
      <ProductDetail
        orgSlug={orgSlug}
        sheet={sheet}
        recipeLines={recipeLines}
        packagingLines={packagingLines}
        productLabor={productLabor}
        ingredients={ingredients}
        packagingItems={packagingItems}
        laborPoles={laborPoles}
        categories={categories}
        customers={customers}
      />
    </div>
  )
}
