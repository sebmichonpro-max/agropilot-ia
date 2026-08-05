'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Profile } from '@/types/database'
import { z } from 'zod'
import { parseOrdersCsv, parseStocksCsv, extractDateFromFilename } from '@/modules/prev-prod'
import { parseDivaltoExport, computeNeeds, buildProductClientMappings } from '@/modules/prev-prod'
import type { DivaltoTiersRecord, DivaltoArticleRecord } from '@/modules/prev-prod'
import { calculateRequirement } from '@/modules/prev-prod/requirements'

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
  revalidatePath(`/${orgSlug}/prev-prod`)
  revalidatePath(`/${orgSlug}/prev-prod/import`)
  revalidatePath(`/${orgSlug}/prev-prod/plan`)
  revalidatePath(`/${orgSlug}/prev-prod/configuration`)
}

// ═══════════════════════════════════════
// LINES
// ═══════════════════════════════════════

const lineSchema = z.object({
  name: z.string().min(1).max(100),
  compatible_weights_grams: z.array(z.number().int().positive()).default([]),
  max_capacity_grams: z.number().int().positive().nullable().default(null),
  sort_order: z.number().int().min(0).default(0),
})

export async function createPrevLine(orgSlug: string, input: z.infer<typeof lineSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = lineSchema.safeParse(input)
  if (!parsed.success) return { error: 'Données invalides' }

  const { error } = await ctx.supabase.from('prev_lines').insert({
    ...parsed.data,
    organization_id: ctx.orgId,
  })
  if (error) return { error: 'Erreur lors de la création' }
  revalidate(orgSlug)
  return { success: true }
}

export async function updatePrevLine(orgSlug: string, id: string, input: z.infer<typeof lineSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = lineSchema.safeParse(input)
  if (!parsed.success) return { error: 'Données invalides' }

  const { error } = await ctx.supabase.from('prev_lines').update(parsed.data).eq('id', id)
  if (error) return { error: 'Erreur lors de la mise à jour' }
  revalidate(orgSlug)
  return { success: true }
}

export async function deletePrevLine(orgSlug: string, id: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const { error } = await ctx.supabase.from('prev_lines').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: 'Erreur lors de la suppression' }
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// MIXERS
// ═══════════════════════════════════════

const mixerSchema = z.object({
  name: z.string().min(1).max(100),
  capacity_grams: z.number().int().positive(),
  sort_order: z.number().int().min(0).default(0),
})

export async function createMixer(orgSlug: string, input: z.infer<typeof mixerSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = mixerSchema.safeParse(input)
  if (!parsed.success) return { error: 'Données invalides' }

  const { error } = await ctx.supabase.from('prev_mixers').insert({
    ...parsed.data,
    organization_id: ctx.orgId,
  })
  if (error) return { error: 'Erreur lors de la création' }
  revalidate(orgSlug)
  return { success: true }
}

export async function updateMixer(orgSlug: string, id: string, input: z.infer<typeof mixerSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = mixerSchema.safeParse(input)
  if (!parsed.success) return { error: 'Données invalides' }

  const { error } = await ctx.supabase.from('prev_mixers').update(parsed.data).eq('id', id)
  if (error) return { error: 'Erreur lors de la mise à jour' }
  revalidate(orgSlug)
  return { success: true }
}

export async function deleteMixer(orgSlug: string, id: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const { error } = await ctx.supabase.from('prev_mixers').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: 'Erreur lors de la suppression' }
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// RECIPES
// ═══════════════════════════════════════

const recipeSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  brand: z.string().max(100).nullable().default(null),
  stock_type: z.enum(['stock_permanent', 'sur_commande', 'mixte']).default('sur_commande'),
  dispatch_priority: z.enum(['matin', 'journee', 'avance']).default('journee'),
  forecast_method: z.enum(['dernier_jour', 'moyenne_4sem', 'moyenne_ponderee']).default('dernier_jour'),
  coverage_j1_pct: z.number().int().min(0).max(100).default(0),
  min_batch_grams: z.number().int().positive().default(30000),
  min_batch_exception: z.boolean().default(false),
  loss_pct: z.number().min(0).max(100).default(3),
})

