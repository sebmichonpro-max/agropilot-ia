import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ai/rate-limit'
import { sanitizeInput } from '@/lib/ai/sanitize'
import { getSystemPrompt } from '@/lib/ai/prompts'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Non autorisé', { status: 401 })

  const allowed = await checkRateLimit(user.id)
  if (!allowed) {
    return new Response('Limite atteinte, réessayez dans quelques minutes.', { status: 429 })
  }

  const { message, module } = await req.json() as { message: string; module?: string }
  if (!message?.trim()) return new Response('Message requis', { status: 400 })

  const cleanMessage = sanitizeInput(message)

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({
      response: 'IA non disponible pour le moment. La clé API Anthropic n\'est pas configurée.',
    })
  }

  try {
    const anthropic = new Anthropic()
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      temperature: 0.3,
      system: getSystemPrompt(module),
      messages: [{ role: 'user', content: cleanMessage }],
    })

    return new Response(stream.toReadableStream(), {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  } catch {
    return Response.json({
      response: 'Service IA temporairement indisponible. Veuillez réessayer.',
    }, { status: 503 })
  }
}
