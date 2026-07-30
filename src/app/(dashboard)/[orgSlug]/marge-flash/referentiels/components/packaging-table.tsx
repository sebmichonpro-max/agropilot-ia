'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { createPackagingItem, updatePackagingItem, deletePackagingItem } from '../../actions'
import { formatCents } from '../../lib/cost-calculations'
import { PACKAGING_UNITS } from '../../lib/unit-conversions'

interface PackagingTableProps {
  orgSlug: string
  items: Array<{
    id: string; name: string; packaging_type: string | null; unit: string
    unit_price_cents: number; supplier: string | null; price_updated_at: string
  }>
}

export function PackagingTable({ orgSlug, items: initial }: PackagingTableProps) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState({ name: '', packaging_type: '', unit: 'pièce', price: '', supplier: '' })
  const [adding, setAdding] = useState(false)
  const [newData, setNewData] = useState({ name: '', packaging_type: '', unit: 'pièce', price: '', supplier: '' })

  const STALE_MS = 30 * 24 * 60 * 60 * 1000
  const now = useMemo(() => Date.now(), [])

  function startEdit(item: typeof items[0]) {
    setEditing(item.id)
    setEditData({
      name: item.name,
      packaging_type: item.packaging_type ?? '',
      unit: item.unit,
      price: (item.unit_price_cents / 100).toFixed(2),
      supplier: item.supplier ?? '',
    })
  }

  function handleSave(id: string) {
    startTransition(async () => {
      const res = await updatePackagingItem(orgSlug, id, {
        name: editData.name,
        packaging_type: editData.packaging_type || null,
        unit: editData.unit,
        unit_price_cents: Math.round(parseFloat(editData.price) * 100),
        supplier: editData.supplier || null,
      })
      if (res.error) { toast.error(res.error); return }
      toast.success('Composant mis à jour')
      setEditing(null)
      router.refresh()
    })
  }

  function handleAdd() {
    if (!newData.name || !newData.price) { toast.error('Nom et prix requis'); return }
    startTransition(async () => {
      const res = await createPackagingItem(orgSlug, {
        name: newData.name,
        packaging_type: newData.packaging_type || null,
        unit: newData.unit,
        unit_price_cents: Math.round(parseFloat(newData.price) * 100),
        supplier: newData.supplier || null,
      })
      if (res.error) { toast.error(res.error); return }
      toast.success('Composant ajouté')
      setAdding(false)
      setNewData({ name: '', packaging_type: '', unit: 'pièce', price: '', supplier: '' })
      router.refresh()
    })
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer "${name}" ?`)) return
    startTransition(async () => {
      await deletePackagingItem(orgSlug, id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Composant supprimé')
    })
  }

  return (
    <div className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-ap-cream-200">
        <h3 className="text-sm font-medium text-ap-green-900">Packaging ({items.length})</h3>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ap-green-900 text-ap-green-100 text-sm font-medium hover:bg-ap-green-800 transition-colors">
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ap-cream-300">
              <th className="text-left px-4 py-2 text-ap-cream-700 font-normal">Nom</th>
              <th className="text-left px-4 py-2 text-ap-cream-700 font-normal hidden sm:table-cell">Type</th>
              <th className="text-left px-4 py-2 text-ap-cream-700 font-normal">Unité</th>
              <th className="text-right px-4 py-2 text-ap-cream-700 font-normal">Prix unitaire</th>
              <th className="text-left px-4 py-2 text-ap-cream-700 font-normal hidden md:table-cell">Fournisseur</th>
              <th className="w-20 px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {adding && (
              <tr className="border-b border-ap-cream-200 bg-ap-green-50">
                <td className="px-4 py-2"><input value={newData.name} onChange={(e) => setNewData({ ...newData, name: e.target.value })} className="w-full rounded border border-ap-cream-300 px-2 py-1 text-sm" placeholder="Nom" /></td>
                <td className="px-4 py-2 hidden sm:table-cell"><input value={newData.packaging_type} onChange={(e) => setNewData({ ...newData, packaging_type: e.target.value })} className="w-full rounded border border-ap-cream-300 px-2 py-1 text-sm" placeholder="Type" /></td>
                <td className="px-4 py-2">
                  <select value={newData.unit} onChange={(e) => setNewData({ ...newData, unit: e.target.value })} className="rounded border border-ap-cream-300 px-2 py-1 text-sm">
                    {PACKAGING_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2"><input type="number" step="0.01" value={newData.price} onChange={(e) => setNewData({ ...newData, price: e.target.value })} className="w-20 rounded border border-ap-cream-300 px-2 py-1 text-sm text-right" placeholder="0.00" /></td>
                <td className="px-4 py-2 hidden md:table-cell"><input value={newData.supplier} onChange={(e) => setNewData({ ...newData, supplier: e.target.value })} className="w-full rounded border border-ap-cream-300 px-2 py-1 text-sm" placeholder="Fournisseur" /></td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <button onClick={handleAdd} disabled={isPending} className="p-1 rounded hover:bg-ap-green-100 text-ap-green-700"><Save className="h-4 w-4" /></button>
                    <button onClick={() => setAdding(false)} className="p-1 rounded hover:bg-red-50 text-ap-cream-600 text-xs">✕</button>
                  </div>
                </td>
              </tr>
            )}
            {items.map((item) => {
              const isStale = now - new Date(item.price_updated_at).getTime() > STALE_MS
              if (editing === item.id) {
                return (
                  <tr key={item.id} className="border-b border-ap-cream-200 bg-ap-cream-100">
                    <td className="px-4 py-2"><input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full rounded border border-ap-cream-300 px-2 py-1 text-sm" /></td>
                    <td className="px-4 py-2 hidden sm:table-cell"><input value={editData.packaging_type} onChange={(e) => setEditData({ ...editData, packaging_type: e.target.value })} className="w-full rounded border border-ap-cream-300 px-2 py-1 text-sm" /></td>
                    <td className="px-4 py-2">
                      <select value={editData.unit} onChange={(e) => setEditData({ ...editData, unit: e.target.value })} className="rounded border border-ap-cream-300 px-2 py-1 text-sm">
                        {PACKAGING_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2"><input type="number" step="0.01" value={editData.price} onChange={(e) => setEditData({ ...editData, price: e.target.value })} className="w-20 rounded border border-ap-cream-300 px-2 py-1 text-sm text-right" /></td>
                    <td className="px-4 py-2 hidden md:table-cell"><input value={editData.supplier} onChange={(e) => setEditData({ ...editData, supplier: e.target.value })} className="w-full rounded border border-ap-cream-300 px-2 py-1 text-sm" /></td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => handleSave(item.id)} disabled={isPending} className="p-1 rounded hover:bg-ap-green-100 text-ap-green-700"><Save className="h-4 w-4" /></button>
                        <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-red-50 text-ap-cream-600 text-xs">✕</button>
                      </div>
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={item.id} className="border-b border-ap-cream-200 hover:bg-ap-cream-100 transition-colors cursor-pointer" onClick={() => startEdit(item)}>
                  <td className="px-4 py-2 text-ap-green-900 font-medium">
                    {item.name}
                    {isStale && <Clock className="inline h-3.5 w-3.5 ml-1 text-amber-500" />}
                  </td>
                  <td className="px-4 py-2 text-ap-cream-800 hidden sm:table-cell">{item.packaging_type ?? '—'}</td>
                  <td className="px-4 py-2 text-ap-cream-800">{item.unit}</td>
                  <td className="text-right px-4 py-2 font-medium text-ap-green-900">{formatCents(item.unit_price_cents)}/{item.unit}</td>
                  <td className="px-4 py-2 text-ap-cream-800 hidden md:table-cell">{item.supplier ?? '—'}</td>
                  <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleDelete(item.id, item.name)} disabled={isPending} className="p-1 rounded hover:bg-red-50 text-ap-cream-600 hover:text-red-600 transition-colors disabled:opacity-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
