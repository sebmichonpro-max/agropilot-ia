import { createServerClient } from '@/lib/supabase/server'
import { ModuleLayout } from '@/components/shared/module-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Organization, Profile, PlanType } from '@/types/database'
import type { Metadata } from 'next'
import { DEPARTMENTS } from '@/lib/permissions'

export const metadata: Metadata = {
  title: 'Tableau de bord — SMAPIA',
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

  const activeDeptCount = DEPARTMENTS.length
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
      <p className="text-lg text-muted-foreground">
        Bienvenue sur SMAPIA, {org.name}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Plan actuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="text-lg capitalize">
              {planLabels[org.plan as PlanType]}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Modules actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {activeModuleCount}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                / {totalModules}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Départements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeDeptCount}</p>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  )
}
