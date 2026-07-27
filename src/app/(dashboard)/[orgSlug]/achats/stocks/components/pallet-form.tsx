'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { STORAGE_TYPE_LABELS } from '@/modules/km/constants'
import type { StorageZone, ProductReference } from '@/modules/km/types'
import { createPallet } from '../actions'

interface PalletFormProps {
  orgSlug: string
  zones: StorageZone[]
  references: ProductReference[]
}

export function PalletForm({ orgSlug, zones, references }: PalletFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedRefId, setSelectedRefId] = useState('')

  const selectedRef = references.find((r) => r.id === selectedRefId)
  const defaultPrice = selectedRef
    ? (selectedRef.unit_price_cents / 100).toFixed(2)
    : ''

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    // Convert kg to grams
    const quantityKg = parseFloat(formData.get('quantity_kg') as string)
    if (isNaN(quantityKg) || quantityKg <= 0) {
      toast.error('Quantité invalide')
      setLoading(false)
      return
    }
    formData.set('initial_quantity', String(Math.round(quantityKg * 1000)))
    formData.delete('quantity_kg')

    // Convert €/kg to centimes
    const priceEuros = parseFloat(formData.get('price_euros') as string)
    if (isNaN(priceEuros) || priceEuros <= 0) {
      toast.error('Prix invalide')
      setLoading(false)
      return
    }
    formData.set('unit_price_cents', String(Math.round(priceEuros * 100)))
    formData.delete('price_euros')

    const result = await createPallet(orgSlug, formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Palette enregistrée')
      router.push(`/${orgSlug}/achats/stocks/palettes`)
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrée palette</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product_reference_id">Référence produit</Label>
            <select
              id="product_reference_id"
              name="product_reference_id"
              value={selectedRefId}
              onChange={(e) => setSelectedRefId(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— Sélectionner —</option>
              {references.map((ref) => (
                <option key={ref.id} value={ref.id}>
                  {ref.code} — {ref.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storage_zone_id">Zone de stockage</Label>
            <select
              id="storage_zone_id"
              name="storage_zone_id"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— Sélectionner —</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} ({STORAGE_TYPE_LABELS[zone.storage_type]})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity_kg">Quantité (kg)</Label>
              <Input
                id="quantity_kg"
                name="quantity_kg"
                type="number"
                step="0.1"
                placeholder="500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_euros">Prix unitaire (€/kg)</Label>
              <Input
                id="price_euros"
                name="price_euros"
                type="number"
                step="0.01"
                placeholder="10.00"
                defaultValue={defaultPrice}
                key={selectedRefId}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lot_number">Numéro de lot</Label>
              <Input
                id="lot_number"
                name="lot_number"
                placeholder="LOT-2026-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry_date">Date d&apos;entrée</Label>
              <Input
                id="entry_date"
                name="entry_date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="Optionnel" />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Enregistrement...' : "Enregistrer l'entrée palette"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
