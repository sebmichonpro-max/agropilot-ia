export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { PrevProdTabs } from '../components/prev-prod-tabs'
import { ImportClient } from './components/import-client'

export async function generateMetadata() {
  return { title: "Import — Prev'Prod — AgroPilot.IA" }
}

export default async function ImportPage({
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

  const { data: recentBatches } = await supabase
    .from('prev_import_batches')
    .select('*')
    .order('imported_at', { ascending: false })
    .limit(10)

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ap-green-900 mb-4">Prev&apos;Prod</h1>
      <PrevProdTabs orgSlug={orgSlug} />
      <ImportClient orgSlug={orgSlug} recentBatches={recentBatches ?? []} />
    </div>
  )
}