export async function createRecipe(orgSlug: string, input: z.infer<typeof recipeSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = recipeSchema.safeParse(input)
  if (!parsed.success) return { error: 'Données invalides' }

  const { error } = await ctx.supabase.from('prev_recipes').insert({
    ...parsed.data,
    organization_id: ctx.orgId,
  })
  if (error) {
    if (error.code === '23505') return { error: 'Ce code recette existe déjà' }
    return { error: 'Erreur lors de la création' }
  }
  revalidate(orgSlug)
  return { success: true }
}

export async function updateRecipe(orgSlug: string, id: string, input: z.infer<typeof recipeSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = recipeSchema.safeParse(input)
  if (!parsed.success) return { error: 'Données invalides' }

  const { error } = await ctx.supabase.from('prev_recipes').update(parsed.data).eq('id', id)
  if (error) {
    if (error.code === '23505') return { error: 'Ce code recette existe déjà' }
    return { error: 'Erreur lors de la mise à jour' }
  }
  revalidate(orgSlug)
  return { success: true }
}

export async function deleteRecipe(orgSlug: string, id: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const { error } = await ctx.supabase.from('prev_recipes').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: 'Erreur lors de la suppression' }
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════

const productSchema = z.object({
  code: z.string().min(1).max(50),
  label: z.string().min(1).max(200),
  recipe_id: z.string().uuid(),
  weight_grams: z.number().int().positive(),
  format_label: z.string().min(1).max(50),
  compatible_line_ids: z.array(z.string().uuid()).nullable().default(null),
})

export async function createPrevProduct(orgSlug: string, input: z.infer<typeof productSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) return { error: 'Données invalides' }

  const { error } = await ctx.supabase.from('prev_products').insert({
    ...parsed.data,
    organization_id: ctx.orgId,
  })
  if (error) {
    if (error.code === '23505') return { error: 'Ce code produit existe déjà' }
    return { error: 'Erreur lors de la création' }
  }
  revalidate(orgSlug)
  return { success: true }
}

export async function updatePrevProduct(orgSlug: string, id: string, input: z.infer<typeof productSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) return { error: 'Données invalides' }

  const { error } = await ctx.supabase.from('prev_products').update(parsed.data).eq('id', id)
  if (error) {
    if (error.code === '23505') return { error: 'Ce code produit existe déjà' }
    return { error: 'Erreur lors de la mise à jour' }
  }
  revalidate(orgSlug)
  return { success: true }
}

export async function deletePrevProduct(orgSlug: string, id: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const { error } = await ctx.supabase.from('prev_products').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: 'Erreur lors de la suppression' }
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// CLIENTS
// ═══════════════════════════════════════

const clientSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  client_type: z.enum(['stock_brand', 'custom_order']).default('custom_order'),
  brand: z.string().max(100).nullable().default(null),
  dispatch_priority: z.enum(['matin', 'journee', 'avance']).default('journee'),
})

export async function createClient(orgSlug: string, input: z.infer<typeof clientSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = clientSchema.safeParse(input)
  if (!parsed.success) return { error: 'Données invalides' }

  const { error } = await ctx.supabase.from('prev_clients').insert({
    ...parsed.data,
    organization_id: ctx.orgId,
  })
  if (error) {
    if (error.code === '23505') return { error: 'Ce code client existe déjà' }
    return { error: 'Erreur lors de la création' }
  }
  revalidate(orgSlug)
  return { success: true }
}

export async function updateClient(orgSlug: string, id: string, input: z.infer<typeof clientSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = clientSchema.safeParse(input)
  if (!parsed.success) return { error: 'Données invalides' }

  const { error } = await ctx.supabase.from('prev_clients').update(parsed.data).eq('id', id)
  if (error) {
    if (error.code === '23505') return { error: 'Ce code client existe déjà' }
    return { error: 'Erreur lors de la mise à jour' }
  }
  revalidate(orgSlug)
  return { success: true }
}

