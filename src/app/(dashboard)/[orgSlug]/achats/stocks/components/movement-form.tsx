'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MOVEMENT_TYPE_LABELS } from '@/modules/km/constants'
import { formatWeight } from '@/modules/km/formatters'
import type { MovementType } from '@/modules/km/types'
import { addPalletMovement } from '../actions'

interface MovementFormProps {
  orgSlug: string
  palletId: string
  currentQuantityGrams: number
  referenceName: string
}

export function MovementForm({
  orgSlug,
  palletId,
  currentQuantityGrams,
  referenceName,
}: MovementFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const maxKg = currentQuantityGrams / 1000

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    // Convert kg to grams
    const quantityKg = parseFloat(formData.get('quantity_kg') as string)
    if (isNaN(quantityKg) || quantityKg <= 0) {
      toast.error('Quantité invalide')
      setLoading(false)
      return
    }
    if (quantityKg > maxKg) {
      toast.error(`Maximum ${maxKg} kg disponible`)
      setLoading(false)
      return
    }
    formData.set('quantity', String(Math.round(quantityKg * 1000)))
    formData.delete('quantity_kg')

    const result = await addPalletMovement(orgSlug, palletId, formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Mouvement enregistré')
      router.push(`/${orgSlug}/achats/stocks/palettes/${palletId}`)
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enregistrer un prélèvement</CardTitle>
        <p className="text-sm text-muted-foreground">
          {referenceName} — Reste : {formatWeight(currentQuantityGrams)}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity_kg">
              Quantité prélevée (kg, max {maxKg})
            </Label>
            <Input
              id="quantity_kg"
              name="quantity_kg"
              type="number"
              step="0.1"
              max={maxKg}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="movement_type">Type de mouvement</Label>
            <select
              id="movement_type"
              name="movement_type"
              defaultValue="picking"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {(
                Object.entries(MOVEMENT_TYPE_LABELS) as [string, string][]
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="movement_date">Date</Label>
            <Input
              id="movement_date"
              name="movement_date"
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="Optionnel" />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Enregistrement...' : 'Enregistrer le mouvement'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
