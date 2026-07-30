import type { StopCategory } from '@/types/database'

export interface DefaultStopCause {
  name: string
  category: StopCategory
  icon: string
  display_order: number
  is_planned: boolean
}

export const DEFAULT_STOP_CAUSES: DefaultStopCause[] = [
  // Disponibilité
  { name: 'Panne mécanique', category: 'availability', icon: 'Wrench', display_order: 1, is_planned: false },
  { name: 'Panne électrique', category: 'availability', icon: 'Zap', display_order: 2, is_planned: false },
  { name: 'Changement de série / recette', category: 'availability', icon: 'RefreshCw', display_order: 3, is_planned: false },
  { name: 'Attente matière première', category: 'availability', icon: 'Package', display_order: 4, is_planned: false },
  { name: 'Attente maintenance', category: 'availability', icon: 'Clock', display_order: 5, is_planned: false },
  // Performance
  { name: 'Bourrage doseur', category: 'performance', icon: 'AlertTriangle', display_order: 6, is_planned: false },
  { name: 'Micro-arrêt', category: 'performance', icon: 'Pause', display_order: 7, is_planned: false },
  { name: 'Ralentissement cadence', category: 'performance', icon: 'TrendingDown', display_order: 8, is_planned: false },
  // Qualité
  { name: 'Produit non conforme', category: 'quality', icon: 'XCircle', display_order: 9, is_planned: false },
  { name: 'Contrôle qualité', category: 'quality', icon: 'ClipboardCheck', display_order: 10, is_planned: false },
  { name: 'Surgrammage', category: 'quality', icon: 'Scale', display_order: 11, is_planned: false },
  // Arrêts planifiés
  { name: 'Pause réglementaire', category: 'availability', icon: 'Coffee', display_order: 12, is_planned: true },
  { name: 'Nettoyage inter-lot', category: 'availability', icon: 'Droplets', display_order: 13, is_planned: true },
  { name: 'Nettoyage inter-allergène', category: 'availability', icon: 'ShieldAlert', display_order: 14, is_planned: true },
  { name: 'Maintenance préventive', category: 'availability', icon: 'Settings', display_order: 15, is_planned: true },
]

export const DEFAULT_THRESHOLDS = {
  excellent_min: 8500,
  good_min: 7000,
  warning_min: 5500,
} as const

export const CATEGORY_LABELS: Record<StopCategory, string> = {
  availability: 'Disponibilité',
  performance: 'Performance',
  quality: 'Qualité',
}

export const CATEGORY_COLORS: Record<StopCategory, { bg: string; text: string }> = {
  availability: { bg: 'bg-blue-50', text: 'text-blue-800' },
  performance: { bg: 'bg-amber-50', text: 'text-amber-800' },
  quality: { bg: 'bg-red-50', text: 'text-red-800' },
}
