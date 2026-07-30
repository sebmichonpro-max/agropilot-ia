'use client'

import Link from 'next/link'
import type { MarginLevel } from '@/types/database'
import { formatCents, formatBps } from '../lib/cost-calculations'
import { MarginBadge } from './margin-badge'

interface Sheet {
  id: string
  name: string
  mp_cost_cents: number | null
  packaging_cost_cents: number | null
  labor_cost_cents: number | null
  total_cost_cents: number | null
  selling_price_cents: number | null
  margin_cents: number | null
  margin_rate_bps: number | null
  margin_level: string | null
  product_categories: { name: string } | null
  customers: { name: string } | null
}

interface ProductsMarginTableProps {
  sheets: Sheet[]
  orgSlug: string
}

export function ProductsMarginTable({ sheets, orgSlug }: ProductsMarginTableProps) {
  if (sheets.length === 0) {
    return (
      <div className="rounded-xl border border-ap-cream-200 bg-white p-8 text-center">
        <p className="text-ap-cream-600">Aucune fiche produit. Commencez par en créer une.</p>
        <Link
          href={`/${orgSlug}/marge-flash/produits/nouveau`}
          className="inline-block mt-3 px-4 py-2 rounded-lg bg-ap-green-900 text-ap-green-100 text-sm font-medium hover:bg-ap-green-800 transition-colors"
        >
          Créer une fiche
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ap-cream-300">
              <th className="text-left px-4 py-3 text-ap-cream-700 font-normal">Produit</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal hidden md:table-cell">MP</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal hidden md:table-cell">Packaging</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal hidden md:table-cell">MO</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">Coût total</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">PV</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">Marge</th>
              <th className="text-center px-4 py-3 text-ap-cream-700 font-normal">Statut</th>
            </tr>
          </thead>
          <tbody>
            {sheets.map((s) => (
              <tr key={s.id} className="border-b border-ap-cream-200 hover:bg-ap-cream-100 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/${orgSlug}/marge-flash/produits/${s.id}`} className="text-ap-green-900 font-medium hover:underline">
                    {s.name}
                  </Link>
                  {s.product_categories?.name && (
                    <span className="ml-2 text-xs text-ap-cream-600">{s.product_categories.name}</span>
                  )}
                </td>
                <td className="text-right px-4 py-3 text-ap-cream-800 hidden md:table-cell">{s.mp_cost_cents != null ? formatCents(s.mp_cost_cents) : '—'}</td>
                <td className="text-right px-4 py-3 text-ap-cream-800 hidden md:table-cell">{s.packaging_cost_cents != null ? formatCents(s.packaging_cost_cents) : '—'}</td>
                <td className="text-right px-4 py-3 text-ap-cream-800 hidden md:table-cell">{s.labor_cost_cents != null ? formatCents(s.labor_cost_cents) : '—'}</td>
                <td className="text-right px-4 py-3 font-medium text-ap-green-900">{s.total_cost_cents != null ? formatCents(s.total_cost_cents) : '—'}</td>
                <td className="text-right px-4 py-3 text-ap-cream-800">{s.selling_price_cents != null ? formatCents(s.selling_price_cents) : '—'}</td>
                <td className="text-right px-4 py-3 font-medium text-ap-green-900">
                  {s.margin_rate_bps != null ? formatBps(s.margin_rate_bps) : '—'}
                </td>
                <td className="text-center px-4 py-3">
                  <MarginBadge level={s.margin_level as MarginLevel | null} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
