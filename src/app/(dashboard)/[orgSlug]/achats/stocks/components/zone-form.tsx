'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { STORAGE_TYPE_LABELS, THERMAL_FACTORS } from '@/modules/km/constants'
import type { StorageType } from '@/modules/km/types'
import { createStorageZone } from '../actions'

interface ZoneFormProps {
  orgSlug: string
}

export function ZoneForm({ orgSlug }: ZoneFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [storageType, setStorageType] = useState<StorageType>('ambient')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await createStorageZone(orgSlug, formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Zone de stockage créée')
      router.push(`/${orgSlug}/achats/stocks/zones`)
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelle zone de stockage</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la zone</Label>
            <Input
              id="name"
              name="name"
              placeholder="Chambre froide 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storage_type">Type de stockage</Label>
            <select
              id="storage_type"
              name="storage_type"
              value={storageType}
              onChange={(e) => {
                const st = e.target.value as StorageType
                setStorageType(st)
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {(Object.entries(STORAGE_TYPE_LABELS) as [StorageType, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature_min">Temp. min (°C)</Label>
              <Input
                id="temperature_min"
                name="temperature_min"
                type="number"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature_max">Temp. max (°C)</Label>
              <Input
                id="temperature_max"
                name="temperature_max"
                type="number"
                step="0.1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thermal_factor">
              Facteur thermique (×100 : {THERMAL_FACTORS[storageType]})
            </Label>
            <Input
              id="thermal_factor"
              name="thermal_factor"
              type="number"
              defaultValue={THERMAL_FACTORS[storageType]}
              key={storageType}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily_cost_cents">
              Coût journalier (centimes €/jour)
            </Label>
            <Input
              id="daily_cost_cents"
              name="daily_cost_cents"
              type="number"
              placeholder="1500"
              required
            />
            <p className="text-xs text-muted-foreground">
              Ex : 1500 = 15,00 €/jour
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity_pallets">
              Capacité (nombre de palettes)
            </Label>
            <Input
              id="capacity_pallets"
              name="capacity_pallets"
              type="number"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Création...' : 'Créer la zone'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
