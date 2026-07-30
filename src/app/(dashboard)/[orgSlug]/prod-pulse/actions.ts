'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Profile } from '@/types/database'
import { calculateTrs } from './lib/trs-calculations'
import { DEFAULT_STOP_CAUSES, DEFAULT_THRESHOLDS } from './lib/trs-constants'
import { z } from 'zod'

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

async function getOrgContext() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single<Pick<Profile, 'organization_id' | 'role'>>()
  if (!profile?.organization_id) return null

  return { supabase, user, profile, orgId: profile.organization_id }
}

function revalidate(orgSlug: string) {
  revalidatePath(`/${orgSlug}/prod-pulse`)
  revalidatePath(`/${orgSlug}/prod-pulse/saisie`)
  revalidatePath(`/${orgSlug}/prod-pulse/historique`)
  revalidatePath(`/${orgSlug}/prod-pulse/configuration`)
}

// ═══════════════════════════════════════
// LINES
// ═══════════════════════════════════════

const lineSchema = z.object({
  name: z.string().min(1).max(100),
  hourly_cost_cents: z.number().int().min(0).default(0),
})

export async function getLines() {
  const ctx = await getOrgContext()
  if (!ctx) return []
  const { data } = await ctx.supabase
    .from('production_lines')
    .select('*')
    .is('deleted_at', null)
    .order('name')
  return data ?? []
}

export async function createLine(orgSlug: string, input: { name: string; hourly_cost_cents: number }) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = lineSchema.safeParse(input)
  if (!parsed.success) return { error: 'Données invalides' }

  const { error } = await ctx.supabase.from('production_lines').insert({
    ...parsed.data,
    organization_id: ctx.orgId,
  })
  if (error) return { error: 'Erreur lors de la création' }
  revalidate(orgSlug)
  return { success: true }
}

export async function updateLine(orgSlug: string, id: string, input: { name: string; hourly_cost_cents: number }) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = lineSchema.safeParse(input)
  if (!parsed.success) return { error: 'Données invalides' }

  const { error } = await ctx.supabase.from('production_lines').update(parsed.data).eq('id', id)
  if (error) return { error: 'Erreur lors de la mise à jour' }
  revalidate(orgSlug)
  return { success: true }
}

export async function deleteLine(orgSlug: string, id: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const { error } = await ctx.supabase.from('production_lines').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: 'Erreur lors de la suppression' }
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════

const productSchema = z.object({
  name: z.string().min(1).max(100),
  cycle_time_ms: z.number().int().min(100),
  unit_label: z.string().max(20).default('pièce'),
})

export async function getProducts() {
  const ctx = await getOrgContext()
  if (!ctx) return []
  const { data } = await ctx.supabase
    .from('pp_products')
    .select('*')
    .is('deleted_at', null)
    .order('name')
  return data ?? []
}

export async function createProduct(orgSlug: string, input: { name: string; cycle_time_ms: number; unit_label: string }) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) return { error: 'Données invalides' }

  const { error } = await ctx.supabase.from('pp_products').insert({
    ...parsed.data,
    organization_id: ctx.orgId,
  })
  if (error) return { error: 'Erreur lors de la création' }
  revalidate(orgSlug)
  return { success: true }
}

export async function updateProduct(orgSlug: string, id: string, input: { name: string; cycle_time_ms: number; unit_label: string }) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) return { error: 'Données invalides' }

  const { error } = await ctx.supabase.from('pp_products').update(parsed.data).eq('id', id)
  if (error) return { error: 'Erreur lors de la mise à jour' }
  revalidate(orgSlug)
  return { success: true }
}

export async function deleteProduct(orgSlug: string, id: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const { error } = await ctx.supabase.from('pp_products').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: 'Erreur lors de la suppression' }
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// LINE-PRODUCT ASSOCIATIONS
// ═══════════════════════════════════════

export async function getLineProducts(lineId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return []
  const { data } = await ctx.supabase
    .from('line_products')
    .select('*, pp_products(name, cycle_time_ms, unit_label)')
    .eq('line_id', lineId)
  return data ?? []
}

export async function linkProduct(orgSlug: string, lineId: string, productId: string, cycleTimeOverrideMs: number | null) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const { error } = await ctx.supabase.from('line_products').insert({
    organization_id: ctx.orgId,
    line_id: lineId,
    product_id: productId,
    cycle_time_override_ms: cycleTimeOverrideMs,
  })
  if (error) return { error: 'Erreur lors de l\'association' }
  revalidate(orgSlug)
  return { success: true }
}

