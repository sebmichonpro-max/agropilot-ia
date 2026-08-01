export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import type { Profile, VeilleReport, VeilleSearch } from '@/types/database'
import { VeilleClient } from './components/veille-client'

export async function generateMetadata() {
  return { title: 'Veille Qualité — AgroPilot.IA' }
}

export default async function VeilleQualitePage({
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

  const [reportsRes, searchesRes] = await Promise.all([
    supabase
      .from('veille_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('veille_searches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ap-green-900 mb-4">
        Veille Qualité
      </h1>
      <VeilleClient
        orgSlug={orgSlug}
        reports={(reportsRes.data ?? []) as VeilleReport[]}
        searches={(searchesRes.data ?? []) as VeilleSearch[]}
      />
    </div>
  )
}
