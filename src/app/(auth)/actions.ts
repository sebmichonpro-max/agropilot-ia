'use server'

import { createServerClient } from '@/lib/supabase/server'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function ensureOrganization(): Promise<{
  slug: string | null
  error: string | null
}> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { slug: null, error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { slug: null, error: 'Profil introuvable' }

  if (profile.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', profile.organization_id)
      .single()

    return { slug: org?.slug ?? null, error: null }
  }

  const fullName =
    user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Mon'
  const orgName = `${fullName} Organisation`
  const slug = toSlug(orgName) + '-' + Date.now().toString(36)

  const { data: org, error: insertError } = await supabase
    .from('organizations')
    .insert({ name: orgName, slug })
    .select('id, slug')
    .single()

  if (insertError || !org) {
    return { slug: null, error: 'Erreur lors de la création de l\'organisation' }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ organization_id: org.id, role: 'owner' })
    .eq('id', user.id)

  if (updateError) {
    return { slug: null, error: 'Erreur lors de l\'association du profil' }
  }

  return { slug: org.slug, error: null }
}
