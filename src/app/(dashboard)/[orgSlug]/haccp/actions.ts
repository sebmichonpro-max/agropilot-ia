'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { haccpPlanSchema, haccpCcpSchema, haccpControlSchema } from '@/lib/validation/haccp'
import type { HaccpPlan, HaccpCcp, HaccpControl } from '@/types/database'

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

export async function getHaccpPlans() {
  const { supabase, orgId } = await getOrgId()
  if (!orgId) return []

  const { data } = await supabase
    .from('haccp_plans')
    .select('*')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .returns<HaccpPlan[]>()

  return data ?? []
}

export async function getHaccpPlan(id: string) {
  const { supabase, orgId } = await getOrgId()
  if (!orgId) return null

  const { data } = await supabase
    .from('haccp_plans')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single<HaccpPlan>()

  return data
}

export async function createHaccpPlan(
  orgSlug: string,
  data: Record<string, unknown>
): Promise<{ success?: boolean; error?: string; id?: string }> {
  try {
    const { supabase, orgId, userId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = haccpPlanSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { data: plan, error } = await supabase
      .from('haccp_plans')
      .insert({ ...parsed.data, organization_id: orgId, created_by: userId })
      .select('id')
      .single()

    if (error) return { error: 'Erreur lors de la création du plan HACCP' }

    revalidatePath(`/${orgSlug}/haccp`)
    return { success: true, id: plan.id }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function updateHaccpPlan(
  orgSlug: string,
  id: string,
  data: Record<string, unknown>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = haccpPlanSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { error } = await supabase
      .from('haccp_plans')
      .update(parsed.data)
      .eq('id', id)
      .eq('organization_id', orgId)

    if (error) return { error: 'Erreur lors de la mise à jour' }

    revalidatePath(`/${orgSlug}/haccp`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function getCcps(planId: string) {
  const { supabase, orgId } = await getOrgId()
  if (!orgId) return []

  const { data } = await supabase
    .from('haccp_ccps')
    .select('*')
    .eq('plan_id', planId)
    .eq('organization_id', orgId)
    .order('display_order')
    .returns<HaccpCcp[]>()

  return data ?? []
}

export async function createCcp(
  orgSlug: string,
  data: Record<string, unknown>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = haccpCcpSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { error } = await supabase
      .from('haccp_ccps')
      .insert({ ...parsed.data, organization_id: orgId })

    if (error) return { error: 'Erreur lors de la création du CCP' }

    revalidatePath(`/${orgSlug}/haccp`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function getControls(ccpId: string) {
  const { supabase, orgId } = await getOrgId()
  if (!orgId) return []

  const { data } = await supabase
    .from('haccp_controls')
    .select('*')
    .eq('ccp_id', ccpId)
    .eq('organization_id', orgId)
    .order('controlled_at', { ascending: false })
    .limit(50)
    .returns<HaccpControl[]>()

  return data ?? []
}

export async function createControl(
  orgSlug: string,
  data: Record<string, unknown>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId, userId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = haccpControlSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { error } = await supabase
      .from('haccp_controls')
      .insert({
        ...parsed.data,
        organization_id: orgId,
        controlled_by: userId,
        controlled_at: new Date().toISOString(),
      })

    if (error) return { error: "Erreur lors de l'enregistrement du contrôle" }

    revalidatePath(`/${orgSlug}/haccp`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}
