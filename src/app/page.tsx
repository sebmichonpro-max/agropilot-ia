import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import type { Profile, Organization } from '@/types/database'

export default async function HomePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single<Pick<Profile, 'organization_id'>>()

    if (profile?.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', profile.organization_id)
        .is('deleted_at', null)
        .single<Pick<Organization, 'slug'>>()

      if (org) redirect(`/${org.slug}/dashboard`)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <h1 className="text-xl font-bold text-emerald-900">SMAPIA</h1>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Se connecter</Button>
          </Link>
          <Link href="/register">
            <Button>Commencer gratuitement</Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
          SMAPIA
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Le SaaS léger pour PME agroalimentaires. Qualité, traçabilité,
          production et conformité — dans un seul outil simple.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/register">
            <Button size="lg" className="w-full sm:w-auto">
              Commencer gratuitement
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Se connecter
            </Button>
          </Link>
        </div>
      </main>

      <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SMAPIA — Gestion intelligente pour
        l&apos;agroalimentaire
      </footer>
    </div>
  )
}
