export type PlanType = 'free' | 'standard' | 'premium'
export type RoleType = 'owner' | 'admin' | 'manager' | 'member' | 'viewer'

export interface Organization {
  id: string
  name: string
  slug: string
  plan: PlanType
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Profile {
  id: string
  organization_id: string | null
  role: RoleType
  full_name: string | null
  created_at: string
  updated_at: string
}

// ── RH / POINT'AGE ──────────────────────────────

export type ContractType = 'CDI' | 'CDD' | 'Stage' | 'Interim'
export type ClockEventType = 'clock_in' | 'break_start' | 'break_end' | 'clock_out'
export type ClockSource = 'touch' | 'nfc' | 'admin'
export type AbsenceType = 'CP' | 'RTT' | 'Maladie' | 'AT' | 'Absence_injustifiee' | 'Autre'
export type AbsenceStatus = 'pending' | 'approved' | 'rejected'
export type NotificationType = 'absence_upcoming' | 'absence_request' | 'contract_ending' | 'overtime_alert'
export type EmployeeStatus = 'absent' | 'present' | 'on_break' | 'left'

export interface RhAgency {
  id: string
  organization_id: string
  name: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  created_at: string
}

export interface RhPosition {
  id: string
  organization_id: string
  name: string
  sort_order: number
  created_at: string
}

export interface RhEmployee {
  id: string
  organization_id: string
  full_name: string
  contract_type: ContractType
  agency_id: string | null
  position: string | null
  hourly_cost_cents: number
  is_active: boolean
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface RhBadge {
  id: string
  organization_id: string
  badge_uid: string
  label: string | null
  assigned_to: string | null
  assigned_at: string | null
  unassigned_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RhBadgeHistory {
  id: string
  organization_id: string
  badge_id: string
  employee_id: string
  action: 'assigned' | 'unassigned'
  performed_by: string | null
  created_at: string
}

export interface RhClockEvent {
  id: string
  organization_id: string
  employee_id: string
  event_type: ClockEventType
  event_time: string
  source: ClockSource
  badge_id: string | null
  recorded_by: string | null
  is_manual: boolean
  note: string | null
  created_at: string
}

export interface RhAbsence {
  id: string
  organization_id: string
  employee_id: string
  absence_type: AbsenceType
  start_date: string
  end_date: string
  status: AbsenceStatus
  note: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
}

export interface RhNotification {
  id: string
  organization_id: string
  title: string
  body: string | null
  type: NotificationType
  reference_id: string | null
  is_read: boolean
  notify_at: string
  created_at: string
}

export interface RhSettings {
  id: string
  organization_id: string
  admin_pin_hash: string
  daily_hours_threshold: number
  weekly_hours_threshold: number
  absence_notification_hours: number
  created_at: string
  updated_at: string
}

// ── SIMUL'PAIE ──────────────────────────────

export type SimDuration = '35h' | '37h30' | '39h' | 'forfait_jour'
export type SimStatut = 'non_cadre' | 'cadre'
export type SimMode = 'employeur' | 'salarie'

export interface SimSettings {
  id: string
  organization_id: string
  company_name: string | null
  at_mp_rate_bps: number
  mutual_employer_cents: number
  mutual_employee_cents: number
  prevoyance_employer_rate_bps: number
  prevoyance_employee_rate_bps: number
  fnal_rate_bps: number
  formation_rate_bps: number
  transport_rate_bps: number
  headcount: number
  created_at: string
  updated_at: string
}

export interface SimSimulation {
  id: string
  organization_id: string
  label: string
  inputs: SimulationInputs
  results: SimulationResults
  created_by: string | null
  created_at: string
}

export interface SimulationInputs {
  mode: SimMode
  duration: SimDuration
  hourlyRate: number
  salaryAnnual: number
  coefficient: number
  statut: SimStatut
  seniority: number
  treizieme: boolean
  primeExceptionnelle: number
  forfaitJours: number
  extraHS: number
}

export interface CotisationLine {
  label: string
  category: string
  base: number
  rateSal: number
  montantSal: number
  ratePat: number
  montantPat: number
}

export interface SimulationResults {
  brut: number
  baseSalary: number
  hsAmount: number
  hsMonthly: number
  anciennete: number
  treizieme: number
  primeExceptionnelle: number
  cotisationsSalariales: number
  cotisationsPatronales: number
  rgdu: number
  netAvantImpot: number
  coutEmployeur: number
  coutAnnuel: number
  detail: CotisationLine[]
  rtt: number
  mutuellePatronale: number
  mutuelleSalariale: number
  isForfaitJour: boolean
  tauxJournalier: number
}

// ── PROD'PULSE (TRS/OEE) ──────────────────────────────

export type StopCategory = 'availability' | 'performance' | 'quality'
export type TrsLevel = 'excellent' | 'good' | 'warning' | 'critical'

export interface ProductionLine {
  id: string
  organization_id: string
  name: string
  hourly_cost_cents: number
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PpProduct {
  id: string
  organization_id: string
  name: string
  cycle_time_ms: number
  unit_label: string
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface LineProduct {
  id: string
  organization_id: string
  line_id: string
  product_id: string
  cycle_time_override_ms: number | null
}

export interface StopCause {
  id: string
  organization_id: string
  name: string
  category: StopCategory
  icon: string
  display_order: number
  is_planned: boolean
  is_active: boolean
  created_at: string
  deleted_at: string | null
}

export interface ProductionSession {
  id: string
  organization_id: string
  line_id: string
  product_id: string
  started_at: string
  ended_at: string | null
  qty_produced: number | null
  qty_conforming: number | null
  cycle_time_used_ms: number
  trs: number | null
  availability: number | null
  performance: number | null
  quality: number | null
  trs_level: TrsLevel | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ProductionStop {
  id: string
  organization_id: string
  session_id: string
  cause_id: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  notes: string | null
  created_at: string
}

export interface TrsThreshold {
  id: string
  organization_id: string
  excellent_min: number
  good_min: number
  warning_min: number
  updated_at: string
}

export interface OpeningHour {
  id: string
  organization_id: string
  line_id: string | null
  day_of_week: number
  start_time: string
  end_time: string
  created_at: string
}

// ── MARGE FLASH ──────────────────────────────

export type MarginLevel = 'good' | 'warning' | 'critical' | 'loss'
export type ImportSourceType = 'excel' | 'pdf'

export interface ProductCategory {
  id: string
  organization_id: string
  name: string
  created_at: string
  deleted_at: string | null
}

export interface Customer {
  id: string
  organization_id: string
  name: string
  created_at: string
  deleted_at: string | null
}

export interface Ingredient {
  id: string
  organization_id: string
  name: string
  category: string | null
  unit: string
  price_cents: number
  supplier: string | null
  price_updated_at: string
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface IngredientPriceHistory {
  id: string
  ingredient_id: string
  price_cents: number
  effective_date: string
  created_at: string
}

export interface PackagingItem {
  id: string
  organization_id: string
  name: string
  packaging_type: string | null
  unit: string
  unit_price_cents: number
  supplier: string | null
  price_updated_at: string
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface LaborPole {
  id: string
  organization_id: string
  name: string
  default_headcount: number
  hourly_rate_cents: number
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProductSheet {
  id: string
  organization_id: string
  name: string
  category_id: string | null
  customer_id: string | null
  selling_price_cents: number | null
  theoretical_output_per_hour: number | null
  line_id: string | null
  mp_cost_cents: number | null
  packaging_cost_cents: number | null
  labor_cost_cents: number | null
  total_cost_cents: number | null
  margin_cents: number | null
  margin_rate_bps: number | null
  margin_level: MarginLevel | null
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface RecipeLine {
  id: string
  organization_id: string
  product_sheet_id: string
  ingredient_id: string
  quantity: number
  unit: string
  line_cost_cents: number | null
  display_order: number
  created_at: string
}

export interface PackagingLine {
  id: string
  organization_id: string
  product_sheet_id: string
  packaging_item_id: string
  quantity_per_product: number
  line_cost_cents: number | null
  display_order: number
  created_at: string
}

export interface ProductLabor {
  id: string
  organization_id: string
  product_sheet_id: string
  pole_id: string
  headcount_override: number | null
  rate_override_cents: number | null
  created_at: string
}

export interface MarginThreshold {
  id: string
  organization_id: string
  good_min_bps: number
  warning_min_bps: number
  price_freshness_days: number
  updated_at: string
}

export interface ImportLog {
  id: string
  organization_id: string
  source_type: ImportSourceType
  document_type: string
  file_name: string
  file_path: string | null
  items_created: number
  items_updated: number
  items_errored: number
  imported_by: string | null
  created_at: string
}

// ── PREV'PROD — Prévisions de fabrication ───────────────

export type PrevStockType = 'stock_permanent' | 'sur_commande' | 'mixte'
export type PrevDispatchPriority = 'matin' | 'journee' | 'avance'
export type PrevForecastMethod = 'dernier_jour' | 'moyenne_4sem' | 'moyenne_ponderee'
export type PrevOrderType = 'commande' | 'devis'
export type PrevOrderStatus = 'en_attente' | 'confirme'
export type PrevPlanStatus = 'draft' | 'validated' | 'in_progress' | 'done'
export type PrevClientType = 'stock_brand' | 'custom_order'
export type PrevImportType = 'commandes' | 'devis' | 'stocks' | 'referentiel'
export type PrevModificationType = 'ajout' | 'suppression' | 'modification'
export type PrevModificationStatus = 'pending' | 'integrated' | 'ignored' | 'deferred'

export interface PrevLine {
  id: string
  organization_id: string
  name: string
  compatible_weights_grams: number[]
  max_capacity_grams: number | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PrevMixer {
  id: string
  organization_id: string
  name: string
  capacity_grams: number
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PrevRecipe {
  id: string
  organization_id: string
  code: string
  name: string
  brand: string | null
  stock_type: PrevStockType
  dispatch_priority: PrevDispatchPriority
  forecast_method: PrevForecastMethod
  coverage_j1_pct: number
  min_batch_grams: number
  min_batch_exception: boolean
  loss_pct: number
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PrevProduct {
  id: string
  organization_id: string
  code: string
  label: string
  recipe_id: string
  weight_grams: number
  format_label: string
  compatible_line_ids: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PrevClient {
  id: string
  organization_id: string
  code: string
  name: string
  client_type: PrevClientType
  brand: string | null
  dispatch_priority: PrevDispatchPriority
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PrevHoliday {
  id: string
  organization_id: string
  date: string
  label: string
  auto_generated: boolean
}

export interface PrevSalesHistory {
  id: string
  organization_id: string
  product_id: string
  sale_date: string
  quantity_pieces: number
  total_weight_grams: number
  created_at: string
}

export interface PrevStockSnapshot {
  id: string
  organization_id: string
  product_id: string
  snapshot_date: string
  stock_pieces: number
  dlc: string | null
  lot: string | null
  created_at: string
}

export interface PrevImportBatch {
  id: string
  organization_id: string
  import_type: PrevImportType
  filename: string | null
  source: 'csv' | 'manual'
  row_count: number | null
  matched_count: number | null
  unmatched_count: number | null
  imported_at: string
  imported_by: string | null
}

export interface PrevOrder {
  id: string
  organization_id: string
  import_batch_id: string
  order_type: PrevOrderType
  delivery_date: string
  product_id: string | null
  client_id: string | null
  product_code_raw: string
  product_label_raw: string
  quantity_pieces: number
  quantity_colis: number | null
  total_weight_grams: number
  unit_price_gross_cents: number | null
  unit_price_net_cents: number | null
  probability_pct: number
  status: PrevOrderStatus
  matched: boolean
  created_at: string
}

export interface PrevDailyPlan {
  id: string
  organization_id: string
  plan_date: string
  status: PrevPlanStatus
  validated_at: string | null
  validated_by: string | null
  created_at: string
  updated_at: string
}

export interface PrevPlanRequirement {
  id: string
  plan_id: string
  recipe_id: string
  stock_target_pieces: number | null
  coverage_j1_pieces: number | null
  orders_pieces: number | null
  quotes_weighted_pieces: number | null
  current_stock_pieces: number | null
  gross_requirement_pieces: number
  net_requirement_pieces: number
  total_weight_grams: number
  total_weight_with_loss_grams: number
  below_threshold: boolean
  threshold_forced: boolean
  forecast_method_used: string
  created_at: string
}

export interface PrevPlanLineItem {
  id: string
  plan_id: string
  line_id: string
  mixer_id: string | null
  recipe_id: string
  product_id: string
  format_label: string
  weight_per_piece_grams: number
  quantity_pieces: number
  total_weight_grams: number
  loss_weight_grams: number
  sort_order: number
  is_morning_priority: boolean
  is_rupture_priority: boolean
  created_at: string
  updated_at: string
}

export interface PrevPlanModification {
  id: string
  plan_id: string
  modification_type: PrevModificationType
  description: string
  source_order_id: string | null
  impact_weight_grams: number | null
  status: PrevModificationStatus
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
}

// ── VEILLE QUALITÉ ──────────────────────────────

export interface VeilleReport {
  id: string
  organization_id: string
  scanner_id: string
  content: string
  created_at: string
  created_by: string | null
}

export interface VeilleSearch {
  id: string
  organization_id: string
  query: string
  content: string
  created_at: string
  created_by: string | null
}
