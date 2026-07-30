'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Profile, MarginLevel } from '@/types/database'
import {
  computeProductCost,
  computeMarginLevel,
  type RecipeLineInput,
  type PackagingLineInput,
  type LaborInput,
  type ThresholdConfig,
} from './lib/cost-calculations'
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
  revalidatePath(`/${orgSlug}/marge-flash`)
  revalidatePath(`/${orgSlug}/marge-flash/produits`)
  revalidatePath(`/${orgSlug}/marge-flash/referentiels`)
  revalidatePath(`/${orgSlug}/marge-flash/import`)
  revalidatePath(`/${orgSlug}/marge-flash/configuration`)
}

// ═══════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════

const categorySchema = z.object({ name: z.string().min(1).max(100) })

export async function getCategories() {
  const ctx = await getOrgContext()
  if (!ctx) return []
  const { data } = await ctx.supabase
    .from('product_categories')
    .select('*')
    .eq('organization_id', ctx.orgId)
    .is('deleted_at', null)
    .order('name')
  return data ?? []
}

export async function createCategory(orgSlug: string, raw: { name: string }) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = categorySchema.safeParse(raw)
  if (!parsed.success) return { error: 'Nom invalide' }
  const { error } = await ctx.supabase.from('product_categories').insert({ ...parsed.data, organization_id: ctx.orgId })
  if (error) return { error: 'Erreur création' }
  revalidate(orgSlug)
  return { success: true }
}

export async function deleteCategory(orgSlug: string, id: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  await ctx.supabase.from('product_categories').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('organization_id', ctx.orgId)
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════════

const customerSchema = z.object({ name: z.string().min(1).max(100) })

export async function getCustomers() {
  const ctx = await getOrgContext()
  if (!ctx) return []
  const { data } = await ctx.supabase
    .from('customers')
    .select('*')
    .eq('organization_id', ctx.orgId)
    .is('deleted_at', null)
    .order('name')
  return data ?? []
}

export async function createCustomer(orgSlug: string, raw: { name: string }) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = customerSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Nom invalide' }
  const { error } = await ctx.supabase.from('customers').insert({ ...parsed.data, organization_id: ctx.orgId })
  if (error) return { error: 'Erreur création' }
  revalidate(orgSlug)
  return { success: true }
}

export async function deleteCustomer(orgSlug: string, id: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  await ctx.supabase.from('customers').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('organization_id', ctx.orgId)
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// INGREDIENTS
// ═══════════════════════════════════════

const ingredientSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(100).nullable().optional(),
  unit: z.string().min(1).max(20).default('kg'),
  price_cents: z.number().int().min(0),
  supplier: z.string().max(200).nullable().optional(),
})

export async function getIngredients() {
  const ctx = await getOrgContext()
  if (!ctx) return []
  const { data } = await ctx.supabase
    .from('ingredients')
    .select('*')
    .eq('organization_id', ctx.orgId)
    .is('deleted_at', null)
    .order('name')
  return data ?? []
}

export async function createIngredient(orgSlug: string, raw: z.infer<typeof ingredientSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = ingredientSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Données invalides' }
  const { error } = await ctx.supabase.from('ingredients').insert({
    ...parsed.data,
    organization_id: ctx.orgId,
    price_updated_at: new Date().toISOString(),
  })
  if (error) return { error: 'Erreur création' }
  revalidate(orgSlug)
  return { success: true }
}

export async function updateIngredient(orgSlug: string, id: string, raw: z.infer<typeof ingredientSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = ingredientSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Données invalides' }

  // Check if price changed for history
  const { data: current } = await ctx.supabase.from('ingredients').select('price_cents').eq('id', id).eq('organization_id', ctx.orgId).single()
  if (current && current.price_cents !== parsed.data.price_cents) {
    await ctx.supabase.from('ingredient_price_history').insert({
      ingredient_id: id,
      price_cents: current.price_cents,
    })
  }

  const { error } = await ctx.supabase.from('ingredients').update({
    ...parsed.data,
    price_updated_at: new Date().toISOString(),
  }).eq('id', id).eq('organization_id', ctx.orgId)
  if (error) return { error: 'Erreur mise à jour' }

  // Cascade recalculate product sheets using this ingredient
  if (current && current.price_cents !== parsed.data.price_cents) {
    await recalculateSheetsForIngredient(ctx, id, orgSlug)
  }

  revalidate(orgSlug)
  return { success: true }
}

