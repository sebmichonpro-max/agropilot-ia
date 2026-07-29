import { createServerClient } from '@/lib/supabase/server'
import type { RhEmployee, RhClockEvent, RhAgency, RhPosition, Profile } from '@/types/database'
import { PointageClient } from './components/pointage-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return { title: "Point'age — AgroPilot.IA" }
}

export default async function PointagePage({
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

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [employeesRes, eventsRes, agenciesRes, positionsRes] = await Promise.all([
    supabase
      .from('rh_employees')
      .select('*')
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('full_name')
      .returns<RhEmployee[]>(),
    supabase
      .from('rh_clock_events')
      .select('*')
      .gte('event_time', todayStart.toISOString())
      .order('event_time', { ascending: true })
      .returns<RhClockEvent[]>(),
    supabase
      .from('rh_agencies')
      .select('*')
      .order('name')
      .returns<RhAgency[]>(),
    supabase
      .from('rh_positions')
      .select('*')
      .order('sort_order')
      .returns<RhPosition[]>(),
  ])

  return (
    <PointageClient
      employees={employeesRes.data ?? []}
      events={eventsRes.data ?? []}
      agencies={agenciesRes.data ?? []}
      positions={positionsRes.data ?? []}
      orgSlug={orgSlug}
      canBeAdmin={canBeAdmin}
    />
  )
}
