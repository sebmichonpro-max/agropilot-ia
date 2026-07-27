'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { KmBadge } from './km-badge'
import { formatWeight, formatDays, formatCurrency } from '@/modules/km/formatters'
import { getKmLevel } from '@/modules/km/calculator'
import { PALLET_STATUS_LABELS } from '@/modules/km/constants'
import type { Pallet, ProductReference, StorageZone, KmResult } from '@/modules/km/types'

interface PalletTableProps {
  orgSlug: string
  pallets: {
    pallet: Pallet
    reference: ProductReference
    zone: StorageZone
    result: KmResult
  }[]
}

export function PalletTable({ orgSlug, pallets }: PalletTableProps) {
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = pallets.filter((p) => {
    const matchesText =
      p.reference.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.reference.code.toLowerCase().includes(filter.toLowerCase()) ||
      (p.pallet.lot_number ?? '').toLowerCase().includes(filter.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || p.pallet.status === statusFilter
    return matchesText && matchesStatus
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm font-medium">
            Palettes ({filtered.length})
          </CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Rechercher..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-8 w-[200px]"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="all">Tous</option>
              <option value="in_stock">En stock</option>
              <option value="empty">Vidée</option>
              <option value="expired">Périmée</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Référence</th>
                <th className="pb-2 pr-4 font-medium hidden sm:table-cell">Zone</th>
                <th className="pb-2 pr-4 font-medium hidden md:table-cell">Lot</th>
                <th className="pb-2 pr-4 font-medium">Quantité</th>
                <th className="pb-2 pr-4 font-medium hidden lg:table-cell">Jours</th>
                <th className="pb-2 pr-4 font-medium">Km</th>
                <th className="pb-2 font-medium hidden sm:table-cell">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.pallet.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">
                    <Link
                      href={`/${orgSlug}/achats/stocks/palettes/${p.pallet.id}`}
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      {p.reference.name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {p.reference.code}
                    </span>
                  </td>
                  <td className="py-2 pr-4 hidden sm:table-cell">
                    {p.zone.name}
                  </td>
                  <td className="py-2 pr-4 hidden md:table-cell text-muted-foreground">
                    {p.pallet.lot_number ?? '—'}
                  </td>
                  <td className="py-2 pr-4">
                    {formatWeight(p.pallet.current_quantity)}
                    <span className="text-xs text-muted-foreground block">
                      / {formatWeight(p.pallet.initial_quantity)}
                    </span>
                  </td>
                  <td className="py-2 pr-4 hidden lg:table-cell">
                    {formatDays(p.result.daysInStock)}
                  </td>
                  <td className="py-2 pr-4">
                    <KmBadge
                      value={p.result.value}
                      level={p.result.level}
                    />
                  </td>
                  <td className="py-2 hidden sm:table-cell text-muted-foreground">
                    {PALLET_STATUS_LABELS[p.pallet.status] ?? p.pallet.status}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Aucune palette trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
