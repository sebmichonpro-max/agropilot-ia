import { createServerClient } from '@/lib/supabase/server'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  calculateKm,
  calculateBatchKm,
  calculateWeightedAverageKm,
  getKmLevel,
} from '@/modules/km/calculator'
import { KM_LEVELS } from '@/modules/km/constants'
import type {
  Pallet,
  PalletMovement,
  StorageZone,
  ProductReference,
  KmSettings,
  PalletWithMovements,
  KmResult,
} from '@/modules/km/types'

function fmtKm(v: number): string {
  return v.toFixed(2)
}

function fmtEur(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €'
}

function fmtKg(grams: number): string {
  return (grams / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' kg'
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Non autorisé', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id)
    return new Response('Profil introuvable', { status: 403 })

  const { data: org } = await supabase
    .from('organizations')
    .select('name, slug')
    .eq('id', profile.organization_id)
    .single()

  if (!org || org.slug !== orgSlug)
    return new Response('Organisation introuvable', { status: 404 })

  // Fetch data
  const [palletsResult, zonesResult, refsResult, settingsResult] =
    await Promise.all([
      supabase
        .from('pallets')
        .select('*')
        .eq('status', 'in_stock')
        .is('deleted_at', null)
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
        .eq('organization_id', profile.organization_id)
        .single<KmSettings>(),
    ])

  const pallets = palletsResult.data ?? []
  const zones = zonesResult.data ?? []
  const refs = refsResult.data ?? []
  const settings = settingsResult.data
  const capitalCostRate = settings?.capital_cost_rate ?? 500

  const zonesMap = new Map(zones.map((z) => [z.id, z]))
  const refsMap = new Map(refs.map((r) => [r.id, r]))

  const palletIds = pallets.map((p) => p.id)
  const { data: allMovements } =
    palletIds.length > 0
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

  const palletsWithMovements: PalletWithMovements[] = pallets
    .filter(
      (p) =>
        zonesMap.has(p.storage_zone_id) &&
        refsMap.has(p.product_reference_id)
    )
    .map((p) => ({
      pallet: p,
      movements: movementsByPallet.get(p.id) ?? [],
      zone: zonesMap.get(p.storage_zone_id)!,
      reference: refsMap.get(p.product_reference_id)!,
    }))

  const batchResult = calculateBatchKm(palletsWithMovements, capitalCostRate)

  // Generate PDF
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const today = new Date().toLocaleDateString('fr-FR')

  // ─── PAGE 1: Cover ───
  doc.setFontSize(28)
  doc.setTextColor(6, 95, 70) // emerald-900
  doc.text('SMAPIA', pageWidth / 2, 60, { align: 'center' })

  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.text('Rapport Coefficient Michon (Km)', pageWidth / 2, 80, {
    align: 'center',
  })

  doc.setFontSize(14)
  doc.setTextColor(100, 100, 100)
  doc.text(org.name, pageWidth / 2, 95, { align: 'center' })

  doc.setFontSize(11)
  doc.text(`Généré le ${today}`, pageWidth / 2, 110, { align: 'center' })
  doc.text('Palettes en stock', pageWidth / 2, 120, { align: 'center' })

  // ─── PAGE 2: Summary ───
  doc.addPage()
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Synthèse globale', 14, 20)

  doc.setFontSize(11)
  const summaryY = 32
  doc.text(
    `Km moyen pondéré : ${fmtKm(batchResult.weightedAverage)}`,
    14,
    summaryY
  )
  doc.text(
    `Nombre de palettes en stock : ${palletsWithMovements.length}`,
    14,
    summaryY + 7
  )
  doc.text(
    `Valeur totale en stock : ${fmtEur(batchResult.totalStockValue)}`,
    14,
    summaryY + 14
  )
  doc.text(
    `Coût logistique cumulé : ${fmtEur(batchResult.totalLogisticCost)}`,
    14,
    summaryY + 21
  )
  doc.text(
    `Coût financier cumulé : ${fmtEur(batchResult.totalFinancialCost)}`,
    14,
    summaryY + 28
  )

  // Distribution table
  const levels = [
    'excellent',
    'good',
    'warning',
    'critical',
    'destruction',
  ] as const
  const distRows = levels.map((lvl) => {
    const count = batchResult.countByLevel[lvl]
    const pct =
      palletsWithMovements.length > 0
        ? ((count / palletsWithMovements.length) * 100).toFixed(1)
        : '0'
    return [KM_LEVELS[lvl].label, String(count), `${pct} %`]
  })

  autoTable(doc, {
    startY: summaryY + 38,
    head: [['Niveau', 'Palettes', '% du total']],
    body: distRows,
    theme: 'grid',
    headStyles: { fillColor: [6, 95, 70] },
    styles: { fontSize: 9 },
  })

  // Top 5 critical pallets
  const sortedByKm = palletsWithMovements
    .map((pw) => ({
      pw,
      result: batchResult.results.get(pw.pallet.id)!,
    }))
    .filter((x) => x.result)
    .sort((a, b) => b.result.value - a.result.value)
    .slice(0, 5)

  if (sortedByKm.length > 0) {
    const currentY = ((doc as unknown as Record<string, { finalY?: number }>).lastAutoTable?.finalY) ?? 120

    doc.setFontSize(13)
    doc.text('Top 5 palettes les plus critiques', 14, currentY + 12)

    const topRows = sortedByKm.map(({ pw, result }) => [
      pw.reference.name,
      pw.zone.name,
      String(result.daysInStock),
      fmtKm(result.value),
      KM_LEVELS[result.level].label,
    ])

    autoTable(doc, {
      startY: currentY + 18,
      head: [['Référence', 'Zone', 'Jours', 'Km', 'Verdict']],
      body: topRows,
      theme: 'grid',
      headStyles: { fillColor: [6, 95, 70] },
      styles: { fontSize: 9 },
    })
  }

  // ─── PAGE 3+: By family ───
  const byFamily = new Map<
    string,
    { results: { pw: PalletWithMovements; result: KmResult }[] }
  >()
  for (const pw of palletsWithMovements) {
    const family = pw.reference.family ?? 'Sans famille'
    const existing = byFamily.get(family) ?? { results: [] }
    const result = batchResult.results.get(pw.pallet.id)
    if (result) existing.results.push({ pw, result })
    byFamily.set(family, existing)
  }

  if (byFamily.size > 0) {
    doc.addPage()
    doc.setFontSize(16)
    doc.text('Détail par famille produit', 14, 20)

    let yPos = 30

    for (const [family, { results }] of byFamily) {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      const familyAvg = calculateWeightedAverageKm(results.map((r) => r.result))

      doc.setFontSize(12)
      doc.text(
        `${family} — Km moyen : ${fmtKm(familyAvg)} — ${results.length} palette(s)`,
        14,
        yPos
      )

      const familyRows = results
        .sort((a, b) => b.result.value - a.result.value)
        .map(({ pw, result }) => [
          pw.reference.code,
          fmtKg(pw.pallet.current_quantity),
          String(result.daysInStock),
          fmtKm(result.value),
          KM_LEVELS[result.level].label,
        ])

      autoTable(doc, {
        startY: yPos + 4,
        head: [['Code', 'Quantité', 'Jours', 'Km', 'Niveau']],
        body: familyRows,
        theme: 'grid',
        headStyles: { fillColor: [6, 95, 70] },
        styles: { fontSize: 8 },
        margin: { left: 14 },
      })

      yPos =
        ((doc as unknown as Record<string, Record<string, number>>).lastAutoTable?.finalY ?? yPos + 30) + 12
    }
  }

  // ─── LAST PAGE: Recommendations ───
  doc.addPage()
  doc.setFontSize(16)
  doc.text('Recommandations', 14, 20)

  const criticalPallets = palletsWithMovements
    .map((pw) => ({
      pw,
      result: batchResult.results.get(pw.pallet.id)!,
    }))
    .filter(
      (x) =>
        x.result &&
        (x.result.level === 'critical' || x.result.level === 'destruction')
    )
    .sort((a, b) => b.result.value - a.result.value)

  if (criticalPallets.length === 0) {
    doc.setFontSize(11)
    doc.text(
      'Aucune palette en zone critique ou destruction. Bonne gestion !',
      14,
      32
    )
  } else {
    const recoRows = criticalPallets.map(({ pw, result }) => [
      pw.reference.name,
      fmtKm(result.value),
      KM_LEVELS[result.level].label,
      KM_LEVELS[result.level].action,
    ])

    autoTable(doc, {
      startY: 28,
      head: [['Référence', 'Km', 'Niveau', 'Action recommandée']],
      body: recoRows,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] },
      styles: { fontSize: 9 },
    })
  }

  // Footer on last page
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(
    'Rapport généré par SMAPIA — Coefficient Michon © 2026 — Ne constitue pas un conseil financier',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  const pdfBuffer = doc.output('arraybuffer')

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="rapport-km-${orgSlug}-${new Date().toISOString().split('T')[0]}.pdf"`,
    },
  })
}
