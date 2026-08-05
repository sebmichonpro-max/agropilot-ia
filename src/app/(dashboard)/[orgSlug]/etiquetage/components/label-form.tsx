'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { createLabel, updateLabel } from '../actions'
import type { ProductLabel } from '@/types/database'

interface LabelFormProps {
  orgSlug: string
  label?: ProductLabel | null
}

export function LabelForm({ orgSlug, label }: LabelFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data: Record<string, unknown> = Object.fromEntries(formData)
    if (!label) {
      data.product_id = formData.get('product_id') || null
    }

    const result = label
      ? await updateLabel(orgSlug, label.id, { ...data, product_id: label.product_id })
      : await createLabel(orgSlug, data)

    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(label ? 'Étiquette mise à jour' : 'Étiquette créée')
    if (!label && 'id' in result && result.id) {
      router.push(`/${orgSlug}/etiquetage/${result.id}`)
    } else {
      router.refresh()
    }
  }

  return (
    <Card className="border-ap-cream-200 rounded-xl">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="label_name">Nom de l&apos;étiquette *</Label>
              <Input id="label_name" name="label_name" defaultValue={label?.label_name ?? ''} required className="border-ap-cream-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="net_quantity">Quantité nette *</Label>
              <Input id="net_quantity" name="net_quantity" defaultValue={label?.net_quantity ?? ''} required placeholder="Ex: 500g" className="border-ap-cream-300" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="denomination">Dénomination de vente *</Label>
            <Input id="denomination" name="denomination" defaultValue={label?.denomination ?? ''} required placeholder="Ex: Pâté de campagne" className="border-ap-cream-300" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ingredients_text">Liste des ingrédients *</Label>
            <textarea
              id="ingredients_text"
              name="ingredients_text"
              defaultValue={label?.ingredients_text ?? ''}
              rows={4}
              required
              placeholder="Listez les ingrédients par ordre décroissant de poids..."
              className="w-full rounded-md border border-ap-cream-300 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergens_highlighted">Allergènes mis en évidence</Label>
            <textarea
              id="allergens_highlighted"
              name="allergens_highlighted"
              defaultValue={label?.allergens_highlighted ?? ''}
              rows={2}
              placeholder="Ex: gluten (blé), lait, oeufs..."
              className="w-full rounded-md border border-ap-cream-300 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dlc_ddm">DLC / DDM</Label>
              <Input id="dlc_ddm" name="dlc_ddm" defaultValue={label?.dlc_ddm ?? ''} placeholder="Ex: À consommer avant le..." className="border-ap-cream-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storage_conditions">Conditions de conservation</Label>
              <Input id="storage_conditions" name="storage_conditions" defaultValue={label?.storage_conditions ?? ''} placeholder="Ex: À conserver entre 0°C et 4°C" className="border-ap-cream-300" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="origin_country">Pays d&apos;origine</Label>
              <Input id="origin_country" name="origin_country" defaultValue={label?.origin_country ?? ''} className="border-ap-cream-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lot_number">Numéro de lot</Label>
              <Input id="lot_number" name="lot_number" defaultValue={label?.lot_number ?? ''} className="border-ap-cream-300" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="operator_name">Exploitant</Label>
              <Input id="operator_name" name="operator_name" defaultValue={label?.operator_name ?? ''} className="border-ap-cream-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operator_address">Adresse exploitant</Label>
              <Input id="operator_address" name="operator_address" defaultValue={label?.operator_address ?? ''} className="border-ap-cream-300" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nutritional_declaration">Déclaration nutritionnelle</Label>
            <textarea
              id="nutritional_declaration"
              name="nutritional_declaration"
              defaultValue={label?.nutritional_declaration ?? ''}
              rows={3}
              placeholder="Valeurs nutritionnelles pour 100g..."
              className="w-full rounded-md border border-ap-cream-300 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          {!label && (
            <input type="hidden" name="product_id" value="" />
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="border-ap-cream-300">Annuler</Button>
            <Button type="submit" disabled={loading} className="bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800">
              {loading ? 'Enregistrement...' : label ? 'Mettre à jour' : "Créer l'étiquette"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
