import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { SCANNER_MAP, FREE_SEARCH_SYSTEM_PROMPT } from '@/modules/veille-qualite'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await req.json() as {
      scannerId?: string
      customQuery?: string
    }

    let systemPrompt: string
    let userMessage: string
    const today = new Date().toLocaleDateString('fr-FR')

    if (body.scannerId) {
      const scanner = SCANNER_MAP.get(body.scannerId)
      if (!scanner) {
        return Response.json({ error: 'Scanner inconnu' }, { status: 400 })
      }

      systemPrompt = scanner.systemPrompt
      const queries = scanner.buildQueries()
      userMessage = `Effectue une veille complète sur les sujets suivants :\n${queries.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nDate du jour : ${today}. Recherche les informations les plus récentes. Structure ton rapport avec des sections claires.`
    } else if (body.customQuery?.trim()) {
      systemPrompt = FREE_SEARCH_SYSTEM_PROMPT
      userMessage = `${body.customQuery.trim()}\n\nDate du jour : ${today}. Recherche les informations les plus récentes.`
    } else {
      return Response.json({ error: 'Scanner ou requête requis' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'Configuration IA manquante' }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            system: systemPrompt,
            tools: [
              {
                type: 'web_search_20250305',
                name: 'web_search',
                max_uses: 10,
              } as unknown as Anthropic.Messages.Tool,
            ],
            messages: [{ role: 'user', content: userMessage }],
            stream: true,
          })

          for await (const event of response) {
            if (event.type === 'content_block_delta') {
              const delta = event.delta as unknown as Record<string, unknown>
              if (delta.type === 'text_delta' && typeof delta.text === 'string') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta.text })}\n\n`))
              }
            } else if (event.type === 'message_stop') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
            }
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Erreur IA inconnue'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return Response.json({ error: message }, { status: 500 })
  }
}
