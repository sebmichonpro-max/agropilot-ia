'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Profile } from '@/types/database'

async function getOrgContext() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single<Pick<Profile, 'organization_id'>>()

  if (!profile?.organization_id) throw new Error('Profil introuvable')

  return { supabase, userId: user.id, orgId: profile.organization_id }
}

export async function saveReport(
  orgSlug: string,
  scannerId: string,
  content: string
) {
  try {
    const { supabase, userId, orgId } = await getOrgContext()

    const { error } = await supabase.from('veille_reports').insert({
      organization_id: orgId,
      scanner_id: scannerId,
      content,
      created_by: userId,
    })

    if (error) return { error: 'Erreur lors de la sauvegarde du rapport' }

    revalidatePath(`/${orgSlug}/veille-qualite`)
    return { success: true }
  } catch {
    return { error: 'Erreur serveur' }
  }
}

export async function saveSearch(
  orgSlug: string,
  query: string,
  content: string
) {
  try {
    const { supabase, userId, orgId } = await getOrgContext()

    const { error } = await supabase.from('veille_searches').insert({
      organization_id: orgId,
      query,
      content,
      created_by: userId,
    })

    if (error) return { error: 'Erreur lors de la sauvegarde' }

    revalidatePath(`/${orgSlug}/veille-qualite`)
    return { success: true }
  } catch {
    return { error: 'Erreur serveur' }
  }
}

export async function deleteReport(orgSlug: string, reportId: string) {
  try {
    const { supabase } = await getOrgContext()

    const { error } = await supabase
      .from('veille_reports')
      .delete()
      .eq('id', reportId)

    if (error) return { error: 'Erreur lors de la suppression' }

    revalidatePath(`/${orgSlug}/veille-qualite`)
    return { success: true }
  } catch {
    return { error: 'Erreur serveur' }
  }
}

export async function deleteSearch(orgSlug: string, searchId: string) {
  try {
    const { supabase } = await getOrgContext()

    const { error } = await supabase
      .from('veille_searches')
      .delete()
      .eq('id', searchId)

    if (error) return { error: 'Erreur lors de la suppression' }

    revalidatePath(`/${orgSlug}/veille-qualite`)
    return { success: true }
  } catch {
    return { error: 'Erreur serveur' }
  }
}
