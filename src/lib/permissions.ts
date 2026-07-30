import type { PlanType, RoleType } from '@/types/database'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  ShieldCheck,
  Factory,
  Users,
  FlaskConical,
  TrendingUp,
  Truck,
  FolderKanban,
  Calculator,
} from 'lucide-react'

// TODO: remove 'stocks', 'fournisseurs', 'receptions', 'transferts' from free when going to prod
// TODO: remove dev-only modules (stocks, fournisseurs, receptions, transferts, pointage, conges) from free when going to prod
// TODO: remove dev-only modules from free when going to prod
const FREE_MODULES = ['dashboard', 'produits', 'calculateur-nutritionnel', 'stocks', 'fournisseurs', 'receptions', 'transferts', 'pointage', 'conges', 'simulateur-salaire', 'prod-pulse', 'marge-flash'] as const
const STANDARD_MODULES = [
  ...FREE_MODULES,
  'tracabilite',
  'haccp',
  'etiquetage',
  'fournisseurs',
  'ia-basique',
] as const
const PREMIUM_MODULES = [
  ...STANDARD_MODULES,
  'production',
  'non-conformites',
  'audits',
  'ia-avancee',
  'exports',
  'api',
  'ordres-fabrication',
  'planning',
  'prod-pulse',
  'marge-flash',
  'pointage',
  'simulateur-salaire',
  'coefficient-michon',
  'conges',
  'clients',
  'commandes',
  'previsions',
  'receptions',
  'stocks',
  'transferts',
  'projets',
  'taches',
  'gantt',
  'kpi',
  'rapports',
] as const

const PLAN_ACCESS: Record<PlanType, readonly string[]> = {
  free: FREE_MODULES,
  standard: STANDARD_MODULES,
  premium: PREMIUM_MODULES,
}

export interface ModuleInfo {
  key: string
  label: string
  href: string
}

export interface Department {
  key: string
  label: string
  icon: LucideIcon
  modules: ModuleInfo[]
}

export const DEPARTMENTS: Department[] = [
  {
    key: 'direction',
    label: 'Direction',
    icon: LayoutDashboard,
    modules: [
      { key: 'dashboard', label: 'Tableau de bord', href: 'dashboard' },
      { key: 'kpi', label: 'KPI', href: 'kpi' },
      { key: 'rapports', label: 'Rapports', href: 'rapports' },
    ],
  },
  {
    key: 'qualite',
    label: 'Qualité',
    icon: ShieldCheck,
    modules: [
      { key: 'haccp', label: 'HACCP', href: 'haccp' },
      { key: 'non-conformites', label: 'Non-conformités', href: 'non-conformites' },
      { key: 'audits', label: 'Audits', href: 'audits' },
      { key: 'tracabilite', label: 'Traçabilité', href: 'tracabilite' },
    ],
  },
  {
    key: 'production',
    label: 'Production',
    icon: Factory,
    modules: [
      { key: 'ordres-fabrication', label: 'Ordres de fabrication', href: 'ordres-fabrication' },
      { key: 'planning', label: 'Planning', href: 'planning' },
      { key: 'prod-pulse', label: "Prod'Pulse", href: 'prod-pulse' },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: Calculator,
    modules: [
      { key: 'marge-flash', label: 'Marge Flash', href: 'marge-flash' },
    ],
  },
  {
    key: 'rh',
    label: 'RH',
    icon: Users,
    modules: [
      { key: 'pointage', label: 'Pointage', href: 'pointage' },
      { key: 'simulateur-salaire', label: 'Simulateur salaire', href: 'simulateur-salaire' },
      { key: 'coefficient-michon', label: 'Coefficient Michon', href: 'coefficient-michon' },
      { key: 'conges', label: 'Congés', href: 'conges' },
    ],
  },
  {
    key: 'rd',
    label: 'R&D',
    icon: FlaskConical,
    modules: [
      { key: 'produits', label: 'Fiches produits', href: 'produits' },
      { key: 'etiquetage', label: 'Étiquetage', href: 'etiquetage' },
      { key: 'calculateur-nutritionnel', label: 'Calculateur nutritionnel', href: 'calculateur-nutritionnel' },
    ],
  },
  {
    key: 'commerce',
    label: 'Commerce',
    icon: TrendingUp,
    modules: [
      { key: 'clients', label: 'Clients', href: 'clients' },
      { key: 'commandes', label: 'Commandes', href: 'commandes' },
      { key: 'previsions', label: 'Prévisions', href: 'previsions' },
    ],
  },
  {
    key: 'achats',
    label: 'Achats',
    icon: Truck,
    modules: [
      { key: 'fournisseurs', label: 'Fournisseurs', href: 'achats/fournisseurs' },
      { key: 'receptions', label: 'Réceptions', href: 'achats/receptions' },
      { key: 'stocks', label: 'Stocks', href: 'achats/stocks' },
      { key: 'transferts', label: 'Transferts', href: 'achats/transferts' },
    ],
  },
  {
    key: 'gestion-projet',
    label: 'Gestion de projet',
    icon: FolderKanban,
    modules: [
      { key: 'projets', label: 'Projets', href: 'projets' },
      { key: 'taches', label: 'Tâches', href: 'taches' },
      { key: 'gantt', label: 'Gantt', href: 'gantt' },
    ],
  },
]

export function checkAccess(module: string, plan: PlanType, _role: RoleType): boolean {
  const allowedModules = PLAN_ACCESS[plan]
  return allowedModules.includes(module)
}

export interface DepartmentAccess {
  department: Department
  modules: Array<ModuleInfo & { locked: boolean }>
}

export function getDepartmentAccess(plan: PlanType): DepartmentAccess[] {
  const allowedModules = PLAN_ACCESS[plan]

  return DEPARTMENTS.map((dept) => ({
    department: dept,
    modules: dept.modules.map((mod) => ({
      ...mod,
      locked: !allowedModules.includes(mod.key),
    })),
  }))
}
