'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { createProduct, updateProduct } from '../actions'
import type { Product } from '@/types/database'

interface ProductFormProps {
  orgSlug: string
  product?: Product | null
}

export function ProductForm({ orgSlug, product }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    const result = product
      ? await updateProduct(orgSlug, product.id, data)
      : await createProduct(orgSlug, data)

    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(product ? 'Produit mis à jour' : 'Produit créé')

    if (!product && 'id' in result && result.id) {
      router.push(`/${orgSlug}/produits/${result.id}`)
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
              <Label htmlFor="name" className="text-sm font-medium text-ap-green-900">
                Nom du produit *
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={product?.name ?? ''}
                required
                className="border-ap-cream-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference" className="text-sm font-medium text-ap-green-900">
                Référence
              </Label>
              <Input
                id="reference"
                name="reference"
                defaultValue={product?.reference ?? ''}
                className="border-ap-cream-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-ap-green-900">
              Description
            </Label>
            <textarea
              id="description"
              name="description"
              defaultValue={product?.description ?? ''}
              rows={3}
              className="w-full rounded-md border border-ap-cream-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ap-green-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="unit" className="text-sm font-medium text-ap-green-900">
                Unité *
              </Label>
              <Input
                id="unit"
                name="unit"
                defaultValue={product?.unit ?? 'kg'}
                required
                className="border-ap-cream-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight_grams" className="text-sm font-medium text-ap-green-900">
                Poids (grammes)
              </Label>
              <Input
                id="weight_grams"
                name="weight_grams"
                type="number"
                defaultValue={product?.weight_grams ?? ''}
                className="border-ap-cream-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode" className="text-sm font-medium text-ap-green-900">
                Code-barres
              </Label>
              <Input
                id="barcode"
                name="barcode"
                defaultValue={product?.barcode ?? ''}
                className="border-ap-cream-300"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shelf_life_days" className="text-sm font-medium text-ap-green-900">
                Durée de vie (jours)
              </Label>
              <Input
                id="shelf_life_days"
                name="shelf_life_days"
                type="number"
                defaultValue={product?.shelf_life_days ?? ''}
                className="border-ap-cream-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storage_conditions" className="text-sm font-medium text-ap-green-900">
                Conditions de conservation
              </Label>
              <Input
                id="storage_conditions"
                name="storage_conditions"
                defaultValue={product?.storage_conditions ?? ''}
                placeholder="Ex: 0-4°C"
                className="border-ap-cream-300"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-ap-cream-300"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800"
            >
              {loading
                ? 'Enregistrement...'
                : product
                  ? 'Mettre à jour'
                  : 'Créer le produit'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
