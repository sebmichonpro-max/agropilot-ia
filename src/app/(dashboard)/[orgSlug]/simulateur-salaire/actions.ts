'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { SimSettings, SimSimulation, SimulationInputs, SimulationResults } from '@/types/database'

async function getOrgContext() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) throw new Error('Profil introuvable')

  return { supabase, userId: user.id, orgId: profile.organization_id, role: profile.role }
}

// ── SETTINGS ────────────────────────────────

export async function getSimSettings(): Promise<{ data: SimSettings | null; error: string | null }> {
  const { supabase, orgId } = await getOrgContext()

  const { data, error } = await supabase
    .from('sim_settings')
    .select('*')
    .eq('organization_id', orgId)
    .single<SimSettings>()

  if (error && error.code === 'PGRST116') {
    const { data: created, error: insertError } = await supabase
      .from('sim_settings')
      .insert({ organization_id: orgId })
      .select()
      .single<SimSettings>()

    if (insertError) return { data: null, error: insertError.message }
    return { data: created, error: null }
  }

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function updateSimSettings(formData: FormData): Promise<{ error: string | null }> {
  const { supabase, orgId } = await getOrgContext()

  const updates: Record<string, unknown> = {}
  const fields = [
    'company_name',
    'at_mp_rate_bps',
    'mutual_employer_cents',
    'mutual_employee_cents',
    'prevoyance_employer_rate_bps',
    'prevoyance_employee_rate_bps',
    'fnal_rate_bps',
    'formation_rate_bps',
    'transport_rate_bps',
    'headcount',
  ]

  for (const field of fields) {
    const val = formData.get(field)
    if (val !== null) {
      updates[field] = field === 'company_name' ? String(val) : parseInt(String(val), 10)
    }
  }

  const headcount = updates.headcount as number | undefined
  if (headcount !== undefined) {
    if (headcount < 50 && !formData.has('fnal_rate_bps')) {
      updates.fnal_rate_bps = 10
    }
    if (headcount < 11 && !formData.has('formation_rate_bps')) {
      updates.formation_rate_bps = 55
    }
  }

  const { error } = await supabase
    .from('sim_settings')
    .update(updates)
    .eq('organization_id', orgId)

  if (error) return { error: error.message }
  return { error: null }
}

// ── SIMULATIONS ────────────────────────────────

export async function saveSimulation(
  label: string,
  inputs: SimulationInputs,
  results: SimulationResults
): Promise<{ data: SimSimulation | null; error: string | null }> {
  const { supabase, orgId, userId } = await getOrgContext()

  const { data, error } = await supabase
    .from('sim_simulations')
    .insert({
      organization_id: orgId,
      label,
      inputs: inputs as unknown as Record<string, unknown>,
      results: results as unknown as Record<string, unknown>,
      created_by: userId,
    })
    .select()
    .single<SimSimulation>()

  if (error) return { data: null, error: error.message }
  revalidatePath('/', 'layout')
  return { data, error: null }
}

export async function getSimulations(): Promise<{ data: SimSimulation[]; error: string | null }> {
  const { supabase } = await getOrgContext()

  const { data, error } = await supabase
    .from('sim_simulations')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<SimSimulation[]>()

  if (error) return { data: [], error: error.message }
  return { data: data ?? [], error: null }
}

export async function deleteSimulation(id: string): Promise<{ error: string | null }> {
  const { supabase } = await getOrgContext()

  const { error } = await supabase
    .from('sim_simulations')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { error: null }
}
