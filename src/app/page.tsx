import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import type { Profile, Organization } from '@/types/database'

export default async function HomePage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single<Pick<Profile, 'organization_id'>>()

  if (!profile?.organization_id) redirect('/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('slug')
    .eq('id', profile.organization_id)
    .is('deleted_at', null)
    .single<Pick<Organization, 'slug'>>()

  if (!org) redirect('/login')

  redirect(`/${org.slug}/dashboard`)
}
