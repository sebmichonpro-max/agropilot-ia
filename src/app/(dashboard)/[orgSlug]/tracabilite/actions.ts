'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { lotSchema, shipmentSchema } from '@/lib/validation/lot'
import type { Lot, Shipment } from '@/types/database'

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

export async function getLots() {
  const { supabase, orgId } = await getOrgId()
  if (!orgId) return []

  const { data } = await supabase
    .from('lots')
    .select('*')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .returns<Lot[]>()

  return data ?? []
}

export async function getLot(id: string) {
  const { supabase, orgId } = await getOrgId()
  if (!orgId) return null

  const { data } = await supabase
    .from('lots')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single<Lot>()

  return data
}

export async function createLot(
  orgSlug: string,
  data: Record<string, unknown>
): Promise<{ success?: boolean; error?: string; id?: string }> {
  try {
    const { supabase, orgId, userId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = lotSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { data: lot, error } = await supabase
      .from('lots')
      .insert({ ...parsed.data, organization_id: orgId, created_by: userId })
      .select('id')
      .single()

    if (error) return { error: 'Erreur lors de la création du lot' }

    revalidatePath(`/${orgSlug}/tracabilite`)
    return { success: true, id: lot.id }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function updateLot(
  orgSlug: string,
  id: string,
  data: Record<string, unknown>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = lotSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { error } = await supabase
      .from('lots')
      .update(parsed.data)
      .eq('id', id)
      .eq('organization_id', orgId)

    if (error) return { error: 'Erreur lors de la mise à jour' }

    revalidatePath(`/${orgSlug}/tracabilite`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function getShipments() {
  const { supabase, orgId } = await getOrgId()
  if (!orgId) return []

  const { data } = await supabase
    .from('shipments')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .returns<Shipment[]>()

  return data ?? []
}

export async function createShipment(
  orgSlug: string,
  data: Record<string, unknown>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId, userId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = shipmentSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { error } = await supabase
      .from('shipments')
      .insert({ ...parsed.data, organization_id: orgId, created_by: userId })

    if (error) return { error: "Erreur lors de la création de l'expédition" }

    revalidatePath(`/${orgSlug}/tracabilite`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}