export async function deleteClient(orgSlug: string, id: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const { error } = await ctx.supabase.from('prev_clients').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: 'Erreur lors de la suppression' }
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// HOLIDAYS
// ═══════════════════════════════════════

export async function createHoliday(orgSlug: string, input: { date: string; label: string }) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  if (!input.date || !input.label) return { error: 'Données invalides' }

  const { error } = await ctx.supabase.from('prev_holidays').insert({
    date: input.date,
    label: input.label,
    organization_id: ctx.orgId,
    auto_generated: false,
  })
  if (error) {
    if (error.code === '23505') return { error: 'Ce jour férié existe déjà' }
    return { error: 'Erreur lors de la création' }
  }
  revalidate(orgSlug)
  return { success: true }
}

export async function deleteHoliday(orgSlug: string, id: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const { error } = await ctx.supabase.from('prev_holidays').delete().eq('id', id)
  if (error) return { error: 'Erreur lors de la suppression' }
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// CSV IMPORT
// ═══════════════════════════════════════

export async function importOrdersCsv(
  orgSlug: string,
  csvText: string,
  orderType: 'commande' | 'devis',
  deliveryDate: string,
  filename: string,
) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  const parsed = parseOrdersCsv(csvText)
  if (parsed.rows.length === 0) {
    return { error: 'Aucune ligne valide dans le fichier', details: parsed.errors }
  }

  const effectiveDate = deliveryDate || extractDateFromFilename(filename) || new Date().toISOString().split('T')[0]

  const { data: allProducts } = await ctx.supabase
    .from('prev_products')
    .select('id, code')
    .is('deleted_at', null)

  const productMap = new Map((allProducts ?? []).map((p) => [p.code, p.id]))

  let matchedCount = 0
  let unmatchedCount = 0

  const { data: batch, error: batchErr } = await ctx.supabase
    .from('prev_import_batches')
    .insert({
      organization_id: ctx.orgId,
      import_type: orderType === 'commande' ? 'commandes' : 'devis',
      filename,
      source: 'csv',
      row_count: parsed.rows.length,
      imported_by: ctx.user.id,
    })
    .select('id')
    .single()

  if (batchErr || !batch) return { error: 'Erreur lors de la création du lot d\'import' }

  const ordersToInsert = parsed.rows.map((row) => {
    const productId = productMap.get(row.code_produit) ?? null
    if (productId) matchedCount++
    else unmatchedCount++

    return {
      organization_id: ctx.orgId,
      import_batch_id: batch.id,
      order_type: orderType,
      delivery_date: effectiveDate,
      product_id: productId,
      product_code_raw: row.code_produit,
      product_label_raw: row.libelle_produit,
      quantity_pieces: row.quantite_pieces,
      quantity_colis: row.quantite_colis,
      total_weight_grams: row.poids_total_g,
      unit_price_gross_cents: row.pu_brut ? Math.round(row.pu_brut * 100) : null,
      unit_price_net_cents: row.pu_net ? Math.round(row.pu_net * 100) : null,
      probability_pct: orderType === 'devis' ? (row.probabilite_pct ?? 100) : 100,
      status: row.statut === 'confirme' ? 'confirme' : 'en_attente',
      matched: !!productId,
    }
  })

  const { error: insertErr } = await ctx.supabase.from('prev_orders').insert(ordersToInsert)
  if (insertErr) return { error: 'Erreur lors de l\'import des commandes' }

  await ctx.supabase
    .from('prev_import_batches')
    .update({ matched_count: matchedCount, unmatched_count: unmatchedCount })
    .eq('id', batch.id)

  revalidate(orgSlug)
  return {
    success: true,
    batchId: batch.id,
    totalRows: parsed.rows.length,
    matchedCount,
    unmatchedCount,
    parseErrors: parsed.errors,
  }
}

