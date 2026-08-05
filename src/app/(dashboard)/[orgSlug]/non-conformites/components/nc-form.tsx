'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { createNonConformity, updateNonConformity, closeNonConformity } from '../actions'
import type { NonConformity } from '@/types/database'

interface NcFormProps {
  orgSlug: string
  nc?: NonConformity | null
}

export function NcForm({ orgSlug, nc }: NcFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    const result = nc
      ? await updateNonConformity(orgSlug, nc.id, data)
      : await createNonConformity(orgSlug, data)

    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(nc ? 'NC mise à jour' : 'NC déclarée')
    if (!nc && 'id' in result && result.id) {
      router.push(`/${orgSlug}/non-conformites/${result.id}`)
    } else {
      router.refresh()
    }
  }

  async function handleClose() {
    if (!nc) return
    setLoading(true)
    const result = await closeNonConformity(orgSlug, nc.id)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('NC clôturée')
      router.refresh()
    }
  }

  return (
    <Card className="border-ap-cream-200 rounded-xl">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {nc && (
            <div className="flex items-center gap-3 pb-2">
              <span className="font-mono text-sm text-ap-cream-600">{nc.nc_number}</span>
              <span className="text-sm text-ap-cream-600">—</span>
              <span className="text-sm font-medium text-ap-green-900 capitalize">{nc.status}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input id="title" name="title" defaultValue={nc?.title ?? ''} required className="border-ap-cream-300" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <textarea id="description" name="description" defaultValue={nc?.description ?? ''} rows={3} required className="w-full rounded-md border border-ap-cream-300 bg-transparent px-3 py-2 text-sm" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="source">Source *</Label>
              <select id="source" name="source" defaultValue={nc?.source ?? 'internal'} className="w-full rounded-md border border-ap-cream-300 bg-transparent px-3 py-2 text-sm">
                <option value="internal">Interne</option>
                <option value="supplier">Fournisseur</option>
                <option value="customer">Client</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Gravité *</Label>
              <select id="severity" name="severity" defaultValue={nc?.severity ?? 'minor'} className="w-full rounded-md border border-ap-cream-300 bg-transparent px-3 py-2 text-sm">
                <option value="minor">Mineure</option>
                <option value="major">Majeure</option>
                <option value="critical">Critique</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="root_cause">Cause racine</Label>
            <textarea id="root_cause" name="root_cause" defaultValue={nc?.root_cause ?? ''} rows={2} placeholder="Analyse 5 Pourquoi, Ishikawa..." className="w-full rounded-md border border-ap-cream-300 bg-transparent px-3 py-2 text-sm" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="corrective_action">Action corrective</Label>
            <textarea id="corrective_action" name="corrective_action" defaultValue={nc?.corrective_action ?? ''} rows={2} className="w-full rounded-md border border-ap-cream-300 bg-transparent px-3 py-2 text-sm" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preventive_action">Action préventive</Label>
            <textarea id="preventive_action" name="preventive_action" defaultValue={nc?.preventive_action ?? ''} rows={2} className="w-full rounded-md border border-ap-cream-300 bg-transparent px-3 py-2 text-sm" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Date limite</Label>
            <Input id="deadline" name="deadline" type="date" defaultValue={nc?.deadline?.split('T')[0] ?? ''} className="border-ap-cream-300" />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            {nc && nc.status !== 'closed' && (
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="border-ap-green-300 text-ap-green-700">
                Clôturer
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => router.back()} className="border-ap-cream-300">Annuler</Button>
            <Button type="submit" disabled={loading} className="bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800">
              {loading ? 'Enregistrement...' : nc ? 'Mettre à jour' : 'Déclarer la NC'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
