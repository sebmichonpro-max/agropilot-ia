'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { createLot, updateLot } from '../actions'
import type { Lot } from '@/types/database'

interface LotFormProps {
  orgSlug: string
  lot?: Lot | null
}

export function LotForm({ orgSlug, lot }: LotFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data: Record<string, unknown> = Object.fromEntries(formData)
    if (formData.get('visual_check_ok')) {
      data.visual_check_ok = formData.get('visual_check_ok') === 'on'
    }

    const result = lot
      ? await updateLot(orgSlug, lot.id, data)
      : await createLot(orgSlug, data)

    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(lot ? 'Lot mis à jour' : 'Lot créé')
    if (!lot && 'id' in result && result.id) {
      router.push(`/${orgSlug}/tracabilite/${result.id}`)
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
              <Label htmlFor="lot_number">Numéro de lot *</Label>
              <Input id="lot_number" name="lot_number" defaultValue={lot?.lot_number ?? ''} required className="border-ap-cream-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <select id="status" name="status" defaultValue={lot?.status ?? 'received'} className="w-full rounded-md border border-ap-cream-300 bg-transparent px-3 py-2 text-sm">
                <option value="received">Réceptionné</option>
                <option value="in_production">En production</option>
                <option value="finished">Terminé</option>
                <option value="shipped">Expédié</option>
                <option value="recalled">Rappelé</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input id="quantity" name="quantity" type="number" step="0.01" defaultValue={lot?.quantity ?? ''} className="border-ap-cream-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unité</Label>
              <Input id="unit" name="unit" defaultValue={lot?.unit ?? 'kg'} className="border-ap-cream-300" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="reception_date">Date de réception</Label>
              <Input id="reception_date" name="reception_date" type="date" defaultValue={lot?.reception_date?.split('T')[0] ?? ''} className="border-ap-cream-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dlc">DLC</Label>
              <Input id="dlc" name="dlc" type="date" defaultValue={lot?.dlc?.split('T')[0] ?? ''} className="border-ap-cream-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ddm">DDM</Label>
              <Input id="ddm" name="ddm" type="date" defaultValue={lot?.ddm?.split('T')[0] ?? ''} className="border-ap-cream-300" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="temperature_reception">Température à réception (°C)</Label>
              <Input id="temperature_reception" name="temperature_reception" type="number" step="0.1" defaultValue={lot?.temperature_reception ?? ''} className="border-ap-cream-300" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input id="visual_check_ok" name="visual_check_ok" type="checkbox" defaultChecked={lot?.visual_check_ok ?? false} className="rounded border-ap-cream-300" />
              <Label htmlFor="visual_check_ok">Contrôle visuel OK</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea id="notes" name="notes" defaultValue={lot?.notes ?? ''} rows={3} className="w-full rounded-md border border-ap-cream-300 bg-transparent px-3 py-2 text-sm" />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="border-ap-cream-300">Annuler</Button>
            <Button type="submit" disabled={loading} className="bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800">
              {loading ? 'Enregistrement...' : lot ? 'Mettre à jour' : 'Créer le lot'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
