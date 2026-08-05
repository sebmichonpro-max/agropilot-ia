'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { labelSchema } from '@/lib/validation/label'
import type { ProductLabel } from '@/types/database'

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

export async function getLabels() {
  const { supabase, orgId } = await getOrgId()
  if (!orgId) return []

  const { data } = await supabase
    .from('product_labels')
    .select('*')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .returns<ProductLabel[]>()

  return data ?? []
}

export async function getLabel(id: string) {
  const { supabase, orgId } = await getOrgId()
  if (!orgId) return null

  const { data } = await supabase
    .from('product_labels')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single<ProductLabel>()

  return data
}

export async function createLabel(
  orgSlug: string,
  data: Record<string, unknown>
): Promise<{ success?: boolean; error?: string; id?: string }> {
  try {
    const { supabase, orgId, userId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = labelSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { data: label, error } = await supabase
      .from('product_labels')
      .insert({ ...parsed.data, organization_id: orgId, created_by: userId })
      .select('id')
      .single()

    if (error) return { error: "Erreur lors de la création de l'étiquette" }

    revalidatePath(`/${orgSlug}/etiquetage`)
    return { success: true, id: label.id }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function updateLabel(
  orgSlug: string,
  id: string,
  data: Record<string, unknown>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = labelSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { error } = await supabase
      .from('product_labels')
      .update(parsed.data)
      .eq('id', id)
      .eq('organization_id', orgId)

    if (error) return { error: 'Erreur lors de la mise à jour' }

    revalidatePath(`/${orgSlug}/etiquetage`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}
