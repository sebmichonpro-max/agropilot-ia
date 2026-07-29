import { createServerClient } from '@/lib/supabase/server'
import type { Profile, RhEmployee, RhAgency } from '@/types/database'
import { RecapClient } from './recap-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return { title: "Récapitulatif — AgroPilot.IA" }
}

export default async function RecapPage({
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

  const [employeesRes, agenciesRes] = await Promise.all([
    supabase
      .from('rh_employees')
      .select('*')
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('full_name')
      .returns<RhEmployee[]>(),
    supabase
      .from('rh_agencies')
      .select('*')
      .order('name')
      .returns<RhAgency[]>(),
  ])

  return (
    <RecapClient
      employees={employeesRes.data ?? []}
      agencies={agenciesRes.data ?? []}
      orgSlug={orgSlug}
      canBeAdmin={canBeAdmin}
    />
  )
}
