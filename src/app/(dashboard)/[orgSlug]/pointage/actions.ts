'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  RhEmployee,
  RhClockEvent,
  RhAbsence,
  RhAgency,
  RhPosition,
  RhSettings,
} from '@/types/database'

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

// ── EMPLOYEES ────────────────────────────────

export async function getEmployees() {
  const { supabase } = await getOrgContext()
  const { data, error } = await supabase
    .from('rh_employees')
    .select('*')
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('full_name')
    .returns<RhEmployee[]>()

  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

export async function createEmployee(formData: FormData) {
  const { supabase, orgId } = await getOrgContext()

  const fullName = formData.get('full_name') as string
  const contractType = formData.get('contract_type') as string
  const position = formData.get('position') as string | null
  const agencyId = formData.get('agency_id') as string | null
  const hourlyCostCents = parseInt(formData.get('hourly_cost_cents') as string) || 0
  const startDate = formData.get('start_date') as string | null
  const endDate = formData.get('end_date') as string | null

  if (!fullName || !contractType) {
    return { error: 'Nom et type de contrat obligatoires' }
  }

  const { error } = await supabase.from('rh_employees').insert({
    organization_id: orgId,
    full_name: fullName,
    contract_type: contractType,
    position: position || null,
    agency_id: agencyId || null,
    hourly_cost_cents: hourlyCostCents,
    start_date: startDate || null,
    end_date: endDate || null,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateEmployee(id: string, formData: FormData) {
  const { supabase } = await getOrgContext()

  const fullName = formData.get('full_name') as string
  const contractType = formData.get('contract_type') as string
  const position = formData.get('position') as string | null
  const agencyId = formData.get('agency_id') as string | null
  const hourlyCostCents = parseInt(formData.get('hourly_cost_cents') as string) || 0
  const startDate = formData.get('start_date') as string | null
  const endDate = formData.get('end_date') as string | null

  const { error } = await supabase
    .from('rh_employees')
    .update({
      full_name: fullName,
      contract_type: contractType,
      position: position || null,
      agency_id: agencyId || null,
      hourly_cost_cents: hourlyCostCents,
      start_date: startDate || null,
      end_date: endDate || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteEmployee(id: string) {
  const { supabase } = await getOrgContext()
  const { error } = await supabase
    .from('rh_employees')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', id)

  if (error) return { error: error.message }
  return { success: true }
}

// ── CLOCK EVENTS ─────────────────────────────

export async function clockEvent(
  employeeId: string,
  eventType: 'clock_in' | 'break_start' | 'break_end' | 'clock_out',
  options?: { isManual?: boolean; note?: string }
) {
  const { supabase, userId, orgId } = await getOrgContext()

  const { error } = await supabase.from('rh_clock_events').insert({
    organization_id: orgId,
    employee_id: employeeId,
    event_type: eventType,
    event_time: new Date().toISOString(),
    source: options?.isManual ? 'admin' : 'touch',
    recorded_by: userId,
    is_manual: options?.isManual ?? false,
    note: options?.note ?? null,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getTodayEvents() {
  const { supabase } = await getOrgContext()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('rh_clock_events')
    .select('*')
    .gte('event_time', todayStart.toISOString())
    .order('event_time', { ascending: true })
    .returns<RhClockEvent[]>()

  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

export async function getEventsForPeriod(startDate: string, endDate: string) {
  const { supabase } = await getOrgContext()

  const { data, error } = await supabase
    .from('rh_clock_events')
    .select('*')
    .gte('event_time', startDate)
    .lte('event_time', endDate)
    .order('event_time', { ascending: true })
    .returns<RhClockEvent[]>()

  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

export async function deleteClockEvent(eventId: string) {
  const { supabase, role } = await getOrgContext()
  if (!['owner', 'admin'].includes(role)) {
    return { error: 'Permission refusée' }
  }

  const { error } = await supabase.from('rh_clock_events').delete().eq('id', eventId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteEmployeeDayEvents(employeeId: string) {
  const { supabase, role } = await getOrgContext()
  if (!['owner', 'admin'].includes(role)) {
    return { error: 'Permission refusée' }
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { error } = await supabase
    .from('rh_clock_events')
    .delete()
    .eq('employee_id', employeeId)
    .gte('event_time', todayStart.toISOString())

  if (error) return { error: error.message }
  return { success: true }
}

// ── ABSENCES ─────────────────────────────────

export async function getAbsences() {
  const { supabase } = await getOrgContext()
  const { data, error } = await supabase
    .from('rh_absences')
    .select('*')
    .order('start_date', { ascending: false })
    .returns<RhAbsence[]>()

  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

export async function createAbsence(formData: FormData) {
  const { supabase, orgId } = await getOrgContext()

  const employeeId = formData.get('employee_id') as string
  const absenceType = formData.get('absence_type') as string
  const startDate = formData.get('start_date') as string
  const endDate = formData.get('end_date') as string
  const note = formData.get('note') as string | null
  const status = (formData.get('status') as string) || 'pending'

  if (!employeeId || !absenceType || !startDate || !endDate) {
    return { error: 'Champs obligatoires manquants' }
  }

  const { error } = await supabase.from('rh_absences').insert({
    organization_id: orgId,
    employee_id: employeeId,
    absence_type: absenceType,
    start_date: startDate,
    end_date: endDate,
    note: note || null,
    status,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateAbsenceStatus(id: string, status: 'approved' | 'rejected') {
  const { supabase, userId } = await getOrgContext()
  const { error } = await supabase
    .from('rh_absences')
    .update({ status, approved_by: userId })
    .eq('id', id)

  if (error) return { error: error.message }
  return { success: true }
}

// ── AGENCIES ─────────────────────────────────

export async function getAgencies() {
  const { supabase } = await getOrgContext()
  const { data, error } = await supabase
    .from('rh_agencies')
    .select('*')
    .order('name')
    .returns<RhAgency[]>()

  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

export async function createAgency(formData: FormData) {
  const { supabase, orgId } = await getOrgContext()
  const name = formData.get('name') as string
  if (!name) return { error: 'Nom obligatoire' }

  const { error } = await supabase.from('rh_agencies').insert({
    organization_id: orgId,
    name,
    contact_name: (formData.get('contact_name') as string) || null,
    contact_email: (formData.get('contact_email') as string) || null,
    contact_phone: (formData.get('contact_phone') as string) || null,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteAgency(id: string) {
  const { supabase } = await getOrgContext()
  const { error } = await supabase.from('rh_agencies').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ── POSITIONS ────────────────────────────────

export async function getPositions() {
  const { supabase } = await getOrgContext()
  const { data, error } = await supabase
    .from('rh_positions')
    .select('*')
    .order('sort_order')
    .returns<RhPosition[]>()

  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

export async function createPosition(formData: FormData) {
  const { supabase, orgId } = await getOrgContext()
  const name = formData.get('name') as string
  if (!name) return { error: 'Nom obligatoire' }

  const sortOrder = parseInt(formData.get('sort_order') as string) || 0

  const { error } = await supabase.from('rh_positions').insert({
    organization_id: orgId,
    name,
    sort_order: sortOrder,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function deletePosition(id: string) {
  const { supabase } = await getOrgContext()
  const { error } = await supabase.from('rh_positions').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function seedDefaultPositions() {
  const { supabase, orgId } = await getOrgContext()

  const defaults = [
    'Réception', 'Prépa recette', 'Légumier', 'Production',
    'Conditionnement', 'Mélangeur', 'Mise en barquette', 'Qualité',
    'Bureau', 'Prépa commande', 'Magasinier', 'Bout de ligne',
  ]

  const rows = defaults.map((name, i) => ({
    organization_id: orgId,
    name,
    sort_order: i + 1,
  }))

  const { error } = await supabase.from('rh_positions').insert(rows)
  if (error) return { error: error.message }
  return { success: true }
}

// ── SETTINGS ─────────────────────────────────

export async function getSettings() {
  const { supabase, orgId } = await getOrgContext()
  const { data, error } = await supabase
    .from('rh_settings')
    .select('*')
    .eq('organization_id', orgId)
    .single<RhSettings>()

  if (error && error.code === 'PGRST116') {
    const { data: created, error: createError } = await supabase
      .from('rh_settings')
      .insert({ organization_id: orgId })
      .select()
      .single<RhSettings>()
    if (createError) return { error: createError.message, data: null }
    return { data: created, error: null }
  }

  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

export async function updateSettings(formData: FormData) {
  const { supabase, orgId } = await getOrgContext()

  const dailyHours = parseInt(formData.get('daily_hours_threshold') as string) || 420
  const weeklyHours = parseInt(formData.get('weekly_hours_threshold') as string) || 2100
  const absenceNotif = parseInt(formData.get('absence_notification_hours') as string) || 24

  const { error } = await supabase
    .from('rh_settings')
    .update({
      daily_hours_threshold: dailyHours,
      weekly_hours_threshold: weeklyHours,
      absence_notification_hours: absenceNotif,
    })
    .eq('organization_id', orgId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateAdminPin(pin: string) {
  const { supabase, orgId } = await getOrgContext()

  const { error } = await supabase
    .from('rh_settings')
    .update({ admin_pin_hash: pin })
    .eq('organization_id', orgId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function verifyAdminPin(pin: string) {
  const { supabase, orgId } = await getOrgContext()
  const { data } = await supabase
    .from('rh_settings')
    .select('admin_pin_hash')
    .eq('organization_id', orgId)
    .single<Pick<RhSettings, 'admin_pin_hash'>>()

  if (!data) return { valid: false }
  return { valid: data.admin_pin_hash === pin }
}

// ── REVALIDATION ─────────────────────────────

export async function revalidatePointage(orgSlug: string) {
  revalidatePath(`/${orgSlug}/pointage`)
}
