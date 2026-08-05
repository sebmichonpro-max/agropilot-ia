'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { NonConformity, NcStatus, NcSeverity } from '@/types/database'

const STATUS_LABELS: Record<NcStatus, string> = {
  open: 'Ouverte',
  analysis: 'En analyse',
  action: 'Action en cours',
  verification: 'Vérification',
  closed: 'Clôturée',
}

const STATUS_COLORS: Record<NcStatus, string> = {
  open: 'bg-red-100 text-red-800',
  analysis: 'bg-yellow-100 text-yellow-800',
  action: 'bg-blue-100 text-blue-800',
  verification: 'bg-purple-100 text-purple-800',
  closed: 'bg-ap-green-100 text-ap-green-800',
}

const SEVERITY_LABELS: Record<NcSeverity, string> = {
  minor: 'Mineure',
  major: 'Majeure',
  critical: 'Critique',
}

const SEVERITY_COLORS: Record<NcSeverity, string> = {
  minor: 'bg-yellow-100 text-yellow-800',
  major: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

interface NcListProps {
  nonConformities: NonConformity[]
  orgSlug: string
}

export function NcList({ nonConformities, orgSlug }: NcListProps) {
  const [search, setSearch] = useState('')

  const filtered = nonConformities.filter((nc) =>
    nc.title.toLowerCase().includes(search.toLowerCase()) ||
    nc.nc_number.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ap-cream-500" />
          <Input
            placeholder="Rechercher une NC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-ap-cream-300"
          />
        </div>
        <Link href={`/${orgSlug}/non-conformites/nouveau`}>
          <Button className="bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800">
            <Plus className="mr-2 h-4 w-4" />
            Déclarer une NC
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-ap-cream-200 rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-ap-cream-400 mb-4" />
            <p className="text-ap-cream-700">
              {search ? 'Aucune NC trouvée' : 'Aucune non-conformité déclarée'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((nc) => (
            <Link key={nc.id} href={`/${orgSlug}/non-conformites/${nc.id}`}>
              <Card className="border-ap-cream-200 rounded-xl hover:border-ap-green-300 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-ap-cream-600">{nc.nc_number}</span>
                        <Badge className={`${SEVERITY_COLORS[nc.severity]} border-0`}>
                          {SEVERITY_LABELS[nc.severity]}
                        </Badge>
                      </div>
                      <h3 className="mt-1 font-medium text-ap-green-900 truncate">{nc.title}</h3>
                      <p className="mt-1 text-sm text-ap-cream-700 line-clamp-1">{nc.description}</p>
                    </div>
                    <Badge className={`${STATUS_COLORS[nc.status]} border-0 shrink-0`}>
                      {STATUS_LABELS[nc.status]}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-ap-cream-600">
                    <span>Créée le {new Date(nc.created_at).toLocaleDateString('fr-FR')}</span>
                    {nc.deadline && <span>Échéance: {new Date(nc.deadline).toLocaleDateString('fr-FR')}</span>}
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
