'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { nonConformitySchema } from '@/lib/validation/non-conformity'
import type { NonConformity } from '@/types/database'

async function getOrgId() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, orgId: null, userId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  return { supabase, orgId: profile?.organization_id ?? null, userId: user.id }
}

function generateNcNumber(): string {
  const now = new Date()
  const y = now.getFullYear().toString().slice(-2)
  const m = (now.getMonth() + 1).toString().padStart(2, '0')
  const r = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `NC-${y}${m}-${r}`
}

export async function getNonConformities() {
  const { supabase, orgId } = await getOrgId()
  if (!orgId) return []

  const { data } = await supabase
    .from('non_conformities')
    .select('*')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .returns<NonConformity[]>()

  return data ?? []
}

export async function getNonConformity(id: string) {
  const { supabase, orgId } = await getOrgId()
  if (!orgId) return null

  const { data } = await supabase
    .from('non_conformities')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single<NonConformity>()

  return data
}

export async function createNonConformity(
  orgSlug: string,
  data: Record<string, unknown>
): Promise<{ success?: boolean; error?: string; id?: string }> {
  try {
    const { supabase, orgId, userId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = nonConformitySchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { data: nc, error } = await supabase
      .from('non_conformities')
      .insert({
        ...parsed.data,
        organization_id: orgId,
        nc_number: generateNcNumber(),
        status: 'open',
        created_by: userId,
      })
      .select('id')
      .single()

    if (error) return { error: 'Erreur lors de la création de la NC' }

    revalidatePath(`/${orgSlug}/non-conformites`)
    return { success: true, id: nc.id }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function updateNonConformity(
  orgSlug: string,
  id: string,
  data: Record<string, unknown>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = nonConformitySchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const updateData: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.corrective_action && parsed.data.root_cause) {
      updateData.status = 'verification'
    }

    const { error } = await supabase
      .from('non_conformities')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', orgId)

    if (error) return { error: 'Erreur lors de la mise à jour' }

    revalidatePath(`/${orgSlug}/non-conformites`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function closeNonConformity(
  orgSlug: string,
  id: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const { error } = await supabase
      .from('non_conformities')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', orgId)

    if (error) return { error: 'Erreur lors de la clôture' }

    revalidatePath(`/${orgSlug}/non-conformites`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}
