export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { PrevProdTabs } from '../components/prev-prod-tabs'
import { ConfigPrevClient } from './components/config-prev-client'

export async function generateMetadata() {
  return { title: "Configuration — Prev'Prod — AgroPilot.IA" }
}

export default async function ConfigurationPage({
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

  const [linesRes, mixersRes, recipesRes, productsRes, clientsRes, holidaysRes] = await Promise.all([
    supabase.from('prev_lines').select('*').is('deleted_at', null).order('sort_order'),
    supabase.from('prev_mixers').select('*').is('deleted_at', null).order('sort_order'),
    supabase.from('prev_recipes').select('*').is('deleted_at', null).order('name'),
    supabase.from('prev_products').select('*').is('deleted_at', null).order('code'),
    supabase.from('prev_clients').select('*').is('deleted_at', null).order('name'),
    supabase.from('prev_holidays').select('*').order('date'),
  ])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ap-green-900 mb-4">Prev&apos;Prod</h1>
      <PrevProdTabs orgSlug={orgSlug} />
      <ConfigPrevClient
        orgSlug={orgSlug}
        lines={linesRes.data ?? []}
        mixers={mixersRes.data ?? []}
        recipes={recipesRes.data ?? []}
        products={productsRes.data ?? []}
        clients={clientsRes.data ?? []}
        holidays={holidaysRes.data ?? []}
      />
    </div>
  )
}
