import type { TrsLevel, TrsThreshold } from '@/types/database'
import { DEFAULT_THRESHOLDS } from './trs-constants'

export interface TrsInput {
  openingSeconds: number
  plannedStopSeconds: number
  unplannedStopSeconds: number
  qtyProduced: number
  qtyConforming: number
  cycleTimeMs: number
}

export interface TrsResult {
  trs: number
  availability: number
  performance: number
  quality: number
  trsLevel: TrsLevel
  requiredSeconds: number
  operatingSeconds: number
  lostSeconds: number
  mtbf: number | null
  mttr: number | null
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}

export function calculateTrs(
  input: TrsInput,
  thresholds?: TrsThreshold | null,
  failureCount?: number,
  totalRepairSeconds?: number,
): TrsResult {
  const requiredSeconds = input.openingSeconds - input.plannedStopSeconds
  const operatingSeconds = requiredSeconds - input.unplannedStopSeconds

  const availability = requiredSeconds > 0
    ? round4(Math.min(operatingSeconds / requiredSeconds, 1))
    : 0

  const theoreticalProduction = operatingSeconds > 0
    ? operatingSeconds / (input.cycleTimeMs / 1000)
    : 0
  const performance = theoreticalProduction > 0
    ? round4(Math.min(input.qtyProduced / theoreticalProduction, 1))
    : 0

  const quality = input.qtyProduced > 0
    ? round4(Math.min(input.qtyConforming / input.qtyProduced, 1))
    : 0

  const trs = round4(availability * performance * quality)

  const trsLevel = getTrsLevel(trs, thresholds)

  const mtbf = failureCount && failureCount > 0
    ? Math.round(operatingSeconds / failureCount)
    : null

  const mttr = failureCount && failureCount > 0 && totalRepairSeconds
    ? Math.round(totalRepairSeconds / failureCount)
    : null

  return {
    trs,
    availability,
    performance,
    quality,
    trsLevel,
    requiredSeconds,
    operatingSeconds,
    lostSeconds: requiredSeconds - operatingSeconds,
    mtbf,
    mttr,
  }
}

export function getTrsLevel(trs: number, thresholds?: TrsThreshold | null): TrsLevel {
  const t = thresholds ?? DEFAULT_THRESHOLDS
  const bps = Math.round(trs * 10000)
  if (bps >= t.excellent_min) return 'excellent'
  if (bps >= t.good_min) return 'good'
  if (bps >= t.warning_min) return 'warning'
  return 'critical'
}

export function trsLevelBadgeClasses(level: TrsLevel): string {
  switch (level) {
    case 'excellent': return 'bg-ap-green-100 text-ap-green-800'
    case 'good': return 'bg-ap-green-300 text-ap-green-900'
    case 'warning': return 'bg-amber-50 text-amber-800'
    case 'critical': return 'bg-red-50 text-red-800'
  }
}

export function trsLevelLabel(level: TrsLevel): string {
  switch (level) {
    case 'excellent': return 'Excellent'
    case 'good': return 'Bon'
    case 'warning': return 'Alerte'
    case 'critical': return 'Critique'
  }
}

export function formatPercent(value: number): string {
  return (value * 100).toFixed(1) + ' %'
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return s > 0 ? `${m}min ${s}s` : `${m}min`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h}h ${rm}min` : `${h}h`
}

export function calculateLossCents(
  trs: number,
  requiredSeconds: number,
  hourlyCostCents: number,
): number {
  const requiredHours = requiredSeconds / 3600
  return Math.round((1 - trs) * requiredHours * hourlyCostCents)
}