export async function importStocksCsv(orgSlug: string, csvText: string, snapshotDate: string, filename: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  const parsed = parseStocksCsv(csvText)
  if (parsed.rows.length === 0) {
    return { error: 'Aucune ligne valide dans le fichier', details: parsed.errors }
  }

  const effectiveDate = snapshotDate || extractDateFromFilename(filename) || new Date().toISOString().split('T')[0]

  const { data: allProducts } = await ctx.supabase
    .from('prev_products')
    .select('id, code')
    .is('deleted_at', null)

  const productMap = new Map((allProducts ?? []).map((p) => [p.code, p.id]))

  let matchedCount = 0
  let unmatchedCount = 0

  const { data: batch, error: batchErr } = await ctx.supabase
    .from('prev_import_batches')
    .insert({
      organization_id: ctx.orgId,
      import_type: 'stocks',
      filename,
      source: 'csv',
      row_count: parsed.rows.length,
      imported_by: ctx.user.id,
    })
    .select('id')
    .single()

  if (batchErr || !batch) return { error: 'Erreur lors de la création du lot d\'import' }

  const snapshots = parsed.rows
    .filter((row) => {
      const pid = productMap.get(row.code_produit)
      if (pid) { matchedCount++; return true }
      unmatchedCount++
      return false
    })
    .map((row) => ({
      organization_id: ctx.orgId,
      product_id: productMap.get(row.code_produit)!,
      snapshot_date: effectiveDate,
      stock_pieces: row.stock_pieces,
      dlc: row.dlc,
      lot: row.lot,
    }))

  if (snapshots.length > 0) {
    const { error: insertErr } = await ctx.supabase.from('prev_stock_snapshots').upsert(snapshots, {
      onConflict: 'organization_id,product_id,snapshot_date',
    })
    if (insertErr) return { error: 'Erreur lors de l\'import des stocks' }
  }

  await ctx.supabase
    .from('prev_import_batches')
    .update({ matched_count: matchedCount, unmatched_count: unmatchedCount })
    .eq('id', batch.id)

  revalidate(orgSlug)
  return {
    success: true,
    batchId: batch.id,
    totalRows: parsed.rows.length,
    matchedCount,
    unmatchedCount,
    parseErrors: parsed.errors,
  }
}

// ═══════════════════════════════════════
// PLAN — CREATE & CALCULATE
// ═══════════════════════════════════════

export async function createDailyPlan(orgSlug: string, planDate: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  const { data: existing } = await ctx.supabase
    .from('prev_daily_plans')
    .select('id')
    .eq('plan_date', planDate)
    .maybeSingle()

  if (existing) return { error: 'Un plan existe déjà pour cette date', planId: existing.id }

  const { data: plan, error } = await ctx.supabase
    .from('prev_daily_plans')
    .insert({ organization_id: ctx.orgId, plan_date: planDate })
    .select('id')
    .single()

  if (error || !plan) return { error: 'Erreur lors de la création du plan' }

  const calcResult = await calculateAndSaveRequirements(ctx, plan.id, planDate)
  if (calcResult.error) return calcResult

  revalidate(orgSlug)
  return { success: true, planId: plan.id }
}

