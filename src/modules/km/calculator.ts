import type {
  KmResult,
  KmLevel,
  KmThresholds,
  KmBatchResult,
  PalletWithMovements,
  KmDailyPoint,
} from './types'
import { KM_THRESHOLDS } from './constants'

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86400000
  return Math.floor((b.getTime() - a.getTime()) / msPerDay)
}

/**
 * Calcule le Coefficient Michon pour une palette.
 *
 * Toutes les valeurs monétaires en centimes, quantités en grammes.
 *
 * Exemples attendus :
 * - Crevettes 300/500 : 500kg, -18°C, 350j, 10kg/semaine → Km ≈ 1.34
 * - Poivron vert : 600kg, +2°C, 7j, vidé d'un coup → Km ≈ 0.05
 * - Dés de saumon : 500kg, -18°C, 5j, vidé rapidement → Km ≈ 0.01
 */
export function calculateKm(params: {
  initialQuantityGrams: number
  unitPriceCents: number
  dailyCostCents: number
  thermalFactor: number
  capitalCostRate: number
  entryDate: Date
  movements: { date: Date; quantityGrams: number }[]
  calculationDate?: Date
}): KmResult {
  const {
    initialQuantityGrams,
    unitPriceCents,
    dailyCostCents,
    thermalFactor,
    capitalCostRate,
    entryDate,
    movements,
  } = params
  const calcDate = params.calculationDate ?? new Date()

  const totalDays = daysBetween(entryDate, calcDate)
  if (totalDays <= 0 || initialQuantityGrams <= 0) {
    return {
      value: 0,
      level: 'excellent',
      logisticCost: 0,
      financialCost: 0,
      totalCost: 0,
      productValue: 0,
      daysInStock: 0,
      occupancyDays: 0,
    }
  }

  // Sort movements by date
  const sortedMovements = [...movements].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )

  // Build daily quantity curve Qr(t)
  let sumOccupancyRate = 0
  let sumValueDaysCents = 0
  let currentQty = initialQuantityGrams
  let movementIdx = 0

  for (let day = 0; day < totalDays; day++) {
    const currentDate = new Date(entryDate)
    currentDate.setDate(currentDate.getDate() + day)
    const nextDate = new Date(currentDate)
    nextDate.setDate(nextDate.getDate() + 1)

    // Apply movements that fall on this day
    while (movementIdx < sortedMovements.length) {
      const mv = sortedMovements[movementIdx]
      if (mv.date >= currentDate && mv.date < nextDate) {
        currentQty = Math.max(0, currentQty - mv.quantityGrams)
        movementIdx++
      } else {
        break
      }
    }

    // Occupancy rate for this day
    const occupancyRate = currentQty / initialQuantityGrams
    sumOccupancyRate += occupancyRate

    // Value-day: Qr(t) in kg × unit price in cents = value in cents
    // Qr(t) is in grams, unit_price is cents/kg, so Vr(t) = (Qr/1000) * unitPriceCents
    const valueCents = (currentQty / 1000) * unitPriceCents
    sumValueDaysCents += valueCents
  }

  // Logistic component: (Cs × Ft/100) × Σ(occupancyRate)
  // Cs is in cents/day, Ft is ×100
  const logisticCostCents =
    (dailyCostCents * thermalFactor * sumOccupancyRate) / 100

  // Financial component: Ci_daily × Σ(Vr(t))
  // capitalCostRate is ×100 (e.g. 500 = 5%), so rate = capitalCostRate / 10000
  // daily rate = rate / 365
  const dailyCapitalRate = capitalCostRate / 10000 / 365
  const financialCostCents = dailyCapitalRate * sumValueDaysCents

  // Total product cost Cp = (Qmax/1000) × Pu (in cents)
  const productValueCents = (initialQuantityGrams / 1000) * unitPriceCents

  // Km = (logistic + financial) / Cp
  const km =
    productValueCents > 0
      ? (logisticCostCents + financialCostCents) / productValueCents
      : 0

  return {
    value: km,
    level: getKmLevel(Math.round(km * 10000)),
    logisticCost: Math.round(logisticCostCents),
    financialCost: Math.round(financialCostCents),
    totalCost: Math.round(logisticCostCents + financialCostCents),
    productValue: Math.round(productValueCents),
    daysInStock: totalDays,
    occupancyDays: Math.round(sumOccupancyRate * 100) / 100,
  }
}

/** Determines the Km level from its integer value (× 10000). */
export function getKmLevel(
  kmValueScaled: number,
  thresholds?: KmThresholds
): KmLevel {
  const t = thresholds ?? KM_THRESHOLDS
  if (kmValueScaled < t.excellent) return 'excellent'
  if (kmValueScaled < t.good) return 'good'
  if (kmValueScaled < t.warning) return 'warning'
  if (kmValueScaled < t.critical) return 'critical'
  return 'destruction'
}

