export type StorageType = 'ambient' | 'fresh' | 'frozen' | 'deep_frozen'
export type PalletStatus = 'in_stock' | 'empty' | 'expired' | 'destroyed'
export type MovementType = 'picking' | 'transfer' | 'loss' | 'return' | 'adjustment'
export type KmLevel = 'excellent' | 'good' | 'warning' | 'critical' | 'destruction'

export interface StorageZone {
  id: string
  organization_id: string
  name: string
  storage_type: StorageType
  temperature_min: number | null
  temperature_max: number | null
  thermal_factor: number
  daily_cost_cents: number
  capacity_pallets: number | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProductReference {
  id: string
  organization_id: string
  code: string
  name: string
  family: string | null
  supplier: string | null
  unit_price_cents: number
  unit: string
  default_storage_type: StorageType | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Pallet {
  id: string
  organization_id: string
  product_reference_id: string
  storage_zone_id: string
  lot_number: string | null
  entry_date: string
  initial_quantity: number
  current_quantity: number
  unit_price_cents: number
  status: PalletStatus
  emptied_date: string | null
  km_value: number | null
  km_last_calculated: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PalletMovement {
  id: string
  organization_id: string
  pallet_id: string
  movement_date: string
  quantity: number
  movement_type: MovementType
  performed_by: string | null
  notes: string | null
  created_at: string
}

export interface KmSettings {
  id: string
  organization_id: string
  capital_cost_rate: number
  alert_threshold_excellent: number
  alert_threshold_good: number
  alert_threshold_warning: number
  alert_threshold_critical: number
  updated_at: string
}

export interface KmResult {
  value: number
  level: KmLevel
  logisticCost: number
  financialCost: number
  totalCost: number
  productValue: number
  daysInStock: number
  occupancyDays: number
}

export interface KmThresholds {
  excellent: number
  good: number
  warning: number
  critical: number
}

export interface PalletWithMovements {
  pallet: Pallet
  movements: PalletMovement[]
  zone: StorageZone
  reference: ProductReference
}

export interface KmBatchResult {
  results: Map<string, KmResult>
  weightedAverage: number
  totalStockValue: number
  totalLogisticCost: number
  totalFinancialCost: number
  countByLevel: Record<KmLevel, number>
}

export interface KmLevelInfo {
  level: KmLevel
  label: string
  color: string
  description: string
  action: string
}

export interface KmDailyPoint {
  date: string
  quantity: number
  km: number
  occupancyRate: number
}
