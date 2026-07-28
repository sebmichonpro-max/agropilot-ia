import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import type { Organization, Profile } from '@/types/database'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile?.organization_id) {
    // Auto-create org for users without one (e.g. email confirmation disabled)
    const fullName =
      user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Mon'
    const orgName = `${fullName} Organisation`
    const suffix = crypto.randomUUID().slice(0, 8)
    const slug =
      orgName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') +
      '-' +
      suffix

    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: orgName, slug })
      .select('id, slug')
      .single()

    if (org) {
      await supabase
        .from('profiles')
        .update({ organization_id: org.id, role: 'owner' })
        .eq('id', user.id)

      redirect(`/${org.slug}/dashboard`)
    }

    redirect('/login')
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.organization_id)
    .is('deleted_at', null)
    .single<Organization>()

  if (!org) redirect('/login')

  return <>{children}</>
}
