import { createServerClient } from '@/lib/supabase/server'
import type { Profile, RhPosition, RhAgency, RhSettings } from '@/types/database'
import { ParametresClient } from './parametres-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return { title: "Paramètres RH — AgroPilot.IA" }
}

export default async function ParametresPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single<Pick<Profile, 'organization_id' | 'role'>>()

  if (!profile?.organization_id) return null

  const canBeAdmin = ['owner', 'admin'].includes(profile.role)

  const [positionsRes, agenciesRes, settingsRes] = await Promise.all([
    supabase
      .from('rh_positions')
      .select('*')
      .order('sort_order')
      .returns<RhPosition[]>(),
    supabase
      .from('rh_agencies')
      .select('*')
      .order('name')
      .returns<RhAgency[]>(),
    supabase
      .from('rh_settings')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .single<RhSettings>(),
  ])

  let settings = settingsRes.data
  if (!settings) {
    const { data: created } = await supabase
      .from('rh_settings')
      .insert({ organization_id: profile.organization_id })
      .select()
      .single<RhSettings>()
    settings = created
  }

  return (
    <ParametresClient
      positions={positionsRes.data ?? []}
      agencies={agenciesRes.data ?? []}
      settings={settings!}
      orgSlug={orgSlug}
      canBeAdmin={canBeAdmin}
    />
  )
}