async function calculateAndSaveRequirements(
  ctx: Awaited<ReturnType<typeof getOrgContext>> & {},
  planId: string,
  planDate: string,
) {
  const [recipesRes, productsRes, ordersRes, stocksRes, salesRes, holidaysRes] = await Promise.all([
    ctx.supabase.from('prev_recipes').select('*').is('deleted_at', null).eq('is_active', true),
    ctx.supabase.from('prev_products').select('*').is('deleted_at', null).eq('is_active', true),
    ctx.supabase.from('prev_orders').select('*').eq('delivery_date', planDate),
    ctx.supabase.from('prev_stock_snapshots').select('*').eq('snapshot_date', planDate),
    ctx.supabase.from('prev_sales_history').select('*'),
    ctx.supabase.from('prev_holidays').select('*'),
  ])

  const recipes = recipesRes.data ?? []
  const products = productsRes.data ?? []
  const orders = ordersRes.data ?? []
  const stocks = stocksRes.data ?? []
  const sales = salesRes.data ?? []
  const holidays = holidaysRes.data ?? []

  const requirements = recipes.map((recipe) => {
    const recipeProducts = products.filter((p) => p.recipe_id === recipe.id)
    if (recipeProducts.length === 0) return null

    const result = calculateRequirement({
      recipe,
      products: recipeProducts,
      orders,
      stockSnapshots: stocks,
      salesHistory: sales,
      holidays,
      planDate,
    })

    if (result.netRequirementPieces === 0) return null

    return {
      plan_id: planId,
      recipe_id: result.recipeId,
      stock_target_pieces: result.stockTargetPieces,
      coverage_j1_pieces: result.coverageJ1Pieces,
      orders_pieces: result.ordersPieces,
      quotes_weighted_pieces: result.quotesWeightedPieces,
      current_stock_pieces: result.currentStockPieces,
      gross_requirement_pieces: result.grossRequirementPieces,
      net_requirement_pieces: result.netRequirementPieces,
      total_weight_grams: result.totalWeightGrams,
      total_weight_with_loss_grams: result.totalWeightWithLossGrams,
      below_threshold: result.belowThreshold,
      threshold_forced: false,
      forecast_method_used: result.forecastMethodUsed,
    }
  }).filter((r): r is NonNullable<typeof r> => r !== null)

  if (requirements.length > 0) {
    const { error } = await ctx.supabase.from('prev_plan_requirements').insert(requirements)
    if (error) return { error: 'Erreur lors du calcul des besoins' }
  }

  return { success: true }
}

export async function validatePlan(orgSlug: string, planId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  const { error } = await ctx.supabase
    .from('prev_daily_plans')
    .update({
      status: 'validated',
      validated_at: new Date().toISOString(),
      validated_by: ctx.user.id,
    })
    .eq('id', planId)

  if (error) return { error: 'Erreur lors de la validation' }
  revalidate(orgSlug)
  return { success: true }
}

export async function forceThreshold(orgSlug: string, requirementId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  const { error } = await ctx.supabase
    .from('prev_plan_requirements')
    .update({ threshold_forced: true })
    .eq('id', requirementId)

  if (error) return { error: 'Erreur lors du forçage du seuil' }
  revalidate(orgSlug)
  return { success: true }
}

