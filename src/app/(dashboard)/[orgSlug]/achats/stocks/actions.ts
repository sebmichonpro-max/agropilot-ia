'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import {
  storageZoneSchema,
  productReferenceSchema,
  palletSchema,
  palletMovementSchema,
  kmSettingsSchema,
} from '@/lib/validation/km'
import {
  calculateKm,
  calculateBatchKm,
  calculateWeightedAverageKm,
} from '@/modules/km/calculator'
import type {
  Pallet,
  PalletMovement,
  StorageZone,
  ProductReference,
  KmSettings,
  KmResult,
  PalletWithMovements,
} from '@/modules/km/types'

async function getOrgId() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, orgId: null, userId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  return {
    supabase,
    orgId: profile?.organization_id ?? null,
    userId: user.id,
  }
}

// ─── Storage Zones ───

export async function createStorageZone(
  orgSlug: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId, userId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = storageZoneSchema.safeParse(
      Object.fromEntries(formData)
    )
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const { error } = await supabase.from('storage_zones').insert({
      ...parsed.data,
      organization_id: orgId,
      created_by: userId,
    })

    if (error) return { error: 'Erreur lors de la création de la zone' }

    revalidatePath(`/${orgSlug}/achats/stocks`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function updateStorageZone(
  orgSlug: string,
  zoneId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = storageZoneSchema.safeParse(
      Object.fromEntries(formData)
    )
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const { error } = await supabase
      .from('storage_zones')
      .update(parsed.data)
      .eq('id', zoneId)

    if (error) return { error: 'Erreur lors de la mise à jour' }

    revalidatePath(`/${orgSlug}/achats/stocks`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function deleteStorageZone(
  orgSlug: string,
  zoneId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const { error } = await supabase
      .from('storage_zones')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', zoneId)

    if (error) return { error: 'Erreur lors de la suppression' }

    revalidatePath(`/${orgSlug}/achats/stocks`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

// ─── Product References ───

export async function createProductReference(
  orgSlug: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId, userId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = productReferenceSchema.safeParse(
      Object.fromEntries(formData)
    )
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const { error } = await supabase.from('product_references').insert({
      ...parsed.data,
      organization_id: orgId,
      created_by: userId,
    })

    if (error) {
      if (error.code === '23505') {
        return { error: 'Ce code produit existe déjà' }
      }
      return { error: 'Erreur lors de la création de la référence' }
    }

    revalidatePath(`/${orgSlug}/achats/stocks`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function updateProductReference(
  orgSlug: string,
  refId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = productReferenceSchema.safeParse(
      Object.fromEntries(formData)
    )
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const { error } = await supabase
      .from('product_references')
      .update(parsed.data)
      .eq('id', refId)

    if (error) return { error: 'Erreur lors de la mise à jour' }

    revalidatePath(`/${orgSlug}/achats/stocks`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function deleteProductReference(
  orgSlug: string,
  refId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const { error } = await supabase
      .from('product_references')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', refId)

    if (error) return { error: 'Erreur lors de la suppression' }

    revalidatePath(`/${orgSlug}/achats/stocks`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

// ─── Pallets ───

export async function createPallet(
  orgSlug: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId, userId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = palletSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const { error } = await supabase.from('pallets').insert({
      ...parsed.data,
      current_quantity: parsed.data.initial_quantity,
      organization_id: orgId,
      created_by: userId,
    })

    if (error) return { error: "Erreur lors de la création de la palette" }

    revalidatePath(`/${orgSlug}/achats/stocks`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function addPalletMovement(
  orgSlug: string,
  palletId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId, userId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const raw = Object.fromEntries(formData)
    const parsed = palletMovementSchema.safeParse({
      ...raw,
      pallet_id: palletId,
    })
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const { data: pallet } = await supabase
      .from('pallets')
      .select('current_quantity')
      .eq('id', palletId)
      .single<Pick<Pallet, 'current_quantity'>>()

    if (!pallet) return { error: 'Palette introuvable' }

    if (parsed.data.quantity > pallet.current_quantity) {
      return {
        error: `Quantité trop élevée (reste ${pallet.current_quantity / 1000} kg)`,
      }
    }

    const { error: mvError } = await supabase
      .from('pallet_movements')
      .insert({
        pallet_id: palletId,
        organization_id: orgId,
        movement_date: parsed.data.movement_date,
        quantity: parsed.data.quantity,
        movement_type: parsed.data.movement_type,
        notes: parsed.data.notes,
        performed_by: userId,
      })

    if (mvError) return { error: "Erreur lors de l'enregistrement du mouvement" }

    const newQuantity = pallet.current_quantity - parsed.data.quantity
    const updates: Record<string, unknown> = {
      current_quantity: newQuantity,
    }
    if (newQuantity <= 0) {
      updates.status = 'empty'
      updates.emptied_date = new Date().toISOString().split('T')[0]
    }

    await supabase.from('pallets').update(updates).eq('id', palletId)

    await recalculateKm(orgSlug, palletId)

    revalidatePath(`/${orgSlug}/achats/stocks`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function closePallet(
  orgSlug: string,
  palletId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const { error } = await supabase
      .from('pallets')
      .update({
        status: 'empty',
        current_quantity: 0,
        emptied_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', palletId)

    if (error) return { error: 'Erreur lors de la clôture' }

    revalidatePath(`/${orgSlug}/achats/stocks`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

// ─── Km Calculation ───

export async function recalculateKm(
  orgSlug: string,
  palletId: string
): Promise<{ success?: boolean; error?: string; result?: KmResult }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const { data: pallet } = await supabase
      .from('pallets')
      .select('*')
      .eq('id', palletId)
      .single<Pallet>()

    if (!pallet) return { error: 'Palette introuvable' }

    const { data: zone } = await supabase
      .from('storage_zones')
      .select('*')
      .eq('id', pallet.storage_zone_id)
      .single<StorageZone>()

    if (!zone) return { error: 'Zone introuvable' }

    const { data: movements } = await supabase
      .from('pallet_movements')
      .select('*')
      .eq('pallet_id', palletId)
      .order('movement_date', { ascending: true })
      .returns<PalletMovement[]>()

    const { data: settings } = await supabase
      .from('km_settings')
      .select('*')
      .eq('organization_id', orgId)
      .single<KmSettings>()

    const capitalCostRate = settings?.capital_cost_rate ?? 500

    const result = calculateKm({
      initialQuantityGrams: pallet.initial_quantity,
      unitPriceCents: pallet.unit_price_cents,
      dailyCostCents: zone.daily_cost_cents,
      thermalFactor: zone.thermal_factor,
      capitalCostRate,
      entryDate: new Date(pallet.entry_date),
      movements: (movements ?? []).map((m) => ({
        date: new Date(m.movement_date),
        quantityGrams: m.quantity,
      })),
    })

    const kmScaled = Math.round(result.value * 10000)

    await supabase
      .from('pallets')
      .update({
        km_value: kmScaled,
        km_last_calculated: new Date().toISOString(),
      })
      .eq('id', palletId)

    revalidatePath(`/${orgSlug}/achats/stocks`)
    return { success: true, result }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function recalculateAllKm(
  orgSlug: string
): Promise<{ success?: boolean; error?: string; count?: number }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const { data: pallets } = await supabase
      .from('pallets')
      .select('id')
      .eq('status', 'in_stock')
      .is('deleted_at', null)
      .returns<Pick<Pallet, 'id'>[]>()

    if (!pallets) return { error: 'Aucune palette trouvée' }

    for (const p of pallets) {
      await recalculateKm(orgSlug, p.id)
    }

    return { success: true, count: pallets.length }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

export async function getKmDashboardData(orgSlug: string) {
  const { supabase, orgId } = await getOrgId()
  if (!orgId) return null

  const [palletsResult, zonesResult, refsResult, settingsResult] =
    await Promise.all([
      supabase
        .from('pallets')
        .select('*')
        .eq('status', 'in_stock')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .returns<Pallet[]>(),
      supabase
        .from('storage_zones')
        .select('*')
        .is('deleted_at', null)
        .returns<StorageZone[]>(),
      supabase
        .from('product_references')
        .select('*')
        .is('deleted_at', null)
        .returns<ProductReference[]>(),
      supabase
        .from('km_settings')
        .select('*')
        .eq('organization_id', orgId)
        .single<KmSettings>(),
    ])

  const pallets = palletsResult.data ?? []
  const zones = zonesResult.data ?? []
  const refs = refsResult.data ?? []
  const settings = settingsResult.data

  const zonesMap = new Map(zones.map((z) => [z.id, z]))
  const refsMap = new Map(refs.map((r) => [r.id, r]))

  const palletIds = pallets.map((p) => p.id)
  const { data: allMovements } = palletIds.length > 0
    ? await supabase
        .from('pallet_movements')
        .select('*')
        .in('pallet_id', palletIds)
        .order('movement_date', { ascending: true })
        .returns<PalletMovement[]>()
    : { data: [] as PalletMovement[] }

  const movementsByPallet = new Map<string, PalletMovement[]>()
  for (const m of allMovements ?? []) {
    const arr = movementsByPallet.get(m.pallet_id) ?? []
    arr.push(m)
    movementsByPallet.set(m.pallet_id, arr)
  }

  const capitalCostRate = settings?.capital_cost_rate ?? 500

  const palletsWithMovements: PalletWithMovements[] = pallets
    .filter((p) => zonesMap.has(p.storage_zone_id) && refsMap.has(p.product_reference_id))
    .map((p) => ({
      pallet: p,
      movements: movementsByPallet.get(p.id) ?? [],
      zone: zonesMap.get(p.storage_zone_id)!,
      reference: refsMap.get(p.product_reference_id)!,
    }))

  const batchResult = calculateBatchKm(palletsWithMovements, capitalCostRate)

  // Aggregate by family
  const byFamily = new Map<string, KmResult[]>()
  for (const pw of palletsWithMovements) {
    const family = pw.reference.family ?? 'Sans famille'
    const arr = byFamily.get(family) ?? []
    const result = batchResult.results.get(pw.pallet.id)
    if (result) arr.push(result)
    byFamily.set(family, arr)
  }

  const familyData = Array.from(byFamily.entries()).map(([family, results]) => ({
    family,
    avgKm: calculateWeightedAverageKm(results),
    count: results.length,
    totalValue: results.reduce((s, r) => s + r.productValue, 0),
  }))

  // Aggregate by zone
  const byZone = new Map<string, { zone: StorageZone; results: KmResult[] }>()
  for (const pw of palletsWithMovements) {
    const existing = byZone.get(pw.zone.id) ?? { zone: pw.zone, results: [] }
    const result = batchResult.results.get(pw.pallet.id)
    if (result) existing.results.push(result)
    byZone.set(pw.zone.id, existing)
  }

  const zoneData = Array.from(byZone.values()).map(({ zone, results }) => ({
    zoneName: zone.name,
    storageType: zone.storage_type,
    avgKm: calculateWeightedAverageKm(results),
    count: results.length,
  }))

  // Aggregate by supplier
  const bySupplier = new Map<string, KmResult[]>()
  for (const pw of palletsWithMovements) {
    const supplier = pw.reference.supplier ?? 'Sans fournisseur'
    const arr = bySupplier.get(supplier) ?? []
    const result = batchResult.results.get(pw.pallet.id)
    if (result) arr.push(result)
    bySupplier.set(supplier, arr)
  }

  const supplierData = Array.from(bySupplier.entries()).map(
    ([supplier, results]) => ({
      supplier,
      avgKm: calculateWeightedAverageKm(results),
      count: results.length,
    })
  )

  // Top alerts
  const alertPallets = palletsWithMovements
    .map((pw) => ({
      pallet: pw.pallet,
      reference: pw.reference,
      zone: pw.zone,
      result: batchResult.results.get(pw.pallet.id)!,
    }))
    .filter((x) => x.result)
    .sort((a, b) => b.result.value - a.result.value)
    .slice(0, 10)

  // Average occupancy
  const avgOccupancy =
    palletsWithMovements.length > 0
      ? palletsWithMovements.reduce((sum, pw) => {
          return sum + pw.pallet.current_quantity / pw.pallet.initial_quantity
        }, 0) / palletsWithMovements.length
      : 0

  return {
    pallets,
    zones,
    refs,
    settings,
    batchResult,
    familyData,
    zoneData,
    supplierData,
    alertPallets,
    avgOccupancy,
    palletsWithMovements,
  }
}

// ─── Km Settings ───

export async function updateKmSettings(
  orgSlug: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const parsed = kmSettingsSchema.safeParse(
      Object.fromEntries(formData)
    )
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const { data: existing } = await supabase
      .from('km_settings')
      .select('id')
      .eq('organization_id', orgId)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('km_settings')
        .update(parsed.data)
        .eq('organization_id', orgId)

      if (error) return { error: 'Erreur lors de la mise à jour des paramètres' }
    } else {
      const { error } = await supabase.from('km_settings').insert({
        ...parsed.data,
        organization_id: orgId,
      })

      if (error) return { error: 'Erreur lors de la création des paramètres' }
    }

    revalidatePath(`/${orgSlug}/achats/stocks`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}

// ─── Demo Data ───

export async function seedDemoData(
  orgSlug: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, orgId, userId } = await getOrgId()
    if (!orgId) return { error: 'Non authentifié' }

    const { data: existingPallets } = await supabase
      .from('pallets')
      .select('id')
      .limit(1)

    if (existingPallets && existingPallets.length > 0) {
      return { error: 'Des données existent déjà' }
    }

    // Zones
    const { data: zones, error: zoneError } = await supabase
      .from('storage_zones')
      .insert([
        {
          organization_id: orgId,
          name: 'Chambre froide -18°C',
          storage_type: 'frozen',
          temperature_min: -20,
          temperature_max: -16,
          thermal_factor: 250,
          daily_cost_cents: 1500,
          capacity_pallets: 50,
          created_by: userId,
        },
        {
          organization_id: orgId,
          name: 'Chambre fraîche +2°C',
          storage_type: 'fresh',
          temperature_min: 0,
          temperature_max: 4,
          thermal_factor: 150,
          daily_cost_cents: 800,
          capacity_pallets: 30,
          created_by: userId,
        },
        {
          organization_id: orgId,
          name: 'Ambiant',
          storage_type: 'ambient',
          temperature_min: 15,
          temperature_max: 25,
          thermal_factor: 100,
          daily_cost_cents: 300,
          capacity_pallets: 80,
          created_by: userId,
        },
      ])
      .select('id, storage_type')

    if (zoneError || !zones) return { error: 'Erreur lors de la création des zones' }

    const frozenZone = zones.find((z) => z.storage_type === 'frozen')!
    const freshZone = zones.find((z) => z.storage_type === 'fresh')!

    // References
    const { data: refs, error: refError } = await supabase
      .from('product_references')
      .insert([
        {
          organization_id: orgId,
          code: 'CREV-300-500',
          name: 'Crevettes 300/500',
          family: 'Surgelés poisson',
          supplier: 'Océan Pacifique SA',
          unit_price_cents: 1000,
          unit: 'kg',
          default_storage_type: 'frozen',
          created_by: userId,
        },
        {
          organization_id: orgId,
          code: 'POIV-VERT',
          name: 'Poivron vert',
          family: 'Légumes frais',
          supplier: 'Primeur du Sud',
          unit_price_cents: 170,
          unit: 'kg',
          default_storage_type: 'fresh',
          created_by: userId,
        },
        {
          organization_id: orgId,
          code: 'SAUM-DES',
          name: 'Dés de saumon',
          family: 'Surgelés poisson',
          supplier: 'Nordic Fish Co.',
          unit_price_cents: 1450,
          unit: 'kg',
          default_storage_type: 'frozen',
          created_by: userId,
        },
      ])
      .select('id, code')

    if (refError || !refs) return { error: 'Erreur lors de la création des références' }

    const crevRef = refs.find((r) => r.code === 'CREV-300-500')!
    const poivRef = refs.find((r) => r.code === 'POIV-VERT')!
    const saumRef = refs.find((r) => r.code === 'SAUM-DES')!

    const today = new Date()

    // Palette crevettes: 500kg, entered 350 days ago, 10kg/week pickings
    const crevEntryDate = new Date(today)
    crevEntryDate.setDate(crevEntryDate.getDate() - 350)

    // After 350 days of 10kg/week = 50 weeks = ~350/7 = 50 pickings of 10kg = 500kg
    // current_quantity should be ~0kg but let's make it realistic: 350 days, 10kg/7days
    const weeksElapsed = Math.floor(350 / 7)
    const crevTotalPicked = weeksElapsed * 10000 // in grams
    const crevRemaining = Math.max(0, 500000 - crevTotalPicked)

    const { data: crevPallet } = await supabase
      .from('pallets')
      .insert({
        organization_id: orgId,
        product_reference_id: crevRef.id,
        storage_zone_id: frozenZone.id,
        lot_number: 'LOT-CREV-2025-001',
        entry_date: crevEntryDate.toISOString().split('T')[0],
        initial_quantity: 500000,
        current_quantity: crevRemaining,
        unit_price_cents: 1000,
        status: crevRemaining <= 0 ? 'empty' : 'in_stock',
        emptied_date: crevRemaining <= 0 ? today.toISOString().split('T')[0] : null,
        created_by: userId,
      })
      .select('id')
      .single()

    if (crevPallet) {
      const crevMovements = []
      for (let w = 0; w < weeksElapsed; w++) {
        const mvDate = new Date(crevEntryDate)
        mvDate.setDate(mvDate.getDate() + w * 7)
        crevMovements.push({
          organization_id: orgId,
          pallet_id: crevPallet.id,
          movement_date: mvDate.toISOString().split('T')[0],
          quantity: 10000,
          movement_type: 'picking',
          performed_by: userId,
        })
      }
      await supabase.from('pallet_movements').insert(crevMovements)
    }

    // Palette poivron: 600kg, entered 7 days ago, single picking of all 600kg
    const poivEntryDate = new Date(today)
    poivEntryDate.setDate(poivEntryDate.getDate() - 7)
    const poivPickDate = new Date(today)
    poivPickDate.setDate(poivPickDate.getDate() - 1)

    const { data: poivPallet } = await supabase
      .from('pallets')
      .insert({
        organization_id: orgId,
        product_reference_id: poivRef.id,
        storage_zone_id: freshZone.id,
        lot_number: 'LOT-POIV-2026-042',
        entry_date: poivEntryDate.toISOString().split('T')[0],
        initial_quantity: 600000,
        current_quantity: 0,
        unit_price_cents: 170,
        status: 'empty',
        emptied_date: poivPickDate.toISOString().split('T')[0],
        created_by: userId,
      })
      .select('id')
      .single()

    if (poivPallet) {
      await supabase.from('pallet_movements').insert({
        organization_id: orgId,
        pallet_id: poivPallet.id,
        movement_date: poivPickDate.toISOString().split('T')[0],
        quantity: 600000,
        movement_type: 'picking',
        performed_by: userId,
      })
    }

    // Palette saumon: 500kg, entered 5 days ago, rapid large pickings
    const saumEntryDate = new Date(today)
    saumEntryDate.setDate(saumEntryDate.getDate() - 5)

    const { data: saumPallet } = await supabase
      .from('pallets')
      .insert({
        organization_id: orgId,
        product_reference_id: saumRef.id,
        storage_zone_id: frozenZone.id,
        lot_number: 'LOT-SAUM-2026-015',
        entry_date: saumEntryDate.toISOString().split('T')[0],
        initial_quantity: 500000,
        current_quantity: 50000,
        unit_price_cents: 1450,
        status: 'in_stock',
        created_by: userId,
      })
      .select('id')
      .single()

    if (saumPallet) {
      const saumDay1 = new Date(saumEntryDate)
      saumDay1.setDate(saumDay1.getDate() + 1)
      const saumDay2 = new Date(saumEntryDate)
      saumDay2.setDate(saumDay2.getDate() + 2)
      const saumDay3 = new Date(saumEntryDate)
      saumDay3.setDate(saumDay3.getDate() + 3)

      await supabase.from('pallet_movements').insert([
        {
          organization_id: orgId,
          pallet_id: saumPallet.id,
          movement_date: saumDay1.toISOString().split('T')[0],
          quantity: 200000,
          movement_type: 'picking',
          performed_by: userId,
        },
        {
          organization_id: orgId,
          pallet_id: saumPallet.id,
          movement_date: saumDay2.toISOString().split('T')[0],
          quantity: 150000,
          movement_type: 'picking',
          performed_by: userId,
        },
        {
          organization_id: orgId,
          pallet_id: saumPallet.id,
          movement_date: saumDay3.toISOString().split('T')[0],
          quantity: 100000,
          movement_type: 'picking',
          performed_by: userId,
        },
      ])
    }

    // Km settings
    await supabase.from('km_settings').insert({
      organization_id: orgId,
      capital_cost_rate: 500,
      alert_threshold_excellent: 500,
      alert_threshold_good: 1500,
      alert_threshold_warning: 3000,
      alert_threshold_critical: 10000,
    })

    // Recalculate Km for all pallets
    await recalculateAllKm(orgSlug)

    revalidatePath(`/${orgSlug}/achats/stocks`)
    return { success: true }
  } catch {
    return { error: 'Une erreur inattendue est survenue' }
  }
}
