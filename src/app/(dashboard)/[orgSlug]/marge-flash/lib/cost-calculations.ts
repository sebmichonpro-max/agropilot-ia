import type { MarginLevel } from '@/types/database'
import { convertToBaseUnit, pricePerBaseUnit } from './unit-conversions'

export interface RecipeLineInput {
  quantity: number
  unit: string
  ingredient_price_cents: number
  ingredient_unit: string
}

export interface PackagingLineInput {
  quantity_per_product: number
  unit_price_cents: number
}

export interface LaborInput {
  headcount: number
  hourly_rate_cents: number
}

export interface CostResult {
  mpCostCents: number
  packagingCostCents: number
  laborCostCents: number
  totalCostCents: number
  marginCents: number | null
  marginRateBps: number | null
  marginLevel: MarginLevel | null
}

export interface ThresholdConfig {
  goodMinBps: number
  warningMinBps: number
}

const DEFAULT_THRESHOLDS: ThresholdConfig = { goodMinBps: 2000, warningMinBps: 1000 }

export function computeRecipeLineCost(line: RecipeLineInput): number {
  const qtyBase = convertToBaseUnit(line.quantity, line.unit)
  const ppu = pricePerBaseUnit(line.ingredient_price_cents, line.ingredient_unit)
  return Math.round(qtyBase * ppu)
}

export function computeMpCost(lines: RecipeLineInput[]): number {
  return lines.reduce((sum, l) => sum + computeRecipeLineCost(l), 0)
}

export function computePackagingCost(lines: PackagingLineInput[]): number {
  return lines.reduce((sum, l) => sum + Math.round(l.quantity_per_product * l.unit_price_cents), 0)
}

export function computeLaborCostPerUnit(
  poles: LaborInput[],
  theoreticalOutputPerHour: number | null,
): number {
  if (!theoreticalOutputPerHour || theoreticalOutputPerHour <= 0) return 0
  const totalHourlyCents = poles.reduce((sum, p) => sum + p.headcount * p.hourly_rate_cents, 0)
  return Math.round(totalHourlyCents / theoreticalOutputPerHour)
}

export function computeMarginLevel(rateBps: number, thresholds: ThresholdConfig = DEFAULT_THRESHOLDS): MarginLevel {
  if (rateBps < 0) return 'loss'
  if (rateBps < thresholds.warningMinBps) return 'critical'
  if (rateBps < thresholds.goodMinBps) return 'warning'
  return 'good'
}

export function computeProductCost(
  recipeLines: RecipeLineInput[],
  packagingLines: PackagingLineInput[],
  laborPoles: LaborInput[],
  theoreticalOutputPerHour: number | null,
  sellingPriceCents: number | null,
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS,
): CostResult {
  const mpCostCents = computeMpCost(recipeLines)
  const packagingCostCents = computePackagingCost(packagingLines)
  const laborCostCents = computeLaborCostPerUnit(laborPoles, theoreticalOutputPerHour)
  const totalCostCents = mpCostCents + packagingCostCents + laborCostCents

  if (sellingPriceCents == null || sellingPriceCents <= 0) {
    return { mpCostCents, packagingCostCents, laborCostCents, totalCostCents, marginCents: null, marginRateBps: null, marginLevel: null }
  }

  const marginCents = sellingPriceCents - totalCostCents
  const marginRateBps = Math.round((marginCents / sellingPriceCents) * 10000)
  const marginLevel = computeMarginLevel(marginRateBps, thresholds)

  return { mpCostCents, packagingCostCents, laborCostCents, totalCostCents, marginCents, marginRateBps, marginLevel }
}

export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €'
}

export function formatBps(bps: number): string {
  return (bps / 100).toFixed(1).replace('.', ',') + ' %'
}

export function marginLevelLabel(level: MarginLevel): string {
  switch (level) {
    case 'good': return 'Bon'
    case 'warning': return 'Alerte'
    case 'critical': return 'Critique'
    case 'loss': return 'Perte'
  }
}

export function marginLevelClasses(level: MarginLevel): string {
  switch (level) {
    case 'good': return 'bg-ap-green-100 text-ap-green-800'
    case 'warning': return 'bg-amber-50 text-amber-800'
    case 'critical': return 'bg-red-50 text-red-800'
    case 'loss': return 'bg-red-100 text-red-900'
  }
}
