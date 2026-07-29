import type { StorageType, KmLevel, KmLevelInfo, KmThresholds } from './types'

export const THERMAL_FACTORS: Record<StorageType, number> = {
  ambient: 100,
  fresh: 150,
  frozen: 250,
  deep_frozen: 300,
}

export const KM_THRESHOLDS: KmThresholds = {
  excellent: 500,
  good: 1500,
  warning: 3000,
  critical: 10000,
}

export const KM_LEVELS: Record<KmLevel, KmLevelInfo> = {
  excellent: {
    level: 'excellent',
    color: 'ap-green-100',
    label: 'Excellent',
    description: 'Rotation optimale',
    action: 'Aucune action nécessaire',
  },
  good: {
    level: 'good',
    color: 'ap-green-300',
    label: 'Bon',
    description: 'Stockage maîtrisé',
    action: 'Surveillance standard',
  },
  warning: {
    level: 'warning',
    color: 'amber-50',
    label: 'Alerte',
    description: 'Érosion de valeur',
    action: 'Revoir les quantités commandées',
  },
  critical: {
    level: 'critical',
    color: 'red-50',
    label: 'Critique',
    description: 'Coût significatif',
    action: 'Réduire les lots ou changer de conditionnement',
  },
  destruction: {
    level: 'destruction',
    color: 'red-100',
    label: 'Destruction',
    description: 'Stockage plus cher que le produit',
    action: 'Arrêt immédiat du stockage sous cette forme',
  },
}

export const STORAGE_TYPE_LABELS: Record<StorageType, string> = {
  ambient: 'Ambiant (>15°C)',
  fresh: 'Frais (+2/+4°C)',
  frozen: 'Négatif (-18°C)',
  deep_frozen: 'Grand froid (-25°C)',
}

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  picking: 'Prélèvement',
  transfer: 'Transfert',
  loss: 'Perte',
  return: 'Retour',
  adjustment: 'Ajustement',
}

export const PALLET_STATUS_LABELS: Record<string, string> = {
  in_stock: 'En stock',
  empty: 'Vidée',
  expired: 'Périmée',
  destroyed: 'Détruite',
}
