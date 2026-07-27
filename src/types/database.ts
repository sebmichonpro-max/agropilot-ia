export type PlanType = 'free' | 'standard' | 'premium'
export type RoleType = 'owner' | 'admin' | 'member' | 'viewer'

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