export async function deletePlan(orgSlug: string, planId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  const { data: plan } = await ctx.supabase
    .from('prev_daily_plans')
    .select('status')
    .eq('id', planId)
    .single()

  if (plan?.status === 'validated' || plan?.status === 'in_progress') {
    return { error: 'Impossible de supprimer un plan validé ou en cours' }
  }

  const { error } = await ctx.supabase.from('prev_daily_plans').delete().eq('id', planId)
  if (error) return { error: 'Erreur lors de la suppression' }
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// DIVALTO IMPORT — Tri par Tiers (référentiel mensuel)
// ═══════════════════════════════════════

export async function importDivaltoTiers(orgSlug: string, csvText: string, filename: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  const result = parseDivaltoExport(csvText)
  if (result.format !== 'tiers') {
    return { error: 'Ce fichier n\'est pas un export Divalto "Tri par Tiers". Vérifiez le format.' }
  }
  if (result.records.length === 0) {
    return { error: result.errors[0] ?? 'Aucune donnée trouvée' }
  }

  const tiersRecords = result.records as DivaltoTiersRecord[]
  const mappings = buildProductClientMappings(result.product_clients!)
  const needs = computeNeeds(tiersRecords)

  const { data: batch, error: batchErr } = await ctx.supabase
    .from('prev_import_batches')
    .insert({
      organization_id: ctx.orgId,
      import_type: 'referentiel',
      filename,
      source: 'divalto_tiers',
      row_count: tiersRecords.length,
      imported_by: ctx.user.id,
    })
    .select('id')
    .single()

  if (batchErr || !batch) return { error: 'Erreur lors de la création du lot d\'import' }

  let clientsCreated = 0
  let productsUpdated = 0

  const uniqueClients = new Map<string, string>()
  for (const r of tiersRecords) {
    uniqueClients.set(r.code_client, r.nom_client)
  }

  for (const [code, name] of uniqueClients) {
    const { error } = await ctx.supabase
      .from('prev_clients')
      .upsert(
        {
          organization_id: ctx.orgId,
          code,
          name,
          client_type: 'custom_order',
          dispatch_priority: 'journee',
        },
        { onConflict: 'organization_id,code' },
      )
    if (!error) clientsCreated++
  }

  for (const mapping of mappings) {
    const stockType = mapping.type_stock
    const { data: existingProducts } = await ctx.supabase
      .from('prev_products')
      .select('id, recipe_id')
      .eq('code', mapping.code_produit)
      .is('deleted_at', null)
      .limit(1)

    if (existingProducts && existingProducts.length > 0 && existingProducts[0].recipe_id) {
      await ctx.supabase
        .from('prev_recipes')
        .update({ stock_type: stockType })
        .eq('id', existingProducts[0].recipe_id)
      productsUpdated++
    }
  }

  await ctx.supabase
    .from('prev_import_batches')
    .update({
      matched_count: productsUpdated,
      unmatched_count: mappings.length - productsUpdated,
    })
    .eq('id', batch.id)

  revalidate(orgSlug)
  return {
    success: true,
    batchId: batch.id,
    format: 'tiers' as const,
    period: result.period_start && result.period_end
      ? `${result.period_start} → ${result.period_end}`
      : null,
    totalRecords: tiersRecords.length,
    uniqueProducts: mappings.length,
    uniqueClients: uniqueClients.size,
    clientsCreated,
    productsUpdated,
    needs: needs.slice(0, 20),
    errors: result.errors,
  }
}

// ═══════════════════════════════════════
// DIVALTO IMPORT — Tri par Article (commandes du jour)
// ═══════════════════════════════════════

export async function importDivaltoArticle(
  orgSlug: string,
  csvText: string,
  deliveryDate: string,
  filename: string,
) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  const result = parseDivaltoExport(csvText)
  if (result.format !== 'article') {
    return { error: 'Ce fichier n\'est pas un export Divalto "Tri par Article". Vérifiez le format.' }
  }
  if (result.records.length === 0) {
    return { error: result.errors[0] ?? 'Aucune donnée trouvée' }
  }

  const articleRecords = result.records as DivaltoArticleRecord[]
  const effectiveDate = deliveryDate || extractDateFromFilename(filename) || new Date().toISOString().split('T')[0]

  const { data: allProducts } = await ctx.supabase
    .from('prev_products')
    .select('id, code')
    .is('deleted_at', null)

  const productMap = new Map((allProducts ?? []).map((p) => [p.code, p.id]))

  const { data: batch, error: batchErr } = await ctx.supabase
    .from('prev_import_batches')
    .insert({
      organization_id: ctx.orgId,
      import_type: 'commandes',
      filename,
      source: 'divalto_article',
      row_count: articleRecords.length,
      imported_by: ctx.user.id,
    })
    .select('id')
    .single()

  if (batchErr || !batch) return { error: 'Erreur lors de la création du lot d\'import' }

  let matchedCount = 0
  let unmatchedCount = 0

  const ordersToInsert = articleRecords.map((r) => {
    const productId = productMap.get(r.code_produit) ?? null
    if (productId) matchedCount++
    else unmatchedCount++

    return {
      organization_id: ctx.orgId,
      import_batch_id: batch.id,
      order_type: 'commande' as const,
      delivery_date: r.date_livraison
        ? convertDivaltoDate(r.date_livraison) ?? effectiveDate
        : effectiveDate,
      product_id: productId,
      product_code_raw: r.code_produit,
      product_label_raw: r.designation,
      quantity_pieces: Math.round(r.quantite),
      quantity_colis: r.colis || null,
      total_weight_grams: Math.round(r.poids_kg * 1000),
      unit_price_gross_cents: r.pu_brut ? Math.round(r.pu_brut * 100) : null,
      unit_price_net_cents: r.pu_net ? Math.round(r.pu_net * 100) : null,
      probability_pct: 100,
      status: 'en_attente',
      matched: !!productId,
    }
  })

  if (ordersToInsert.length > 0) {
    const batchSize = 500
    for (let i = 0; i < ordersToInsert.length; i += batchSize) {
      const chunk = ordersToInsert.slice(i, i + batchSize)
      const { error: insertErr } = await ctx.supabase.from('prev_orders').insert(chunk)
      if (insertErr) return { error: `Erreur lors de l'import (lot ${i / batchSize + 1})` }
    }
  }

  await ctx.supabase
    .from('prev_import_batches')
    .update({ matched_count: matchedCount, unmatched_count: unmatchedCount })
    .eq('id', batch.id)

  const needs = computeNeeds(articleRecords)

  revalidate(orgSlug)
  return {
    success: true,
    batchId: batch.id,
    format: 'article' as const,
    period: result.period_start && result.period_end
      ? `${result.period_start} → ${result.period_end}`
      : null,
    deliveryDate: effectiveDate,
    totalRecords: articleRecords.length,
    matchedCount,
    unmatchedCount,
    needs: needs.slice(0, 20),
    errors: result.errors,
  }
}

