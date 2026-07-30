export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { ProdPulseTabs } from '../components/prod-pulse-tabs'
import { SaisieClient } from './components/saisie-client'

export async function generateMetadata() {
  return { title: "Saisie atelier — Prod'Pulse — AgroPilot.IA" }
}

export default async function SaisiePage({
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

  const [linesRes, productsRes, causesRes] = await Promise.all([
    supabase.from('production_lines').select('*').is('deleted_at', null).eq('is_active', true).order('name'),
    supabase.from('pp_products').select('*').is('deleted_at', null).eq('is_active', true).order('name'),
    supabase.from('stop_causes').select('*').is('deleted_at', null).eq('is_active', true).order('display_order'),
  ])

  return (
    <div>
      <ProdPulseTabs orgSlug={orgSlug} />
      <SaisieClient
        orgSlug={orgSlug}
        lines={linesRes.data ?? []}
        products={productsRes.data ?? []}
        causes={causesRes.data ?? []}
      />
    </div>
  )
}
