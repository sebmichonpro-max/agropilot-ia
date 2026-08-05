'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { auditSchema, auditCheckItemSchema } from '@/lib/validation/audit'
import type { Audit, AuditCheckItem } from '@/types/database'

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

function generateAuditNumber(): string {
  const now = new Date()
  const y = now.getFullYear().toString().slice(-2)
  const m = (now.getMonth() + 1).toString().padStart(2, '0')
  const r = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `AUD-${y}${m}-${r}`
}

export async function getAudits() {
  const { supabase, orgId } = await getOrgId()
  if (!orgId) return []

  const { data } = await supabase
    .from('audits')
    .select('*')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('planned_date', { ascending: false })
    .returns<Audit[]>()

  return data ?? []
}

export async function getAudit(id: string) {
  const { supabase, orgId } = await getOrgId()
  if (!orgId) return null

  const { data } = await supabase
    .from('audits')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single<Audit>()

  return data
}

export async function createAudit(
  orgSlug: string,
  data: Record<string, unknown>
): Promise<{ success?: boolean; error?: string; id?: string }> {
  try {
    const { supabase, orgId, userId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = auditSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { data: audit, error } = await supabase
      .from('audits')
      .insert({
        ...parsed.data,
        organization_id: orgId,
        audit_number: generateAuditNumber(),
        status: 'planned',
        created_by: userId,
      })
      .select('id')
      .single()

    if (error) return { error: "Erreur lors de la création de l'audit" }

    revalidatePath(`/${orgSlug}/audits`)
    return { success: true, id: audit.id }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function updateAudit(
  orgSlug: string,
  id: string,
  data: Record<string, unknown>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = auditSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { error } = await supabase
      .from('audits')
      .update(parsed.data)
      .eq('id', id)
      .eq('organization_id', orgId)

    if (error) return { error: 'Erreur lors de la mise à jour' }

    revalidatePath(`/${orgSlug}/audits`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function getCheckItems(auditId: string) {
  const { supabase, orgId } = await getOrgId()
  if (!orgId) return []

  const { data } = await supabase
    .from('audit_check_items')
    .select('*')
    .eq('audit_id', auditId)
    .eq('organization_id', orgId)
    .order('display_order')
    .returns<AuditCheckItem[]>()

  return data ?? []
}

export async function createCheckItem(
  orgSlug: string,
  data: Record<string, unknown>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = auditCheckItemSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { error } = await supabase
      .from('audit_check_items')
      .insert({ ...parsed.data, organization_id: orgId })

    if (error) return { error: "Erreur lors de l'ajout du point de contrôle" }

    revalidatePath(`/${orgSlug}/audits`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}