function convertDivaltoDate(dateStr: string): string | null {
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  return null
}

// ═══════════════════════════════════════
// CONFIG CSV IMPORT — Products from Divalto Tiers
// ═══════════════════════════════════════

function parseWeightFromDesignation(designation: string): { weightGrams: number; formatLabel: string } | null {
  const match = designation.match(/(\d+(?:[.,]\d+)?)\s*(KG|G)\b/i)
  if (!match) return null
  const value = parseFloat(match[1].replace(',', '.'))
  const unit = match[2].toUpperCase()
  const weightGrams = unit === 'KG' ? Math.round(value * 1000) : Math.round(value)
  const formatLabel = `${match[1].replace(',', '.')}${unit.toLowerCase()}`
  return { weightGrams, formatLabel }
}

export async function importProductsCsv(orgSlug: string, csvText: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  const result = parseDivaltoExport(csvText)
  if (result.format !== 'tiers') {
    return { error: 'Ce fichier n\'est pas un export Divalto "Tri par Tiers".' }
  }
  if (result.records.length === 0) {
    return { error: result.errors[0] ?? 'Aucune donnée trouvée' }
  }

  const tiersRecords = result.records as DivaltoTiersRecord[]

  const uniqueProducts = new Map<string, { designation: string; poidsKg: number }>()
  for (const r of tiersRecords) {
    if (!uniqueProducts.has(r.code_produit)) {
      uniqueProducts.set(r.code_produit, { designation: r.designation, poidsKg: r.poids_kg })
    }
  }

  const { data: existingProducts } = await ctx.supabase
    .from('prev_products')
    .select('code')
    .is('deleted_at', null)

  const existingCodes = new Set((existingProducts ?? []).map((p) => p.code))

  const { data: defaultRecipe } = await ctx.supabase
    .from('prev_recipes')
    .select('id')
    .is('deleted_at', null)
    .order('created_at')
    .limit(1)
    .single()

  if (!defaultRecipe) {
    return { error: 'Créez au moins une recette avant d\'importer des produits.' }
  }

  let created = 0
  let skipped = 0

  for (const [code, data] of uniqueProducts) {
    if (existingCodes.has(code)) {
      skipped++
      continue
    }

    const parsed = parseWeightFromDesignation(data.designation)
    const weightGrams = parsed?.weightGrams ?? (Math.round(data.poidsKg * 1000) || 1000)
    const formatLabel = parsed?.formatLabel ?? `${data.poidsKg}kg`

    const { error } = await ctx.supabase.from('prev_products').insert({
      organization_id: ctx.orgId,
      code,
      label: data.designation,
      recipe_id: defaultRecipe.id,
      weight_grams: weightGrams,
      format_label: formatLabel,
    })
    if (!error) created++
  }

  revalidate(orgSlug)
  return { success: true, created, skipped, total: uniqueProducts.size }
}

