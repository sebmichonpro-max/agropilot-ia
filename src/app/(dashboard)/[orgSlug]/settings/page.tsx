import { createServerClient } from '@/lib/supabase/server'
import { ModuleLayout } from '@/components/shared/module-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Organization, Profile, PlanType } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Paramètres — SMAPIA',
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

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

  return (
    <ModuleLayout title="Paramètres">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nom</p>
              <p className="font-medium">{org.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Slug</p>
              <p className="font-medium">{org.slug}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="font-medium capitalize">{planLabels[org.plan as PlanType]}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mon profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nom</p>
              <p className="font-medium">{profile.full_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rôle</p>
              <p className="font-medium capitalize">{profile.role}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  )
}
