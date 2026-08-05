'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { createSupplier, updateSupplier } from '../actions'
import type { Supplier } from '@/types/database'

interface SupplierFormProps {
  orgSlug: string
  supplier?: Supplier | null
}

export function SupplierForm({ orgSlug, supplier }: SupplierFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    const result = supplier
      ? await updateSupplier(orgSlug, supplier.id, data)
      : await createSupplier(orgSlug, data)

    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(supplier ? 'Fournisseur mis à jour' : 'Fournisseur créé')

    if (!supplier && 'id' in result && result.id) {
      router.push(`/${orgSlug}/achats/fournisseurs/${result.id}`)
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
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" name="name" defaultValue={supplier?.name ?? ''} required className="border-ap-cream-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact</Label>
              <Input id="contact_name" name="contact_name" defaultValue={supplier?.contact_name ?? ''} className="border-ap-cream-300" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={supplier?.email ?? ''} className="border-ap-cream-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" name="phone" defaultValue={supplier?.phone ?? ''} className="border-ap-cream-300" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" name="address" defaultValue={supplier?.address ?? ''} className="border-ap-cream-300" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="postal_code">Code postal</Label>
              <Input id="postal_code" name="postal_code" defaultValue={supplier?.postal_code ?? ''} className="border-ap-cream-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" name="city" defaultValue={supplier?.city ?? ''} className="border-ap-cream-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input id="country" name="country" defaultValue={supplier?.country ?? 'France'} className="border-ap-cream-300" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siret">SIRET</Label>
              <Input id="siret" name="siret" defaultValue={supplier?.siret ?? ''} className="border-ap-cream-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <select
                id="status"
                name="status"
                defaultValue={supplier?.status ?? 'pending'}
                className="w-full rounded-md border border-ap-cream-300 bg-transparent px-3 py-2 text-sm"
              >
                <option value="pending">En attente</option>
                <option value="active">Agréé</option>
                <option value="suspended">Suspendu</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              defaultValue={supplier?.notes ?? ''}
              rows={3}
              className="w-full rounded-md border border-ap-cream-300 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="border-ap-cream-300">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800">
              {loading ? 'Enregistrement...' : supplier ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
