export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { ProdPulseTabs } from '../components/prod-pulse-tabs'
import { ConfigClient } from './components/config-client'

export async function generateMetadata() {
  return { title: "Configuration — Prod'Pulse — AgroPilot.IA" }
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
    .select('organization_id, role')
    .eq('id', user.id)
    .single<Pick<Profile, 'organization_id' | 'role'>>()
  if (!profile?.organization_id) return null

  const [linesRes, productsRes, causesRes, thresholdsRes] = await Promise.all([
    supabase.from('production_lines').select('*').is('deleted_at', null).order('name'),
    supabase.from('pp_products').select('*').is('deleted_at', null).order('name'),
    supabase.from('stop_causes').select('*').is('deleted_at', null).order('display_order'),
    supabase.from('trs_thresholds').select('*').maybeSingle(),
  ])

  return (
    <div>
      <ProdPulseTabs orgSlug={orgSlug} />
      <ConfigClient
        orgSlug={orgSlug}
        lines={linesRes.data ?? []}
        products={productsRes.data ?? []}
        causes={causesRes.data ?? []}
        thresholds={thresholdsRes.data}
      />
    </div>
  )
}
