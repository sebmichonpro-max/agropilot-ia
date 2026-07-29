'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { loginSchema } from '@/lib/validation/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setLoading(true)
    const supabase = createBrowserClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })

    if (authError) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <Card className="border-ap-cream-200 rounded-xl">
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <h2 className="text-xl font-medium text-ap-green-900">Se connecter</h2>

          {error && (
            <p className="text-sm text-red-700">{error}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-ap-green-900">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="border-ap-cream-300 focus:ring-ap-green-500 focus:border-ap-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-ap-green-900">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="border-ap-cream-300 focus:ring-ap-green-500 focus:border-ap-green-500"
            />
          </div>

          <Button type="submit" className="w-full bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 text-sm">
          <Link
            href="/reset-password"
            className="text-ap-cream-700 hover:text-ap-green-900 transition-colors"
          >
            Mot de passe oublié ?
          </Link>
          <Link
            href="/register"
            className="text-ap-green-700 hover:text-ap-green-900 font-medium transition-colors"
          >
            Créer un compte
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
