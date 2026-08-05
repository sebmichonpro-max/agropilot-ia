'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Audit, AuditStatus, AuditType } from '@/types/database'

const STATUS_LABELS: Record<AuditStatus, string> = {
  planned: 'Planifié',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
}

const STATUS_COLORS: Record<AuditStatus, string> = {
  planned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-ap-green-100 text-ap-green-800',
  cancelled: 'bg-ap-cream-200 text-ap-cream-600',
}

const TYPE_LABELS: Record<AuditType, string> = {
  internal: 'Interne',
  client: 'Client',
  certification: 'Certification',
}

interface AuditListProps {
  audits: Audit[]
  orgSlug: string
}

export function AuditList({ audits, orgSlug }: AuditListProps) {
  const [search, setSearch] = useState('')

  const filtered = audits.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.audit_number.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ap-cream-500" />
          <Input
            placeholder="Rechercher un audit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-ap-cream-300"
          />
        </div>
        <Link href={`/${orgSlug}/audits/nouveau`}>
          <Button className="bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800">
            <Plus className="mr-2 h-4 w-4" />
            Planifier un audit
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-ap-cream-200 rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardCheck className="h-12 w-12 text-ap-cream-400 mb-4" />
            <p className="text-ap-cream-700">
              {search ? 'Aucun audit trouvé' : 'Aucun audit planifié'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((audit) => (
            <Link key={audit.id} href={`/${orgSlug}/audits/${audit.id}`}>
              <Card className="border-ap-cream-200 rounded-xl hover:border-ap-green-300 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-ap-cream-600">{audit.audit_number}</span>
                        <Badge className="bg-ap-cream-100 text-ap-cream-700 border-0">
                          {TYPE_LABELS[audit.audit_type]}
                        </Badge>
                      </div>
                      <h3 className="mt-1 font-medium text-ap-green-900 truncate">{audit.title}</h3>
                    </div>
                    <Badge className={`${STATUS_COLORS[audit.status]} border-0 shrink-0`}>
                      {STATUS_LABELS[audit.status]}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-ap-cream-600">
                    <span>Prévu le {new Date(audit.planned_date).toLocaleDateString('fr-FR')}</span>
                    {audit.auditor_name && <span>Auditeur: {audit.auditor_name}</span>}
                    {audit.overall_score !== null && <span>Score: {audit.overall_score}%</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
