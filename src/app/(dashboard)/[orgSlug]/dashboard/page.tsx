import { createServerClient } from '@/lib/supabase/server'
import { ModuleLayout } from '@/components/shared/module-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Organization, Profile, PlanType } from '@/types/database'
import type { Metadata } from 'next'
import { DEPARTMENTS } from '@/lib/permissions'

export const metadata: Metadata = {
  title: 'Tableau de bord — AgroPilot.IA',
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single<Profile>()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', orgSlug)
    .is('deleted_at', null)
    .single<Organization>()

  if (!org || !profile) return null

  const planLabels: Record<PlanType, string> = {
    free: 'Gratuit',
    standard: 'Standard',
    premium: 'Premium',
  }

  const freeModules = ['dashboard', 'produits', 'calculateur-nutritionnel']
  const activeModuleCount = DEPARTMENTS.reduce((count, dept) => {
    return (
      count +
      dept.modules.filter((m) => {
        if (org.plan === 'premium') return true
        if (org.plan === 'standard')
          return (
            freeModules.includes(m.key) ||
            ['tracabilite', 'haccp', 'etiquetage', 'fournisseurs'].includes(
              m.key
            )
          )
        return freeModules.includes(m.key)
      }).length
    )
  }, 0)

  const totalModules = DEPARTMENTS.reduce(
    (count, dept) => count + dept.modules.length,
    0
  )

  return (
    <ModuleLayout title="Tableau de bord">
      <p className="text-lg text-ap-cream-800">
        Bienvenue sur AgroPilot.IA, {org.name}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-ap-cream-200 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-ap-cream-700">
              Plan actuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="inline-flex items-center rounded-full bg-ap-green-100 px-2.5 py-0.5 text-xs font-medium text-ap-green-800 capitalize">
              {planLabels[org.plan as PlanType]}
            </span>
          </CardContent>
        </Card>

        <Card className="border-ap-cream-200 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-ap-cream-700">
              Modules actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium text-ap-green-900">
              {activeModuleCount}{' '}
              <span className="text-sm font-normal text-ap-cream-700">
                / {totalModules}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-ap-cream-200 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-ap-cream-700">
              Départements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium text-ap-green-900">{DEPARTMENTS.length}</p>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  )
}
