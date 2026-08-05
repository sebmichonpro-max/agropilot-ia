'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, ScanLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Lot, LotStatus } from '@/types/database'

const STATUS_LABELS: Record<LotStatus, string> = {
  received: 'Réceptionné',
  in_production: 'En production',
  finished: 'Terminé',
  shipped: 'Expédié',
  recalled: 'Rappelé',
}

const STATUS_COLORS: Record<LotStatus, string> = {
  received: 'bg-blue-100 text-blue-800',
  in_production: 'bg-yellow-100 text-yellow-800',
  finished: 'bg-ap-green-100 text-ap-green-800',
  shipped: 'bg-purple-100 text-purple-800',
  recalled: 'bg-red-100 text-red-800',
}

interface LotListProps {
  lots: Lot[]
  orgSlug: string
}

export function LotList({ lots, orgSlug }: LotListProps) {
  const [search, setSearch] = useState('')

  const filtered = lots.filter((l) =>
    l.lot_number.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ap-cream-500" />
          <Input
            placeholder="Rechercher un lot..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-ap-cream-300"
          />
        </div>
        <Link href={`/${orgSlug}/tracabilite/nouveau`}>
          <Button className="bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau lot
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-ap-cream-200 rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ScanLine className="h-12 w-12 text-ap-cream-400 mb-4" />
            <p className="text-ap-cream-700">
              {search ? 'Aucun lot trouvé' : 'Aucun lot enregistré'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((lot) => (
            <Link key={lot.id} href={`/${orgSlug}/tracabilite/${lot.id}`}>
              <Card className="border-ap-cream-200 rounded-xl hover:border-ap-green-300 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-medium text-ap-green-900">
                        {lot.lot_number}
                      </span>
                      <Badge className={`${STATUS_COLORS[lot.status]} border-0`}>
                        {STATUS_LABELS[lot.status]}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-ap-cream-600">
                      {lot.reception_date && <span>Reçu le {new Date(lot.reception_date).toLocaleDateString('fr-FR')}</span>}
                      {lot.dlc && <span>DLC: {new Date(lot.dlc).toLocaleDateString('fr-FR')}</span>}
                      {lot.quantity && <span>{lot.quantity} {lot.unit}</span>}
                    </div>
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
