'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { supplierSchema } from '@/lib/validation/supplier'
import type { Supplier } from '@/types/database'

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

export async function getSuppliers() {
  const { supabase, orgId } = await getOrgId()
  if (!orgId) return []

  const { data } = await supabase
    .from('suppliers')
    .select('*')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('name')
    .returns<Supplier[]>()

  return data ?? []
}

export async function getSupplier(id: string) {
  const { supabase, orgId } = await getOrgId()
  if (!orgId) return null

  const { data } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single<Supplier>()

  return data
}

export async function createSupplier(
  orgSlug: string,
  data: Record<string, unknown>
): Promise<{ success?: boolean; error?: string; id?: string }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = supplierSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert({ ...parsed.data, organization_id: orgId })
      .select('id')
      .single()

    if (error) return { error: 'Erreur lors de la création du fournisseur' }

    revalidatePath(`/${orgSlug}/achats/fournisseurs`)
    return { success: true, id: supplier.id }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function updateSupplier(
  orgSlug: string,
  id: string,
  data: Record<string, unknown>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = supplierSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { error } = await supabase
      .from('suppliers')
      .update(parsed.data)
      .eq('id', id)
      .eq('organization_id', orgId)

    if (error) return { error: 'Erreur lors de la mise à jour' }

    revalidatePath(`/${orgSlug}/achats/fournisseurs`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function deleteSupplier(
  orgSlug: string,
  id: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const { error } = await supabase
      .from('suppliers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', orgId)

    if (error) return { error: 'Erreur lors de la suppression' }

    revalidatePath(`/${orgSlug}/achats/fournisseurs`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}
