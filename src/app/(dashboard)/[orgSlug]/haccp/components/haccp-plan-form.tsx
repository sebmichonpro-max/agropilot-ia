'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { createHaccpPlan, updateHaccpPlan } from '../actions'
import type { HaccpPlan } from '@/types/database'

interface HaccpPlanFormProps {
  orgSlug: string
  plan?: HaccpPlan | null
}

export function HaccpPlanForm({ orgSlug, plan }: HaccpPlanFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    const result = plan
      ? await updateHaccpPlan(orgSlug, plan.id, data)
      : await createHaccpPlan(orgSlug, data)

    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(plan ? 'Plan mis à jour' : 'Plan HACCP créé')
    if (!plan && 'id' in result && result.id) {
      router.push(`/${orgSlug}/haccp/${result.id}`)
    } else {
      router.refresh()
    }
  }

  return (
    <Card className="border-ap-cream-200 rounded-xl">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du plan HACCP *</Label>
            <Input id="name" name="name" defaultValue={plan?.name ?? ''} required className="border-ap-cream-300" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="process_description">Description du procédé</Label>
            <textarea
              id="process_description"
              name="process_description"
              defaultValue={plan?.process_description ?? ''}
              rows={4}
              placeholder="Décrivez les étapes du procédé de fabrication..."
              className="w-full rounded-md border border-ap-cream-300 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="border-ap-cream-300">Annuler</Button>
            <Button type="submit" disabled={loading} className="bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800">
              {loading ? 'Enregistrement...' : plan ? 'Mettre à jour' : 'Créer le plan'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
