'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { addPackagingLine, removePackagingLine } from '../../actions'
import { formatCents } from '../../lib/cost-calculations'

interface PackagingEditorProps {
  orgSlug: string
  sheetId: string
  lines: Array<{
    id: string
    packaging_item_id: string
    quantity_per_product: number
    line_cost_cents: number | null
    packaging_items: { name: string; unit_price_cents: number; unit: string } | null
  }>
  packagingItems: Array<{ id: string; name: string; unit_price_cents: number; unit: string }>
}

export function PackagingEditor({ orgSlug, sheetId, lines, packagingItems }: PackagingEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [itemId, setItemId] = useState('')
  const [qty, setQty] = useState('1')

  const totalPkg = lines.reduce((sum, l) => sum + (l.line_cost_cents ?? 0), 0)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!itemId) { toast.error('Sélectionnez un composant'); return }
    startTransition(async () => {
      const res = await addPackagingLine(orgSlug, {
        product_sheet_id: sheetId,
        packaging_item_id: itemId,
        quantity_per_product: parseFloat(qty) || 1,
      })
      if (res.error) { toast.error(res.error); return }
      toast.success('Composant ajouté')
      setItemId('')
      setQty('1')
      router.refresh()
    })
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removePackagingLine(orgSlug, id, sheetId)
      toast.success('Ligne supprimée')
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-ap-cream-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-ap-green-900">Nomenclature packaging</h3>
        <span className="text-sm font-medium text-ap-green-900">Total Packaging : {formatCents(totalPkg)}</span>
      </div>

      {lines.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ap-cream-300">
              <th className="text-left px-3 py-2 text-ap-cream-700 font-normal">Composant</th>
              <th className="text-right px-3 py-2 text-ap-cream-700 font-normal">Qté/produit</th>
              <th className="text-right px-3 py-2 text-ap-cream-700 font-normal">Prix unitaire</th>
              <th className="text-right px-3 py-2 text-ap-cream-700 font-normal">Coût</th>
              <th className="w-10 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="border-b border-ap-cream-200">
                <td className="px-3 py-2 text-ap-green-900 font-medium">{l.packaging_items?.name ?? '—'}</td>
                <td className="text-right px-3 py-2 text-ap-cream-800">{l.quantity_per_product}</td>
                <td className="text-right px-3 py-2 text-ap-cream-800">
                  {l.packaging_items ? formatCents(l.packaging_items.unit_price_cents) + '/' + l.packaging_items.unit : '—'}
                </td>
                <td className="text-right px-3 py-2 font-medium text-ap-green-900">
                  {l.line_cost_cents != null ? formatCents(l.line_cost_cents) : '—'}
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleRemove(l.id)}
                    disabled={isPending}
                    className="p-1 rounded hover:bg-red-50 text-ap-cream-600 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 pt-2 border-t border-ap-cream-200">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs text-ap-cream-700 mb-1">Composant</label>
          <select
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">— Choisir —</option>
            {packagingItems.map((item) => (
              <option key={item.id} value={item.id}>{item.name} ({formatCents(item.unit_price_cents)}/{item.unit})</option>
            ))}
          </select>
        </div>
        <div className="w-28">
          <label className="block text-xs text-ap-cream-700 mb-1">Qté/produit</label>
          <input
            type="number"
            step="0.0001"
            min="0.0001"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-ap-green-900 text-ap-green-100 text-sm font-medium hover:bg-ap-green-800 transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </form>
    </div>
  )
}
