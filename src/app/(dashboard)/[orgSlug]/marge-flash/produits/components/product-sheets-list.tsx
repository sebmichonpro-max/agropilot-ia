'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { MarginLevel } from '@/types/database'
import { formatCents, formatBps } from '../../lib/cost-calculations'
import { MarginBadge } from '../../components/margin-badge'
import { deleteProductSheet } from '../../actions'

interface Sheet {
  id: string
  name: string
  total_cost_cents: number | null
  selling_price_cents: number | null
  margin_rate_bps: number | null
  margin_level: string | null
  product_categories: { name: string } | null
  customers: { name: string } | null
}

interface ProductSheetsListProps {
  sheets: Sheet[]
  categories: Array<{ id: string; name: string }>
  customers: Array<{ id: string; name: string }>
  orgSlug: string
}

export function ProductSheetsList({ sheets: initial, orgSlug }: ProductSheetsListProps) {
  const [sheets, setSheets] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  const filtered = sheets.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer la fiche "${name}" ?`)) return
    startTransition(async () => {
      const res = await deleteProductSheet(orgSlug, id)
      if (res.error) { toast.error(res.error); return }
      setSheets((prev) => prev.filter((s) => s.id !== id))
      toast.success('Fiche supprimée')
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Rechercher un produit…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-ap-green-500"
        />
        <Link
          href={`/${orgSlug}/marge-flash/produits/nouveau`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ap-green-900 text-ap-green-100 text-sm font-medium hover:bg-ap-green-800 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nouvelle fiche
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-ap-cream-200 bg-white p-8 text-center">
          <p className="text-ap-cream-600">
            {sheets.length === 0 ? 'Aucune fiche produit créée.' : 'Aucun résultat.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ap-cream-300">
                  <th className="text-left px-4 py-3 text-ap-cream-700 font-normal">Produit</th>
                  <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">Coût de revient</th>
                  <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">Prix de vente</th>
                  <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">Taux de marge</th>
                  <th className="text-center px-4 py-3 text-ap-cream-700 font-normal">Statut</th>
                  <th className="w-10 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-ap-cream-200 hover:bg-ap-cream-100 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/${orgSlug}/marge-flash/produits/${s.id}`} className="text-ap-green-900 font-medium hover:underline">
                        {s.name}
                      </Link>
                      <div className="flex gap-2 mt-0.5">
                        {s.product_categories?.name && <span className="text-xs text-ap-cream-600">{s.product_categories.name}</span>}
                        {s.customers?.name && <span className="text-xs text-ap-cream-600">• {s.customers.name}</span>}
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 text-ap-cream-800">{s.total_cost_cents != null ? formatCents(s.total_cost_cents) : '—'}</td>
                    <td className="text-right px-4 py-3 text-ap-cream-800">{s.selling_price_cents != null ? formatCents(s.selling_price_cents) : '—'}</td>
                    <td className="text-right px-4 py-3 font-medium text-ap-green-900">{s.margin_rate_bps != null ? formatBps(s.margin_rate_bps) : '—'}</td>
                    <td className="text-center px-4 py-3"><MarginBadge level={s.margin_level as MarginLevel | null} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        disabled={isPending}
                        className="p-1 rounded hover:bg-red-50 text-ap-cream-600 hover:text-red-600 transition-colors disabled:opacity-50"
                        aria-label={`Supprimer ${s.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