/** Calculates Km for a batch of pallets with all associated data. */
export function calculateBatchKm(
  pallets: PalletWithMovements[],
  capitalCostRate: number
): KmBatchResult {
  const results = new Map<string, KmResult>()
  const countByLevel: Record<KmLevel, number> = {
    excellent: 0,
    good: 0,
    warning: 0,
    critical: 0,
    destruction: 0,
  }

  let totalStockValue = 0
  let totalLogisticCost = 0
  let totalFinancialCost = 0

  for (const pw of pallets) {
    const result = calculateKm({
      initialQuantityGrams: pw.pallet.initial_quantity,
      unitPriceCents: pw.pallet.unit_price_cents,
      dailyCostCents: pw.zone.daily_cost_cents,
      thermalFactor: pw.zone.thermal_factor,
      capitalCostRate,
      entryDate: new Date(pw.pallet.entry_date),
      movements: pw.movements.map((m) => ({
        date: new Date(m.movement_date),
        quantityGrams: m.quantity,
      })),
    })

    results.set(pw.pallet.id, result)
    countByLevel[result.level]++
    totalStockValue += result.productValue
    totalLogisticCost += result.logisticCost
    totalFinancialCost += result.financialCost
  }

  const allResults = Array.from(results.values())

  return {
    results,
    weightedAverage: calculateWeightedAverageKm(allResults),
    totalStockValue,
    totalLogisticCost,
    totalFinancialCost,
    countByLevel,
  }
}

/** Weighted average Km: Σ(Km_i × Cp_i) / Σ(Cp_i). */
export function calculateWeightedAverageKm(results: KmResult[]): number {
  if (results.length === 0) return 0

  let sumWeighted = 0
  let sumValues = 0

  for (const r of results) {
    sumWeighted += r.value * r.productValue
    sumValues += r.productValue
  }

  return sumValues > 0 ? sumWeighted / sumValues : 0
}

/** Projects Km assuming constant consumption rate. */
export function projectKm(
  currentResult: KmResult,
  daysAhead: number
): number {
  if (currentResult.daysInStock <= 0) return currentResult.value
  const dailyRate = currentResult.value / currentResult.daysInStock
  return currentResult.value + dailyRate * daysAhead
}

/** Builds day-by-day data for charting Qr(t) and cumulative Km. */
export function buildDailyCurve(params: {
  initialQuantityGrams: number
  unitPriceCents: number
  dailyCostCents: number
  thermalFactor: number
  capitalCostRate: number
  entryDate: Date
  movements: { date: Date; quantityGrams: number }[]
  calculationDate?: Date
}): KmDailyPoint[] {
  const {
    initialQuantityGrams,
    unitPriceCents,
    dailyCostCents,
    thermalFactor,
    capitalCostRate,
    entryDate,
  } = params
  const calcDate = params.calculationDate ?? new Date()
  const totalDays = daysBetween(entryDate, calcDate)

  if (totalDays <= 0 || initialQuantityGrams <= 0) return []

  const sortedMovements = [...params.movements].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )

  const points: KmDailyPoint[] = []
  let currentQty = initialQuantityGrams
  let movementIdx = 0
  let sumOccupancyRate = 0
  let sumValueDaysCents = 0

  const productValueCents = (initialQuantityGrams / 1000) * unitPriceCents

  for (let day = 0; day < totalDays; day++) {
    const currentDate = new Date(entryDate)
    currentDate.setDate(currentDate.getDate() + day)
    const nextDate = new Date(currentDate)
    nextDate.setDate(nextDate.getDate() + 1)

    while (movementIdx < sortedMovements.length) {
      const mv = sortedMovements[movementIdx]
      if (mv.date >= currentDate && mv.date < nextDate) {
        currentQty = Math.max(0, currentQty - mv.quantityGrams)
        movementIdx++
      } else {
        break
      }
    }

    const occupancyRate = currentQty / initialQuantityGrams
    sumOccupancyRate += occupancyRate

    const valueCents = (currentQty / 1000) * unitPriceCents
    sumValueDaysCents += valueCents

    const logisticCostCents =
      (dailyCostCents * thermalFactor * sumOccupancyRate) / 100
    const dailyCapitalRate = capitalCostRate / 10000 / 365
    const financialCostCents = dailyCapitalRate * sumValueDaysCents

    const km =
      productValueCents > 0
        ? (logisticCostCents + financialCostCents) / productValueCents
        : 0

    points.push({
      date: currentDate.toISOString().split('T')[0],
      quantity: currentQty,
      km: Math.round(km * 10000) / 10000,
      occupancyRate: Math.round(occupancyRate * 10000) / 10000,
    })
  }

  return points
}
