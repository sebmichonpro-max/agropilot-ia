export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { ProdPulseTabs } from './components/prod-pulse-tabs'
import { TrsDashboard } from './components/trs-dashboard'

export async function generateMetadata() {
  return { title: "Prod'Pulse — TRS — AgroPilot.IA" }
}

export default async function ProdPulsePage({
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

  return (
    <div>
      <ProdPulseTabs orgSlug={orgSlug} />
      <TrsDashboard orgSlug={orgSlug} />
    </div>
  )
}
