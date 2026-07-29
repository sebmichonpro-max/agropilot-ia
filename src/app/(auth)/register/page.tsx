'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'
import { registerSchema } from '@/lib/validation/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = registerSchema.safeParse({ fullName, email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setLoading(true)
    const supabase = createBrowserClient()
    const { error: authError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <Card className="border-ap-cream-200 rounded-xl">
        <CardContent className="space-y-4 text-center">
          <h2 className="text-xl font-medium text-ap-green-900">
            Compte créé !
          </h2>
          <p className="text-sm text-ap-cream-800">
            Vérifiez votre boîte email pour confirmer votre compte, puis
            connectez-vous.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full border-ap-green-200 text-ap-green-600 hover:bg-ap-green-50">
              Retour à la connexion
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-ap-cream-200 rounded-xl">
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <h2 className="text-xl font-medium text-ap-green-900">Créer mon compte</h2>

          {error && (
            <p className="text-sm text-red-700">{error}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-ap-green-900">Nom complet</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Jean Dupont"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
              className="border-ap-cream-300 focus:ring-ap-green-500 focus:border-ap-green-500"
            />
          </div>

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
              placeholder="6 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="border-ap-cream-300 focus:ring-ap-green-500 focus:border-ap-green-500"
            />
          </div>

          <Button type="submit" className="w-full bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </Button>
        </CardContent>

        <CardFooter className="text-sm">
          <Link
            href="/login"
            className="text-ap-cream-700 hover:text-ap-green-900 transition-colors"
          >
            Déjà un compte ? Se connecter
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
