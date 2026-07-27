import type { KmLevel } from './types'

export function formatKm(value: number): string {
  return value.toFixed(2)
}

export function formatCurrency(cents: number): string {
  const euros = cents / 100
  return euros.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  })
}

export function formatWeight(grams: number): string {
  const kg = grams / 1000
  if (kg >= 1000) {
    return `${(kg / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} t`
  }
  return `${kg.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kg`
}

export function formatDays(days: number): string {
  if (days === 0) return "aujourd'hui"
  if (days === 1) return '1 jour'
  return `${days} jours`
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
}

export function getKmBadgeVariant(
  level: KmLevel
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (level) {
    case 'excellent':
    case 'good':
      return 'default'
    case 'warning':
      return 'secondary'
    case 'critical':
    case 'destruction':
      return 'destructive'
  }
}

export function getKmColor(level: KmLevel): string {
  switch (level) {
    case 'excellent':
      return '#10b981'
    case 'good':
      return '#3b82f6'
    case 'warning':
      return '#f59e0b'
    case 'critical':
      return '#ef4444'
    case 'destruction':
      return '#7f1d1d'
  }
}

export function getKmBgClass(level: KmLevel): string {
  switch (level) {
    case 'excellent':
      return 'bg-emerald-500'
    case 'good':
      return 'bg-blue-500'
    case 'warning':
      return 'bg-amber-500'
    case 'critical':
      return 'bg-red-500'
    case 'destruction':
      return 'bg-red-900'
  }
}

export function getKmTextClass(level: KmLevel): string {
  switch (level) {
    case 'excellent':
      return 'text-emerald-700'
    case 'good':
      return 'text-blue-700'
    case 'warning':
      return 'text-amber-700'
    case 'critical':
      return 'text-red-700'
    case 'destruction':
      return 'text-red-950'
  }
}

export function getKmBorderClass(level: KmLevel): string {
  switch (level) {
    case 'excellent':
      return 'border-emerald-500'
    case 'good':
      return 'border-blue-500'
    case 'warning':
      return 'border-amber-500'
    case 'critical':
      return 'border-red-500'
    case 'destruction':
      return 'border-red-900'
  }
}
