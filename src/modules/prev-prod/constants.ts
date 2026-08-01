export const FRENCH_HOLIDAYS_LABELS = [
  '1er janvier',
  'Lundi de Pâques',
  '1er mai',
  '8 mai',
  'Ascension',
  'Lundi de Pentecôte',
  '14 juillet',
  '15 août',
  '1er novembre',
  '11 novembre',
  '25 décembre',
] as const

export const DEFAULT_LOSS_PCT = 3
export const DEFAULT_MIN_BATCH_GRAMS = 30000
export const WEIGHTED_AVERAGE_WEIGHTS = [0.4, 0.3, 0.2, 0.1] as const

export const STOCK_TYPE_LABELS: Record<string, string> = {
  stock_permanent: 'Stock permanent',
  sur_commande: 'Sur commande',
  mixte: 'Mixte',
}

export const PRIORITY_LABELS: Record<string, string> = {
  matin: 'Matin',
  journee: 'Journée',
  avance: 'Avance',
}

export const FORECAST_METHOD_LABELS: Record<string, string> = {
  dernier_jour: 'Dernier jour',
  moyenne_4sem: 'Moyenne 4 sem.',
  moyenne_ponderee: 'Moy. pondérée',
}

export const PLAN_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  validated: 'Validé',
  in_progress: 'En cours',
  done: 'Terminé',
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  confirme: 'Confirmé',
}
