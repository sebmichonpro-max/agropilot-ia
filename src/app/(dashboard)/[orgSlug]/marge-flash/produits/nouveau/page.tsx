export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { MargeTabs } from '../../components/marge-tabs'
import { ProductSheetForm } from '../components/product-sheet-form'
import { getCategories, getCustomers } from '../../actions'

export async function generateMetadata() {
  return { title: 'Nouvelle fiche produit — Marge Flash — AgroPilot.IA' }
}

export default async function NouveauProduitPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single<Pick<Profile, 'organization_id'>>()
  if (!profile?.organization_id) return null

  const [categories, customers] = await Promise.all([getCategories(), getCustomers()])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ap-green-900 mb-4">Marge Flash</h1>
      <MargeTabs orgSlug={orgSlug} />
      <h2 className="text-xl font-medium text-ap-green-900 mb-4">Nouvelle fiche produit</h2>
      <ProductSheetForm
        orgSlug={orgSlug}
        categories={categories}
        customers={customers}
      />
    </div>
  )
}
