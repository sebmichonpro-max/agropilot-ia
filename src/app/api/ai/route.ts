import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Non autorisé', { status: 401 })

  const { message } = await req.json() as { message: string }
  if (!message?.trim()) return new Response('Message requis', { status: 400 })

  // TODO: integrate Anthropic streaming (SSE)
  return Response.json({
    response: 'IA non disponible pour le moment. Intégration en cours.',
  })
}
