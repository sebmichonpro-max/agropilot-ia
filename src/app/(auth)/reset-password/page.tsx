'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'
import { resetPasswordSchema } from '@/lib/validation/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = resetPasswordSchema.safeParse({ email })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setLoading(true)
    const supabase = createBrowserClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      { redirectTo: `${window.location.origin}/auth/callback` }
    )

    if (resetError) {
      setError(resetError.message)
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
            Email envoyé
          </h2>
          <p className="text-sm text-ap-cream-800">
            Si un compte existe avec cette adresse, vous recevrez un lien de
            réinitialisation.
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
          <h2 className="text-xl font-medium text-ap-green-900">Réinitialiser le mot de passe</h2>

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

          <Button type="submit" className="w-full bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800" disabled={loading}>
            {loading ? 'Envoi...' : 'Réinitialiser'}
          </Button>
        </CardContent>

        <CardFooter className="text-sm">
          <Link
            href="/login"
            className="text-ap-cream-700 hover:text-ap-green-900 transition-colors"
          >
            Retour à la connexion
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
