'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { createAudit, updateAudit } from '../actions'
import type { Audit } from '@/types/database'

interface AuditFormProps {
  orgSlug: string
  audit?: Audit | null
}

export function AuditForm({ orgSlug, audit }: AuditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    const result = audit
      ? await updateAudit(orgSlug, audit.id, data)
      : await createAudit(orgSlug, data)

    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(audit ? 'Audit mis à jour' : 'Audit planifié')
    if (!audit && 'id' in result && result.id) {
      router.push(`/${orgSlug}/audits/${result.id}`)
    } else {
      router.refresh()
    }
  }

  return (
    <Card className="border-ap-cream-200 rounded-xl">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input id="title" name="title" defaultValue={audit?.title ?? ''} required className="border-ap-cream-300" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="audit_type">Type d&apos;audit *</Label>
              <select id="audit_type" name="audit_type" defaultValue={audit?.audit_type ?? 'internal'} className="w-full rounded-md border border-ap-cream-300 bg-transparent px-3 py-2 text-sm">
                <option value="internal">Interne</option>
                <option value="client">Client</option>
                <option value="certification">Certification (IFS/BRC)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="planned_date">Date prévue *</Label>
              <Input id="planned_date" name="planned_date" type="date" defaultValue={audit?.planned_date?.split('T')[0] ?? ''} required className="border-ap-cream-300" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auditor_name">Auditeur</Label>
            <Input id="auditor_name" name="auditor_name" defaultValue={audit?.auditor_name ?? ''} className="border-ap-cream-300" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope">Périmètre</Label>
            <textarea id="scope" name="scope" defaultValue={audit?.scope ?? ''} rows={3} placeholder="Décrivez le périmètre de l'audit..." className="w-full rounded-md border border-ap-cream-300 bg-transparent px-3 py-2 text-sm" />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="border-ap-cream-300">Annuler</Button>
            <Button type="submit" disabled={loading} className="bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800">
              {loading ? 'Enregistrement...' : audit ? 'Mettre à jour' : "Planifier l'audit"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
