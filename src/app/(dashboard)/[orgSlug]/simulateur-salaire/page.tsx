import { createServerClient } from '@/lib/supabase/server'
import type { Profile, SimSettings } from '@/types/database'
import { SimulatorClient } from './components/simulator-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return { title: "Simul'Paie — AgroPilot.IA" }
}

export default async function SimulateurSalairePage({
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

  const { data: settings } = await supabase
    .from('sim_settings')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .single<SimSettings>()

  return <SimulatorClient orgSlug={orgSlug} settings={settings} />
}