export async function deleteIngredient(orgSlug: string, id: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  await ctx.supabase.from('ingredients').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('organization_id', ctx.orgId)
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// PACKAGING ITEMS
// ═══════════════════════════════════════

const packagingItemSchema = z.object({
  name: z.string().min(1).max(200),
  packaging_type: z.string().max(50).nullable().optional(),
  unit: z.string().min(1).max(20).default('pièce'),
  unit_price_cents: z.number().int().min(0),
  supplier: z.string().max(200).nullable().optional(),
})

export async function getPackagingItems() {
  const ctx = await getOrgContext()
  if (!ctx) return []
  const { data } = await ctx.supabase
    .from('packaging_items')
    .select('*')
    .eq('organization_id', ctx.orgId)
    .is('deleted_at', null)
    .order('name')
  return data ?? []
}

export async function createPackagingItem(orgSlug: string, raw: z.infer<typeof packagingItemSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = packagingItemSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Données invalides' }
  const { error } = await ctx.supabase.from('packaging_items').insert({
    ...parsed.data,
    organization_id: ctx.orgId,
    price_updated_at: new Date().toISOString(),
  })
  if (error) return { error: 'Erreur création' }
  revalidate(orgSlug)
  return { success: true }
}

export async function updatePackagingItem(orgSlug: string, id: string, raw: z.infer<typeof packagingItemSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = packagingItemSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Données invalides' }

  const { data: current } = await ctx.supabase.from('packaging_items').select('unit_price_cents').eq('id', id).eq('organization_id', ctx.orgId).single()

  const { error } = await ctx.supabase.from('packaging_items').update({
    ...parsed.data,
    price_updated_at: new Date().toISOString(),
  }).eq('id', id).eq('organization_id', ctx.orgId)
  if (error) return { error: 'Erreur mise à jour' }

  if (current && current.unit_price_cents !== parsed.data.unit_price_cents) {
    await recalculateSheetsForPackaging(ctx, id, orgSlug)
  }

  revalidate(orgSlug)
  return { success: true }
}

export async function deletePackagingItem(orgSlug: string, id: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  await ctx.supabase.from('packaging_items').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('organization_id', ctx.orgId)
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// LABOR POLES
// ═══════════════════════════════════════

const laborPoleSchema = z.object({
  name: z.string().min(1).max(100),
  default_headcount: z.number().int().min(1).default(1),
  hourly_rate_cents: z.number().int().min(0),
  display_order: z.number().int().min(0).optional().default(0),
})

export async function getLaborPoles() {
  const ctx = await getOrgContext()
  if (!ctx) return []
  const { data } = await ctx.supabase
    .from('labor_poles')
    .select('*')
    .eq('organization_id', ctx.orgId)
    .is('deleted_at', null)
    .order('display_order')
  return data ?? []
}

export async function createLaborPole(orgSlug: string, raw: z.infer<typeof laborPoleSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = laborPoleSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Données invalides' }
  const { error } = await ctx.supabase.from('labor_poles').insert({ ...parsed.data, organization_id: ctx.orgId })
  if (error) return { error: 'Erreur création' }
  revalidate(orgSlug)
  return { success: true }
}

export async function updateLaborPole(orgSlug: string, id: string, raw: z.infer<typeof laborPoleSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = laborPoleSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Données invalides' }
  const { error } = await ctx.supabase.from('labor_poles').update(parsed.data).eq('id', id).eq('organization_id', ctx.orgId)
  if (error) return { error: 'Erreur mise à jour' }
  revalidate(orgSlug)
  return { success: true }
}

export async function deleteLaborPole(orgSlug: string, id: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  await ctx.supabase.from('labor_poles').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('organization_id', ctx.orgId)
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// PRODUCT SHEETS
// ═══════════════════════════════════════

const productSheetSchema = z.object({
  name: z.string().min(1).max(200),
  category_id: z.string().uuid().nullable().optional(),
  customer_id: z.string().uuid().nullable().optional(),
  selling_price_cents: z.number().int().min(0).nullable().optional(),
  theoretical_output_per_hour: z.number().int().min(0).nullable().optional(),
  line_id: z.string().uuid().nullable().optional(),
})

export async function getProductSheets() {
  const ctx = await getOrgContext()
  if (!ctx) return []
  const { data } = await ctx.supabase
    .from('product_sheets')
    .select('*, product_categories(name), customers(name)')
    .eq('organization_id', ctx.orgId)
    .is('deleted_at', null)
    .order('name')
  return data ?? []
}

export async function getProductSheet(id: string) {
  const ctx = await getOrgContext()
  if (!ctx) return null
  const { data } = await ctx.supabase
    .from('product_sheets')
    .select('*, product_categories(name), customers(name)')
    .eq('id', id)
    .eq('organization_id', ctx.orgId)
    .single()
  return data
}

export async function createProductSheet(orgSlug: string, raw: z.infer<typeof productSheetSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = productSheetSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Données invalides' }
  const { data, error } = await ctx.supabase
    .from('product_sheets')
    .insert({ ...parsed.data, organization_id: ctx.orgId })
    .select('id')
    .single()
  if (error || !data) return { error: 'Erreur création' }
  revalidate(orgSlug)
  return { success: true, id: data.id }
}

export async function updateProductSheet(orgSlug: string, id: string, raw: z.infer<typeof productSheetSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = productSheetSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Données invalides' }
  const { error } = await ctx.supabase.from('product_sheets').update(parsed.data).eq('id', id).eq('organization_id', ctx.orgId)
  if (error) return { error: 'Erreur mise à jour' }
  await recalculateSheet(ctx, id)
  revalidate(orgSlug)
  return { success: true }
}

export async function deleteProductSheet(orgSlug: string, id: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  await ctx.supabase.from('product_sheets').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('organization_id', ctx.orgId)
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// RECIPE LINES
// ═══════════════════════════════════════

const recipeLineSchema = z.object({
  product_sheet_id: z.string().uuid(),
  ingredient_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  unit: z.string().min(1).default('g'),
  display_order: z.number().int().min(0).optional().default(0),
})

export async function getRecipeLines(sheetId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return []
  const { data } = await ctx.supabase
    .from('recipe_lines')
    .select('*, ingredients(name, price_cents, unit)')
    .eq('product_sheet_id', sheetId)
    .eq('organization_id', ctx.orgId)
    .order('display_order')
  return data ?? []
}

export async function addRecipeLine(orgSlug: string, raw: z.input<typeof recipeLineSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = recipeLineSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Données invalides' }

  // Compute line cost
  const { data: ing } = await ctx.supabase.from('ingredients').select('price_cents, unit').eq('id', parsed.data.ingredient_id).single()
  let lineCost = 0
  if (ing) {
    const { convertToBaseUnit, pricePerBaseUnit } = await import('./lib/unit-conversions')
    const qtyBase = convertToBaseUnit(parsed.data.quantity, parsed.data.unit)
    const ppu = pricePerBaseUnit(ing.price_cents, ing.unit)
    lineCost = Math.round(qtyBase * ppu)
  }

  const { error } = await ctx.supabase.from('recipe_lines').insert({
    ...parsed.data,
    organization_id: ctx.orgId,
    line_cost_cents: lineCost,
  })
  if (error) return { error: 'Erreur ajout' }
  await recalculateSheet(ctx, parsed.data.product_sheet_id)
  revalidate(orgSlug)
  return { success: true }
}

export async function removeRecipeLine(orgSlug: string, id: string, sheetId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  await ctx.supabase.from('recipe_lines').delete().eq('id', id).eq('organization_id', ctx.orgId)
  await recalculateSheet(ctx, sheetId)
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// PACKAGING LINES
// ═══════════════════════════════════════

const packagingLineSchema = z.object({
  product_sheet_id: z.string().uuid(),
  packaging_item_id: z.string().uuid(),
  quantity_per_product: z.number().min(0.0001),
  display_order: z.number().int().min(0).optional().default(0),
})

export async function getPackagingLines(sheetId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return []
  const { data } = await ctx.supabase
    .from('packaging_lines')
    .select('*, packaging_items(name, unit_price_cents, unit)')
    .eq('product_sheet_id', sheetId)
    .eq('organization_id', ctx.orgId)
    .order('display_order')
  return data ?? []
}

export async function addPackagingLine(orgSlug: string, raw: z.input<typeof packagingLineSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = packagingLineSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Données invalides' }

  const { data: item } = await ctx.supabase.from('packaging_items').select('unit_price_cents').eq('id', parsed.data.packaging_item_id).single()
  const lineCost = item ? Math.round(parsed.data.quantity_per_product * item.unit_price_cents) : 0

  const { error } = await ctx.supabase.from('packaging_lines').insert({
    ...parsed.data,
    organization_id: ctx.orgId,
    line_cost_cents: lineCost,
  })
  if (error) return { error: 'Erreur ajout' }
  await recalculateSheet(ctx, parsed.data.product_sheet_id)
  revalidate(orgSlug)
  return { success: true }
}

export async function removePackagingLine(orgSlug: string, id: string, sheetId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  await ctx.supabase.from('packaging_lines').delete().eq('id', id).eq('organization_id', ctx.orgId)
  await recalculateSheet(ctx, sheetId)
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// PRODUCT LABOR
// ═══════════════════════════════════════

const productLaborSchema = z.object({
  product_sheet_id: z.string().uuid(),
  pole_id: z.string().uuid(),
  headcount_override: z.number().int().min(1).nullable().optional(),
  rate_override_cents: z.number().int().min(0).nullable().optional(),
})

export async function getProductLabor(sheetId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return []
  const { data } = await ctx.supabase
    .from('product_labor')
    .select('*, labor_poles(name, default_headcount, hourly_rate_cents)')
    .eq('product_sheet_id', sheetId)
    .eq('organization_id', ctx.orgId)
  return data ?? []
}

export async function addProductLabor(orgSlug: string, raw: z.infer<typeof productLaborSchema>) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const parsed = productLaborSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Données invalides' }
  const { error } = await ctx.supabase.from('product_labor').insert({ ...parsed.data, organization_id: ctx.orgId })
  if (error) return { error: 'Erreur ajout' }
  await recalculateSheet(ctx, parsed.data.product_sheet_id)
  revalidate(orgSlug)
  return { success: true }
}

export async function removeProductLabor(orgSlug: string, id: string, sheetId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  await ctx.supabase.from('product_labor').delete().eq('id', id).eq('organization_id', ctx.orgId)
  await recalculateSheet(ctx, sheetId)
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// MARGIN THRESHOLDS
// ═══════════════════════════════════════

export async function getMarginThresholds() {
  const ctx = await getOrgContext()
  if (!ctx) return null
  const { data, error } = await ctx.supabase
    .from('margin_thresholds')
    .select('*')
    .eq('organization_id', ctx.orgId)
    .single()
  if (error?.code === 'PGRST116') {
    const { data: created } = await ctx.supabase
      .from('margin_thresholds')
      .insert({ organization_id: ctx.orgId })
      .select('*')
      .single()
    return created
  }
  return data
}

export async function updateMarginThresholds(orgSlug: string, raw: { good_min_bps: number; warning_min_bps: number; price_freshness_days: number }) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }
  const { error } = await ctx.supabase
    .from('margin_thresholds')
    .update(raw)
    .eq('organization_id', ctx.orgId)
  if (error) return { error: 'Erreur mise à jour' }
  revalidate(orgSlug)
  return { success: true }
}

// ═══════════════════════════════════════
// IMPORT (bulk upsert)
// ═══════════════════════════════════════

export interface ImportIngredientRow {
  name: string
  unit: string
  price_cents: number
  category?: string | null
  supplier?: string | null
}

export async function bulkUpsertIngredients(orgSlug: string, rows: ImportIngredientRow[]) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  let created = 0
  let updated = 0
  let errored = 0

  for (const row of rows) {
    const { data: existing } = await ctx.supabase
      .from('ingredients')
      .select('id, price_cents')
      .eq('organization_id', ctx.orgId)
      .eq('name', row.name)
      .is('deleted_at', null)
      .single()

    if (existing) {
      if (existing.price_cents !== row.price_cents) {
        await ctx.supabase.from('ingredient_price_history').insert({ ingredient_id: existing.id, price_cents: existing.price_cents })
      }
      const { error } = await ctx.supabase.from('ingredients').update({
        unit: row.unit,
        price_cents: row.price_cents,
        category: row.category ?? null,
        supplier: row.supplier ?? null,
        price_updated_at: new Date().toISOString(),
      }).eq('id', existing.id)
      if (error) errored++; else updated++
    } else {
      const { error } = await ctx.supabase.from('ingredients').insert({
        name: row.name,
        unit: row.unit,
        price_cents: row.price_cents,
        category: row.category ?? null,
        supplier: row.supplier ?? null,
        organization_id: ctx.orgId,
        price_updated_at: new Date().toISOString(),
      })
      if (error) errored++; else created++
    }
  }

  await ctx.supabase.from('import_logs').insert({
    organization_id: ctx.orgId,
    source_type: 'excel',
    document_type: 'ingredients',
    file_name: 'import',
    items_created: created,
    items_updated: updated,
    items_errored: errored,
    imported_by: ctx.user.id,
  })

  revalidate(orgSlug)
  return { success: true, created, updated, errored }
}

export interface ImportPackagingRow {
  name: string
  unit: string
  unit_price_cents: number
  packaging_type?: string | null
  supplier?: string | null
}

export async function bulkUpsertPackaging(orgSlug: string, rows: ImportPackagingRow[]) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  let created = 0
  let updated = 0
  let errored = 0

  for (const row of rows) {
    const { data: existing } = await ctx.supabase
      .from('packaging_items')
      .select('id')
      .eq('organization_id', ctx.orgId)
      .eq('name', row.name)
      .is('deleted_at', null)
      .single()

    if (existing) {
      const { error } = await ctx.supabase.from('packaging_items').update({
        unit: row.unit,
        unit_price_cents: row.unit_price_cents,
        packaging_type: row.packaging_type ?? null,
        supplier: row.supplier ?? null,
        price_updated_at: new Date().toISOString(),
      }).eq('id', existing.id)
      if (error) errored++; else updated++
    } else {
      const { error } = await ctx.supabase.from('packaging_items').insert({
        name: row.name,
        unit: row.unit,
        unit_price_cents: row.unit_price_cents,
        packaging_type: row.packaging_type ?? null,
        supplier: row.supplier ?? null,
        organization_id: ctx.orgId,
        price_updated_at: new Date().toISOString(),
      })
      if (error) errored++; else created++
    }
  }

  await ctx.supabase.from('import_logs').insert({
    organization_id: ctx.orgId,
    source_type: 'excel',
    document_type: 'packaging',
    file_name: 'import',
    items_created: created,
    items_updated: updated,
    items_errored: errored,
    imported_by: ctx.user.id,
  })

  revalidate(orgSlug)
  return { success: true, created, updated, errored }
}

export interface ImportLaborRow {
  name: string
  default_headcount: number
  hourly_rate_cents: number
}

export async function bulkUpsertLabor(orgSlug: string, rows: ImportLaborRow[]) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Non authentifié' }

  let created = 0
  let updated = 0
  let errored = 0

  for (const row of rows) {
    const { data: existing } = await ctx.supabase
      .from('labor_poles')
      .select('id')
      .eq('organization_id', ctx.orgId)
      .eq('name', row.name)
      .is('deleted_at', null)
      .single()

    if (existing) {
      const { error } = await ctx.supabase.from('labor_poles').update({
        default_headcount: row.default_headcount,
        hourly_rate_cents: row.hourly_rate_cents,
      }).eq('id', existing.id)
      if (error) errored++; else updated++
    } else {
      const { error } = await ctx.supabase.from('labor_poles').insert({
        name: row.name,
        default_headcount: row.default_headcount,
        hourly_rate_cents: row.hourly_rate_cents,
        organization_id: ctx.orgId,
      })
      if (error) errored++; else created++
    }
  }

  await ctx.supabase.from('import_logs').insert({
    organization_id: ctx.orgId,
    source_type: 'excel',
    document_type: 'labor',
    file_name: 'import',
    items_created: created,
    items_updated: updated,
    items_errored: errored,
    imported_by: ctx.user.id,
  })

  revalidate(orgSlug)
  return { success: true, created, updated, errored }
}

// ═══════════════════════════════════════
// DASHBOARD DATA
// ═══════════════════════════════════════

export async function getDashboardData() {
  const ctx = await getOrgContext()
  if (!ctx) return null

  const thresholds = await getMarginThresholds()
  const freshnessDays = thresholds?.price_freshness_days ?? 30

  const { data: sheets } = await ctx.supabase
    .from('product_sheets')
    .select('*, product_categories(name), customers(name)')
    .eq('organization_id', ctx.orgId)
    .is('deleted_at', null)
    .order('margin_rate_bps', { ascending: true, nullsFirst: false })

  const now = new Date()
  const freshnessDate = new Date(now.getTime() - freshnessDays * 24 * 60 * 60 * 1000).toISOString()

  const { count: staleIngredients } = await ctx.supabase
    .from('ingredients')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', ctx.orgId)
    .is('deleted_at', null)
    .lt('price_updated_at', freshnessDate)

  const { count: stalePackaging } = await ctx.supabase
    .from('packaging_items')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', ctx.orgId)
    .is('deleted_at', null)
    .lt('price_updated_at', freshnessDate)

  const allSheets = sheets ?? []
  const withMargin = allSheets.filter((s: { margin_rate_bps: number | null }) => s.margin_rate_bps != null)
  const totalWeightedMargin = withMargin.reduce((sum: number, s: { margin_rate_bps: number | null }) => sum + (s.margin_rate_bps ?? 0), 0)
  const avgMarginBps = withMargin.length > 0 ? Math.round(totalWeightedMargin / withMargin.length) : 0

  const alertCount = allSheets.filter((s: { margin_level: string | null }) => s.margin_level === 'warning' || s.margin_level === 'critical').length
  const lossCount = allSheets.filter((s: { margin_level: string | null }) => s.margin_level === 'loss').length
  const stalePricesCount = (staleIngredients ?? 0) + (stalePackaging ?? 0)

  return {
    sheets: allSheets,
    avgMarginBps,
    alertCount,
    lossCount,
    stalePricesCount,
    freshnessDays,
  }
}

// ═══════════════════════════════════════
// RECALCULATION ENGINE
// ═══════════════════════════════════════

interface OrgCtx {
  supabase: Awaited<ReturnType<typeof createServerClient>>
  orgId: string
  user: { id: string }
  profile: Pick<Profile, 'organization_id' | 'role'>
}

async function getThresholdConfig(ctx: OrgCtx): Promise<ThresholdConfig> {
  const { data } = await ctx.supabase
    .from('margin_thresholds')
    .select('good_min_bps, warning_min_bps')
    .eq('organization_id', ctx.orgId)
    .single()
  return data ? { goodMinBps: data.good_min_bps, warningMinBps: data.warning_min_bps } : { goodMinBps: 2000, warningMinBps: 1000 }
}

async function recalculateSheet(ctx: OrgCtx, sheetId: string) {
  const { data: sheet } = await ctx.supabase
    .from('product_sheets')
    .select('selling_price_cents, theoretical_output_per_hour')
    .eq('id', sheetId)
    .single()
  if (!sheet) return

  const { data: rLines } = await ctx.supabase
    .from('recipe_lines')
    .select('id, quantity, unit, ingredients(price_cents, unit)')
    .eq('product_sheet_id', sheetId)

  const { data: pLines } = await ctx.supabase
    .from('packaging_lines')
    .select('id, quantity_per_product, packaging_items(unit_price_cents)')
    .eq('product_sheet_id', sheetId)

  const { data: labor } = await ctx.supabase
    .from('product_labor')
    .select('headcount_override, rate_override_cents, labor_poles(default_headcount, hourly_rate_cents)')
    .eq('product_sheet_id', sheetId)

  const thresholds = await getThresholdConfig(ctx)

  // Supabase may type FK joins as arrays — safely unwrap
  const unwrap = <T,>(val: T | T[] | null): T | null =>
    Array.isArray(val) ? val[0] ?? null : val

  const recipeInputs: RecipeLineInput[] = (rLines ?? []).map((l) => {
    const ing = unwrap(l.ingredients)
    return {
      quantity: l.quantity,
      unit: l.unit,
      ingredient_price_cents: ing?.price_cents ?? 0,
      ingredient_unit: ing?.unit ?? 'kg',
    }
  })

  const packInputs: PackagingLineInput[] = (pLines ?? []).map((l) => {
    const pkg = unwrap(l.packaging_items)
    return {
      quantity_per_product: l.quantity_per_product,
      unit_price_cents: pkg?.unit_price_cents ?? 0,
    }
  })

  const laborInputs: LaborInput[] = (labor ?? []).map((l) => {
    const pole = unwrap(l.labor_poles)
    return {
      headcount: l.headcount_override ?? pole?.default_headcount ?? 1,
      hourly_rate_cents: l.rate_override_cents ?? pole?.hourly_rate_cents ?? 0,
    }
  })

  const result = computeProductCost(
    recipeInputs,
    packInputs,
    laborInputs,
    sheet.theoretical_output_per_hour,
    sheet.selling_price_cents,
    thresholds,
  )

  await ctx.supabase.from('product_sheets').update({
    mp_cost_cents: result.mpCostCents,
    packaging_cost_cents: result.packagingCostCents,
    labor_cost_cents: result.laborCostCents,
    total_cost_cents: result.totalCostCents,
    margin_cents: result.marginCents,
    margin_rate_bps: result.marginRateBps,
    margin_level: result.marginLevel,
  }).eq('id', sheetId)

  const { convertToBaseUnit, pricePerBaseUnit } = await import('./lib/unit-conversions')

  for (const rl of rLines ?? []) {
    const ing = unwrap(rl.ingredients)
    if (!ing) continue
    const qtyBase = convertToBaseUnit(rl.quantity, rl.unit)
    const ppu = pricePerBaseUnit(ing.price_cents, ing.unit)
    const cost = Math.round(qtyBase * ppu)
    await ctx.supabase.from('recipe_lines').update({ line_cost_cents: cost }).eq('id', rl.id)
  }

  for (const pl of pLines ?? []) {
    const pkg = unwrap(pl.packaging_items)
    if (!pkg) continue
    const cost = Math.round(pl.quantity_per_product * pkg.unit_price_cents)
    await ctx.supabase.from('packaging_lines').update({ line_cost_cents: cost }).eq('id', pl.id)
  }
}

async function recalculateSheetsForIngredient(ctx: OrgCtx, ingredientId: string, _orgSlug: string) {
  const { data: lines } = await ctx.supabase
    .from('recipe_lines')
    .select('product_sheet_id')
    .eq('ingredient_id', ingredientId)
    .eq('organization_id', ctx.orgId)

  const sheetIds = [...new Set((lines ?? []).map((l: { product_sheet_id: string }) => l.product_sheet_id))]
  for (const sid of sheetIds) {
    await recalculateSheet(ctx, sid)
  }
}

async function recalculateSheetsForPackaging(ctx: OrgCtx, packagingItemId: string, _orgSlug: string) {
  const { data: lines } = await ctx.supabase
    .from('packaging_lines')
    .select('product_sheet_id')
    .eq('packaging_item_id', packagingItemId)
    .eq('organization_id', ctx.orgId)

  const sheetIds = [...new Set((lines ?? []).map((l: { product_sheet_id: string }) => l.product_sheet_id))]
  for (const sid of sheetIds) {
    await recalculateSheet(ctx, sid)
  }
}