export async function unlinkProduct(orgSlug: string, id: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const { error } = await ctx.supabase.from('line_products').delete().eq('id', id)
  if (error) return { error: 'Erreur lors de la suppression' }
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// STOP CAUSES
// ═══════════════════════════════════════

const causeSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['availability', 'performance', 'quality']),
  icon: z.string().default('AlertTriangle'),
  display_order: z.number().int().default(0),
  is_planned: z.boolean().default(false),
})

export async function getStopCauses() {
  const ctx = await getOrgContext()
  if (!ctx) return []
  const { data } = await ctx.supabase
    .from('stop_causes')
    .select('*')
    .is('deleted_at', null)
    .order('display_order')
  return data ?? []
}

export async function createStopCause(orgSlug: string, input: z.infer<typeof causeSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = causeSchema.safeParse(input)
  if (!parsed.success) return { error: 'Données invalides' }

  const { error } = await ctx.supabase.from('stop_causes').insert({
    ...parsed.data,
    organization_id: ctx.orgId,
  })
  if (error) return { error: 'Erreur lors de la création' }
  revalidate(orgSlug)
  return { success: true }
}

export async function updateStopCause(orgSlug: string, id: string, input: z.infer<typeof causeSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = causeSchema.safeParse(input)
  if (!parsed.success) return { error: 'Données invalides' }

  const { error } = await ctx.supabase.from('stop_causes').update(parsed.data).eq('id', id)
  if (error) return { error: 'Erreur lors de la mise à jour' }
  revalidate(orgSlug)
  return { success: true }
}

export async function deleteStopCause(orgSlug: string, id: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const { error } = await ctx.supabase.from('stop_causes').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: 'Erreur lors de la suppression' }
  revalidate(orgSlug)
  return { success: true }
}

