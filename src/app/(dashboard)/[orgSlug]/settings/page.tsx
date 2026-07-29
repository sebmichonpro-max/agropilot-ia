import { createServerClient } from '@/lib/supabase/server'
import { ModuleLayout } from '@/components/shared/module-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Organization, Profile, PlanType } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Paramètres — AgroPilot.IA',
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
        <Card className="border-ap-cream-200 rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-ap-green-900">Organisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-ap-cream-700">Nom</p>
              <p className="font-medium text-ap-green-900">{org.name}</p>
            </div>
            <div>
              <p className="text-xs text-ap-cream-700">Slug</p>
              <p className="font-medium text-ap-green-900">{org.slug}</p>
            </div>
            <div>
              <p className="text-xs text-ap-cream-700">Plan</p>
              <p className="font-medium text-ap-green-900 capitalize">{planLabels[org.plan as PlanType]}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-ap-cream-200 rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-ap-green-900">Mon profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-ap-cream-700">Nom</p>
              <p className="font-medium text-ap-green-900">{profile.full_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ap-cream-700">Rôle</p>
              <p className="font-medium text-ap-green-900 capitalize">{profile.role}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  )
}
