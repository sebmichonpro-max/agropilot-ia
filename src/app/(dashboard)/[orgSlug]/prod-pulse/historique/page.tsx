export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { ProdPulseTabs } from '../components/prod-pulse-tabs'
import { HistoriqueClient } from './components/historique-client'

export async function generateMetadata() {
  return { title: "Historique — Prod'Pulse — AgroPilot.IA" }
}

export default async function HistoriquePage({
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

  const [linesRes, sessionsRes] = await Promise.all([
    supabase.from('production_lines').select('id, name').is('deleted_at', null).order('name'),
    supabase
      .from('production_sessions')
      .select('*, production_lines(name), pp_products(name, unit_label)')
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(100),
  ])

  return (
    <div>
      <ProdPulseTabs orgSlug={orgSlug} />
      <HistoriqueClient
        orgSlug={orgSlug}
        lines={linesRes.data ?? []}
        sessions={sessionsRes.data ?? []}
      />
    </div>
  )
}
