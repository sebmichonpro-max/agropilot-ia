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
