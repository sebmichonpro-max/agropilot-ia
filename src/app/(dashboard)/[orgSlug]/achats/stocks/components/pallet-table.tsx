'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { KmBadge } from './km-badge'
import { formatWeight, formatDays } from '@/modules/km/formatters'
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
    <Card className="border-ap-cream-200 rounded-xl">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm font-medium text-ap-green-900">
            Palettes ({filtered.length})
          </CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Rechercher..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-8 w-[200px] border-ap-cream-300 focus:ring-ap-green-500 focus:border-ap-green-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-lg border border-ap-cream-300 bg-white px-2 text-sm text-ap-cream-800"
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
              <tr className="border-b border-ap-cream-300 text-left text-ap-cream-700">
                <th className="pb-2 pr-4 font-normal">Référence</th>
                <th className="pb-2 pr-4 font-normal hidden sm:table-cell">Zone</th>
                <th className="pb-2 pr-4 font-normal hidden md:table-cell">Lot</th>
                <th className="pb-2 pr-4 font-normal">Quantité</th>
                <th className="pb-2 pr-4 font-normal hidden lg:table-cell">Jours</th>
                <th className="pb-2 pr-4 font-normal">Km</th>
                <th className="pb-2 font-normal hidden sm:table-cell">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.pallet.id} className="border-b border-ap-cream-200 last:border-0 hover:bg-ap-cream-100 transition-colors">
                  <td className="py-2 pr-4">
                    <Link
                      href={`/${orgSlug}/achats/stocks/palettes/${p.pallet.id}`}
                      className="font-medium text-ap-green-700 hover:text-ap-green-900 hover:underline"
                    >
                      {p.reference.name}
                    </Link>
                    <span className="block text-xs text-ap-cream-700">
                      {p.reference.code}
                    </span>
                  </td>
                  <td className="py-2 pr-4 hidden sm:table-cell text-ap-cream-800">
                    {p.zone.name}
                  </td>
                  <td className="py-2 pr-4 hidden md:table-cell text-ap-cream-700">
                    {p.pallet.lot_number ?? '—'}
                  </td>
                  <td className="py-2 pr-4 text-ap-green-900">
                    {formatWeight(p.pallet.current_quantity)}
                    <span className="text-xs text-ap-cream-700 block">
                      / {formatWeight(p.pallet.initial_quantity)}
                    </span>
                  </td>
                  <td className="py-2 pr-4 hidden lg:table-cell text-ap-cream-800">
                    {formatDays(p.result.daysInStock)}
                  </td>
                  <td className="py-2 pr-4">
                    <KmBadge
                      value={p.result.value}
                      level={p.result.level}
                    />
                  </td>
                  <td className="py-2 hidden sm:table-cell text-ap-cream-700">
                    {PALLET_STATUS_LABELS[p.pallet.status] ?? p.pallet.status}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-ap-cream-700">
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
