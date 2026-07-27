'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { STORAGE_TYPE_LABELS } from '@/modules/km/constants'
import type { StorageType } from '@/modules/km/types'
import { createProductReference } from '../actions'

interface ReferenceFormProps {
  orgSlug: string
}

export function ReferenceForm({ orgSlug }: ReferenceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    // Convert €/kg to centimes
    const priceEuros = parseFloat(formData.get('price_euros') as string)
    if (isNaN(priceEuros) || priceEuros <= 0) {
      toast.error('Prix invalide')
      setLoading(false)
      return
    }
    formData.set('unit_price_cents', String(Math.round(priceEuros * 100)))
    formData.delete('price_euros')

    const result = await createProductReference(orgSlug, formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Référence produit créée')
      router.push(`/${orgSlug}/achats/stocks/references`)
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelle référence produit</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Code produit</Label>
              <Input
                id="code"
                name="code"
                placeholder="CREV-300-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                name="name"
                placeholder="Crevettes 300/500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="family">Famille</Label>
              <Input
                id="family"
                name="family"
                placeholder="Surgelés poisson"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Fournisseur</Label>
              <Input
                id="supplier"
                name="supplier"
                placeholder="Océan Pacifique SA"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price_euros">Prix unitaire (€/kg)</Label>
              <Input
                id="price_euros"
                name="price_euros"
                type="number"
                step="0.01"
                placeholder="10.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unité</Label>
              <select
                id="unit"
                name="unit"
                defaultValue="kg"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="kg">kg</option>
                <option value="unites">Unités</option>
                <option value="litres">Litres</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_storage_type">
              Type de stockage par défaut
            </Label>
            <select
              id="default_storage_type"
              name="default_storage_type"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— Non défini —</option>
              {(Object.entries(STORAGE_TYPE_LABELS) as [StorageType, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Création...' : 'Créer la référence'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
