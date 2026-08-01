export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import type { Profile, PrevPlanRequirement } from '@/types/database'
import { PrevProdTabs } from './components/prev-prod-tabs'
import { PlanDashboard } from './components/plan-dashboard'

export async function generateMetadata() {
  return { title: "Prev'Prod — Plan du jour — AgroPilot.IA" }
}

export default async function PrevProdPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single<Pick<Profile, 'organization_id'>>()
  if (!profile?.organization_id) return null

  const today = new Date().toISOString().split('T')[0]

  const [plansRes, recipesRes, linesRes, mixersRes] = await Promise.all([
    supabase
      .from('prev_daily_plans')
      .select('*')
      .gte('plan_date', today)
      .order('plan_date', { ascending: true })
      .limit(7),
    supabase.from('prev_recipes').select('id, code, name, brand, stock_type, dispatch_priority, min_batch_grams, min_batch_exception').is('deleted_at', null).eq('is_active', true),
    supabase.from('prev_lines').select('id, name, compatible_weights_grams').is('deleted_at', null).eq('is_active', true).order('sort_order'),
    supabase.from('prev_mixers').select('id, name, capacity_grams').is('deleted_at', null).order('sort_order'),
  ])

  const plans = plansRes.data ?? []
  let requirements: PrevPlanRequirement[] = []

  if (plans.length > 0) {
    const { data } = await supabase
      .from('prev_plan_requirements')
      .select('*')
      .eq('plan_id', plans[0].id)
      .order('total_weight_with_loss_grams', { ascending: false })
    requirements = (data ?? []) as PrevPlanRequirement[]
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ap-green-900 mb-4">Prev&apos;Prod</h1>
      <PrevProdTabs orgSlug={orgSlug} />
      <PlanDashboard
        orgSlug={orgSlug}
        plans={plans}
        requirements={requirements}
        recipes={recipesRes.data ?? []}
        lines={linesRes.data ?? []}
        mixers={mixersRes.data ?? []}
        today={today}
      />
    </div>
  )
}