export async function seedDefaultCauses(orgSlug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  const rows = DEFAULT_STOP_CAUSES.map((c) => ({
    ...c,
    organization_id: ctx.orgId,
  }))
  const { error } = await ctx.supabase.from('stop_causes').insert(rows)
  if (error) return { error: 'Erreur lors du seed' }
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// THRESHOLDS
// ═══════════════════════════════════════

const thresholdsSchema = z.object({
  excellent_min: z.number().int().min(0).max(10000),
  good_min: z.number().int().min(0).max(10000),
  warning_min: z.number().int().min(0).max(10000),
})

export async function getThresholds() {
  const ctx = await getOrgContext()
  if (!ctx) return null

  const { data, error } = await ctx.supabase
    .from('trs_thresholds')
    .select('*')
    .single()

  if (error?.code === 'PGRST116') {
    const { data: created } = await ctx.supabase
      .from('trs_thresholds')
      .insert({
        organization_id: ctx.orgId,
        ...DEFAULT_THRESHOLDS,
      })
      .select()
      .single()
    return created
  }
  return data
}

export async function updateThresholds(orgSlug: string, input: z.infer<typeof thresholdsSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = thresholdsSchema.safeParse(input)
  if (!parsed.success) return { error: 'Données invalides' }

  const { data: existing } = await ctx.supabase.from('trs_thresholds').select('id').single()
  if (existing) {
    await ctx.supabase.from('trs_thresholds').update(parsed.data).eq('id', existing.id)
  } else {
    await ctx.supabase.from('trs_thresholds').insert({
      organization_id: ctx.orgId,
      ...parsed.data,
    })
  }
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// SESSIONS
// ═══════════════════════════════════════

export async function startSession(orgSlug: string, lineId: string, productId: string, cycleTimeUsedMs: number) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  const { data, error } = await ctx.supabase
    .from('production_sessions')
    .insert({
      organization_id: ctx.orgId,
      line_id: lineId,
      product_id: productId,
      started_at: new Date().toISOString(),
      cycle_time_used_ms: cycleTimeUsedMs,
      created_by: ctx.user.id,
    })
    .select()
    .single()

  if (error) return { error: 'Erreur lors du démarrage' }
  revalidate(orgSlug)
  return { success: true, session: data }
}

export async function endSession(
  orgSlug: string,
  sessionId: string,
  qtyProduced: number,
  qtyConforming: number,
) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  const endedAt = new Date().toISOString()

  // Close any open stop first
  await ctx.supabase
    .from('production_stops')
    .update({ ended_at: endedAt })
    .eq('session_id', sessionId)
    .is('ended_at', null)

  // Recalculate durations for stops that were auto-closed
  const { data: stops } = await ctx.supabase
    .from('production_stops')
    .select('*, stop_causes(category, is_planned)')
    .eq('session_id', sessionId)

  const { data: session } = await ctx.supabase
    .from('production_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (!session) return { error: 'Session introuvable' }

  // Fix duration_seconds for auto-closed stops
  if (stops) {
    for (const stop of stops) {
      if (stop.duration_seconds === null || stop.duration_seconds === 0) {
        const dur = Math.round(
          (new Date(stop.ended_at!).getTime() - new Date(stop.started_at).getTime()) / 1000
        )
        await ctx.supabase.from('production_stops').update({ duration_seconds: dur }).eq('id', stop.id)
        stop.duration_seconds = dur
      }
    }
  }

  const openingSeconds = Math.round(
    (new Date(endedAt).getTime() - new Date(session.started_at).getTime()) / 1000
  )

  let plannedStopSeconds = 0
  let unplannedStopSeconds = 0
  let failureCount = 0
  let totalRepairSeconds = 0

  if (stops) {
    for (const stop of stops) {
      const dur = stop.duration_seconds ?? 0
      const cause = stop.stop_causes as unknown as { category: string; is_planned: boolean } | null
      if (cause?.is_planned) {
        plannedStopSeconds += dur
      } else {
        unplannedStopSeconds += dur
        if (cause?.category === 'availability') {
          failureCount++
          totalRepairSeconds += dur
        }
      }
    }
  }

  const thresholds = await getThresholds()
  const result = calculateTrs(
    {
      openingSeconds,
      plannedStopSeconds,
      unplannedStopSeconds,
      qtyProduced,
      qtyConforming,
      cycleTimeMs: session.cycle_time_used_ms,
    },
    thresholds,
    failureCount,
    totalRepairSeconds,
  )

  const { error } = await ctx.supabase
    .from('production_sessions')
    .update({
      ended_at: endedAt,
      qty_produced: qtyProduced,
      qty_conforming: qtyConforming,
      trs: result.trs,
      availability: result.availability,
      performance: result.performance,
      quality: result.quality,
      trs_level: result.trsLevel,
    })
    .eq('id', sessionId)

  if (error) return { error: 'Erreur lors de la clôture' }
  revalidate(orgSlug)
  return { success: true }
}

export async function getActiveSession(lineId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return null

  const { data } = await ctx.supabase
    .from('production_sessions')
    .select('*, pp_products(name, unit_label)')
    .eq('line_id', lineId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}

export async function getSessions(filters?: { lineId?: string; from?: string; to?: string; limit?: number }) {
  const ctx = await getOrgContext()
  if (!ctx) return []

  let query = ctx.supabase
    .from('production_sessions')
    .select('*, production_lines(name), pp_products(name, unit_label)')
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })

  if (filters?.lineId) query = query.eq('line_id', filters.lineId)
  if (filters?.from) query = query.gte('started_at', filters.from)
  if (filters?.to) query = query.lte('started_at', filters.to)
  query = query.limit(filters?.limit ?? 100)

  const { data } = await query
  return data ?? []
}

