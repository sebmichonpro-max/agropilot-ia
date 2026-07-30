import { createServerClient } from '@/lib/supabase/server'
import type { Profile, SimSettings } from '@/types/database'
import { SettingsClient } from './settings-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return { title: "Paramètres Simul'Paie — AgroPilot.IA" }
}

export default async function ParametresSimulPage({
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
    .select('organization_id')
    .eq('id', user.id)
    .single<Pick<Profile, 'organization_id'>>()

  if (!profile?.organization_id) return null

  let { data: settings } = await supabase
    .from('sim_settings')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .single<SimSettings>()

  if (!settings) {
    const { data: created } = await supabase
      .from('sim_settings')
      .insert({ organization_id: profile.organization_id })
      .select()
      .single<SimSettings>()
    settings = created
  }

  return <SettingsClient settings={settings!} orgSlug={orgSlug} />
}