// ═══════════════════════════════════════
// CONFIG CSV IMPORT — Clients from Divalto Tiers
// ═══════════════════════════════════════

export async function importClientsCsv(orgSlug: string, csvText: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  const result = parseDivaltoExport(csvText)
  if (result.format !== 'tiers') {
    return { error: 'Ce fichier n\'est pas un export Divalto "Tri par Tiers".' }
  }
  if (result.records.length === 0) {
    return { error: result.errors[0] ?? 'Aucune donnée trouvée' }
  }

  const tiersRecords = result.records as DivaltoTiersRecord[]

  const uniqueClients = new Map<string, string>()
  for (const r of tiersRecords) {
    if (!uniqueClients.has(r.code_client)) {
      uniqueClients.set(r.code_client, r.nom_client)
    }
  }

  const { data: existingClients } = await ctx.supabase
    .from('prev_clients')
    .select('code')
    .is('deleted_at', null)

  const existingCodes = new Set((existingClients ?? []).map((c) => c.code))

  let created = 0
  let skipped = 0

  for (const [code, name] of uniqueClients) {
    if (existingCodes.has(code)) {
      skipped++
      continue
    }

    const { error } = await ctx.supabase.from('prev_clients').insert({
      organization_id: ctx.orgId,
      code,
      name,
      client_type: 'custom_order',
      dispatch_priority: 'journee',
    })
    if (!error) created++
  }

  revalidate(orgSlug)
  return { success: true, created, skipped, total: uniqueClients.size }
}

// ═══════════════════════════════════════
// CONFIG CSV IMPORT — Recipes from NOMENCLATURE.csv
// ═══════════════════════════════════════

export async function importRecipesCsv(orgSlug: string, csvText: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { error: 'Fichier vide ou invalide' }

  const header = lines[0].toLowerCase()
  if (!header.includes('code_recette') || !header.includes('nom_recette')) {
    return { error: 'Format invalide. Colonnes attendues : code_recette, nom_recette, lot_kg' }
  }

  const uniqueRecipes = new Map<string, { name: string; lotKg: number }>()
  for (const line of lines.slice(1)) {
    const fields = line.split(';')
    if (fields.length < 3) continue
    const code = fields[0].trim()
    const name = fields[1].trim()
    const lotKg = parseFloat(fields[2].replace(',', '.')) || 0
    if (!code || !name) continue
    if (!uniqueRecipes.has(code)) {
      uniqueRecipes.set(code, { name, lotKg })
    }
  }

  if (uniqueRecipes.size === 0) return { error: 'Aucune recette trouvée dans le fichier' }

  const { data: existingRecipes } = await ctx.supabase
    .from('prev_recipes')
    .select('code')
    .is('deleted_at', null)

  const existingCodes = new Set((existingRecipes ?? []).map((r) => r.code))

  let created = 0
  let skipped = 0

  for (const [code, data] of uniqueRecipes) {
    if (existingCodes.has(code)) {
      skipped++
      continue
    }

    const minBatchGrams = data.lotKg > 0 ? Math.round(data.lotKg * 1000) : 30000

    const { error } = await ctx.supabase.from('prev_recipes').insert({
      organization_id: ctx.orgId,
      code,
      name: data.name,
      stock_type: 'sur_commande',
      dispatch_priority: 'journee',
      forecast_method: 'dernier_jour',
      coverage_j1_pct: 0,
      min_batch_grams: minBatchGrams,
      min_batch_exception: false,
      loss_pct: 3,
    })
    if (!error) created++
  }

  revalidate(orgSlug)
  return { success: true, created, skipped, total: uniqueRecipes.size }
}
