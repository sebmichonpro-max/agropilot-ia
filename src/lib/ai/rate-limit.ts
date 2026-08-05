import { createServerClient } from '@/lib/supabase/server'

const WINDOW_MS = 60 * 60 * 1000
const MAX_REQUESTS = 20

const requestLog = new Map<string, number[]>()

export async function checkRateLimit(userId: string): Promise<boolean> {
  const now = Date.now()
  const windowStart = now - WINDOW_MS

  const timestamps = requestLog.get(userId) ?? []
  const recent = timestamps.filter((t) => t > windowStart)

  if (recent.length >= MAX_REQUESTS) return false

  recent.push(now)
  requestLog.set(userId, recent)
  return true
}
