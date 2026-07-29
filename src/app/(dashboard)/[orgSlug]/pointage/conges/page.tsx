import { createServerClient } from '@/lib/supabase/server'
import type { Profile, RhEmployee, RhAbsence } from '@/types/database'
import { CongesClient } from './conges-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return { title: "Congés & Absences — AgroPilot.IA" }
}

export default async function CongesPage({
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

  const isAdmin = ['owner', 'admin'].includes(profile.role)

  const [employeesRes, absencesRes] = await Promise.all([
    supabase
      .from('rh_employees')
      .select('*')
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('full_name')
      .returns<RhEmployee[]>(),
    supabase
      .from('rh_absences')
      .select('*')
      .order('start_date', { ascending: false })
      .returns<RhAbsence[]>(),
  ])

  return (
    <CongesClient
      employees={employeesRes.data ?? []}
      absences={absencesRes.data ?? []}
      orgSlug={orgSlug}
      isAdmin={isAdmin}
    />
  )
}
