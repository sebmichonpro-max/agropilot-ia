import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import type { Profile, Organization } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single<Pick<Profile, 'organization_id'>>()

    if (profileError) {
      console.error('Profile fetch error:', profileError.message)
    }

    if (profile?.organization_id) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', profile.organization_id)
        .single<Pick<Organization, 'slug'>>()

      if (orgError) {
        console.error('Org fetch error:', orgError.message)
      }

      if (org) redirect(`/${org.slug}/dashboard`)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-ap-cream-50">
      <header className="flex items-center justify-between px-6 py-4 border-b border-ap-cream-200">
        <h1 className="text-xl font-bold text-ap-green-900">AgroPilot.IA</h1>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-ap-green-600 hover:bg-ap-green-50 hover:text-ap-green-900">
              Se connecter
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800">
              Commencer gratuitement
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h2 className="text-4xl font-bold tracking-tight text-ap-green-900 sm:text-5xl md:text-6xl">
          AgroPilot.IA
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-ap-cream-800 sm:text-xl">
          Le SaaS léger pour PME agroalimentaires. Qualité, traçabilité,
          production et conformité — dans un seul outil simple.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/register">
            <Button size="lg" className="w-full sm:w-auto bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800">
              Commencer gratuitement
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-ap-green-200 text-ap-green-600 hover:bg-ap-green-50">
              Se connecter
            </Button>
          </Link>
        </div>
      </main>

      <footer className="border-t border-ap-cream-200 px-6 py-4 text-center text-sm text-ap-cream-700">
        © {new Date().getFullYear()} AgroPilot.IA — Gestion intelligente pour
        l&apos;agroalimentaire
      </footer>
    </div>
  )
}