export async function deleteSession(orgSlug: string, sessionId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  await ctx.supabase.from('production_stops').delete().eq('session_id', sessionId)
  const { error } = await ctx.supabase.from('production_sessions').delete().eq('id', sessionId)
  if (error) return { error: 'Erreur lors de la suppression' }
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// STOPS
// ═══════════════════════════════════════

export async function startStop(orgSlug: string, sessionId: string, causeId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  const { error } = await ctx.supabase.from('production_stops').insert({
    organization_id: ctx.orgId,
    session_id: sessionId,
    cause_id: causeId,
    started_at: new Date().toISOString(),
  })
  if (error) return { error: 'Erreur lors de l\'enregistrement de l\'arrêt' }
  revalidate(orgSlug)
  return { success: true }
}

export async function endStop(orgSlug: string, stopId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  const { data: stop } = await ctx.supabase
    .from('production_stops')
    .select('started_at')
    .eq('id', stopId)
    .single()

  if (!stop) return { error: 'Arrêt introuvable' }

  const endedAt = new Date().toISOString()
  const durationSeconds = Math.round(
    (new Date(endedAt).getTime() - new Date(stop.started_at).getTime()) / 1000
  )

  const { error } = await ctx.supabase
    .from('production_stops')
    .update({ ended_at: endedAt, duration_seconds: durationSeconds })
    .eq('id', stopId)

  if (error) return { error: 'Erreur lors de la reprise' }
  revalidate(orgSlug)
  return { success: true }
}

export async function getSessionStops(sessionId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return []
  const { data } = await ctx.supabase
    .from('production_stops')
    .select('*, stop_causes(name, category, icon, is_planned)')
    .eq('session_id', sessionId)
    .order('started_at')
  return data ?? []
}

export async function getActiveStop(sessionId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return null
  const { data } = await ctx.supabase
    .from('production_stops')
    .select('*, stop_causes(name, category, icon)')
    .eq('session_id', sessionId)
    .is('ended_at', null)
    .maybeSingle()
  return data
}

// ═══════════════════════════════════════
// DASHBOARD AGGREGATES
// ═══════════════════════════════════════

export async function getDashboardData(from: string, to: string, lineId?: string) {
  const ctx = await getOrgContext()
  if (!ctx) return null

  let sessionsQuery = ctx.supabase
    .from('production_sessions')
    .select('*, production_lines(name, hourly_cost_cents), pp_products(name)')
    .not('ended_at', 'is', null)
    .gte('started_at', from)
    .lte('started_at', to)
    .order('started_at', { ascending: false })

  if (lineId) sessionsQuery = sessionsQuery.eq('line_id', lineId)

  const [sessionsRes, stopsRes, linesRes] = await Promise.all([
    sessionsQuery,
    ctx.supabase
      .from('production_stops')
      .select('*, stop_causes(name, category, is_planned)')
      .gte('started_at', from)
      .lte('started_at', to),
    ctx.supabase
      .from('production_lines')
      .select('*')
      .is('deleted_at', null)
      .order('name'),
  ])

  const sessions = sessionsRes.data ?? []
  const stops = stopsRes.data ?? []
  const lines = linesRes.data ?? []

  // Aggregate TRS
  let totalTrs = 0
  let totalAvail = 0
  let totalPerf = 0
  let totalQual = 0
  let count = 0
  let totalLossCents = 0

  for (const s of sessions) {
    if (s.trs != null) {
      totalTrs += Number(s.trs)
      totalAvail += Number(s.availability)
      totalPerf += Number(s.performance)
      totalQual += Number(s.quality)
      count++

      const sessionDuration = Math.round(
        (new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime()) / 1000
      )
      const line = s.production_lines as unknown as { hourly_cost_cents: number } | null
      if (line) {
        const lossHours = ((1 - Number(s.trs)) * sessionDuration) / 3600
        totalLossCents += Math.round(lossHours * line.hourly_cost_cents)
      }
    }
  }

  const avgTrs = count > 0 ? totalTrs / count : 0
  const avgAvail = count > 0 ? totalAvail / count : 0
  const avgPerf = count > 0 ? totalPerf / count : 0
  const avgQual = count > 0 ? totalQual / count : 0

  // TRS per line
  const trsPerLine: Record<string, { name: string; trs: number; count: number }> = {}
  for (const s of sessions) {
    if (s.trs == null) continue
    const lineName = (s.production_lines as unknown as { name: string })?.name ?? 'Inconnue'
    if (!trsPerLine[s.line_id]) trsPerLine[s.line_id] = { name: lineName, trs: 0, count: 0 }
    trsPerLine[s.line_id].trs += Number(s.trs)
    trsPerLine[s.line_id].count++
  }

  // Top 5 causes (Pareto)
  const causeDurations: Record<string, { name: string; category: string; totalSeconds: number }> = {}
  for (const stop of stops) {
    const cause = stop.stop_causes as unknown as { name: string; category: string; is_planned: boolean } | null
    if (!cause || cause.is_planned) continue
    const dur = stop.duration_seconds ?? 0
    if (!causeDurations[stop.cause_id]) {
      causeDurations[stop.cause_id] = { name: cause.name, category: cause.category, totalSeconds: 0 }
    }
    causeDurations[stop.cause_id].totalSeconds += dur
  }

  const topCauses = Object.values(causeDurations)
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
    .slice(0, 5)

  const totalStopSeconds = topCauses.reduce((sum, c) => sum + c.totalSeconds, 0)

  return {
    avgTrs,
    avgAvail,
    avgPerf,
    avgQual,
    sessionCount: count,
    totalLossCents,
    trsPerLine: Object.values(trsPerLine).map((v) => ({
      name: v.name,
      trs: v.count > 0 ? v.trs / v.count : 0,
    })),
    topCauses: topCauses.map((c) => ({
      ...c,
      percent: totalStopSeconds > 0 ? Math.round((c.totalSeconds / totalStopSeconds) * 100) : 0,
    })),
    recentSessions: sessions.slice(0, 10),
    lines,
  }
}
