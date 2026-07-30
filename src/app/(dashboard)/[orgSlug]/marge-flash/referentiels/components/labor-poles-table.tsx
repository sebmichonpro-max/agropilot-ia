'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { createLaborPole, updateLaborPole, deleteLaborPole } from '../../actions'
import { formatCents } from '../../lib/cost-calculations'

interface LaborPolesTableProps {
  orgSlug: string
  items: Array<{ id: string; name: string; default_headcount: number; hourly_rate_cents: number; display_order: number }>
}

export function LaborPolesTable({ orgSlug, items: initial }: LaborPolesTableProps) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState({ name: '', headcount: '1', rate: '', order: '0' })
  const [adding, setAdding] = useState(false)
  const [newData, setNewData] = useState({ name: '', headcount: '1', rate: '', order: '0' })

  function startEdit(item: typeof items[0]) {
    setEditing(item.id)
    setEditData({
      name: item.name,
      headcount: String(item.default_headcount),
      rate: (item.hourly_rate_cents / 100).toFixed(2),
      order: String(item.display_order),
    })
  }

  function handleSave(id: string) {
    startTransition(async () => {
      const res = await updateLaborPole(orgSlug, id, {
        name: editData.name,
        default_headcount: parseInt(editData.headcount) || 1,
        hourly_rate_cents: Math.round(parseFloat(editData.rate) * 100),
        display_order: parseInt(editData.order) || 0,
      })
      if (res.error) { toast.error(res.error); return }
      toast.success('Pôle mis à jour')
      setEditing(null)
      router.refresh()
    })
  }

  function handleAdd() {
    if (!newData.name || !newData.rate) { toast.error('Nom et taux requis'); return }
    startTransition(async () => {
      const res = await createLaborPole(orgSlug, {
        name: newData.name,
        default_headcount: parseInt(newData.headcount) || 1,
        hourly_rate_cents: Math.round(parseFloat(newData.rate) * 100),
        display_order: parseInt(newData.order) || 0,
      })
      if (res.error) { toast.error(res.error); return }
      toast.success('Pôle ajouté')
      setAdding(false)
      setNewData({ name: '', headcount: '1', rate: '', order: '0' })
      router.refresh()
    })
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer "${name}" ?`)) return
    startTransition(async () => {
      await deleteLaborPole(orgSlug, id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Pôle supprimé')
    })
  }

  const totalCostPerHour = items.reduce((sum, p) => sum + p.default_headcount * p.hourly_rate_cents, 0)

  return (
    <div className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-ap-cream-200">
        <div>
          <h3 className="text-sm font-medium text-ap-green-900">Pôles MO ({items.length})</h3>
          <p className="text-xs text-ap-cream-700">Coût total/heure : {formatCents(totalCostPerHour)}</p>
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ap-green-900 text-ap-green-100 text-sm font-medium hover:bg-ap-green-800 transition-colors">
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ap-cream-300">
              <th className="text-left px-4 py-2 text-ap-cream-700 font-normal">Pôle</th>
              <th className="text-right px-4 py-2 text-ap-cream-700 font-normal">Effectif</th>
              <th className="text-right px-4 py-2 text-ap-cream-700 font-normal">Taux horaire</th>
              <th className="text-right px-4 py-2 text-ap-cream-700 font-normal">Coût/h</th>
              <th className="w-20 px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {adding && (
              <tr className="border-b border-ap-cream-200 bg-ap-green-50">
                <td className="px-4 py-2"><input value={newData.name} onChange={(e) => setNewData({ ...newData, name: e.target.value })} className="w-full rounded border border-ap-cream-300 px-2 py-1 text-sm" placeholder="Nom du pôle" /></td>
                <td className="px-4 py-2"><input type="number" min="1" value={newData.headcount} onChange={(e) => setNewData({ ...newData, headcount: e.target.value })} className="w-16 rounded border border-ap-cream-300 px-2 py-1 text-sm text-right" /></td>
                <td className="px-4 py-2"><input type="number" step="0.01" value={newData.rate} onChange={(e) => setNewData({ ...newData, rate: e.target.value })} className="w-20 rounded border border-ap-cream-300 px-2 py-1 text-sm text-right" placeholder="0.00" /></td>
                <td className="px-4 py-2 text-right text-ap-cream-600">—</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <button onClick={handleAdd} disabled={isPending} className="p-1 rounded hover:bg-ap-green-100 text-ap-green-700"><Save className="h-4 w-4" /></button>
                    <button onClick={() => setAdding(false)} className="p-1 rounded hover:bg-red-50 text-ap-cream-600 text-xs">✕</button>
                  </div>
                </td>
              </tr>
            )}
            {items.map((item) => {
              if (editing === item.id) {
                return (
                  <tr key={item.id} className="border-b border-ap-cream-200 bg-ap-cream-100">
                    <td className="px-4 py-2"><input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full rounded border border-ap-cream-300 px-2 py-1 text-sm" /></td>
                    <td className="px-4 py-2"><input type="number" min="1" value={editData.headcount} onChange={(e) => setEditData({ ...editData, headcount: e.target.value })} className="w-16 rounded border border-ap-cream-300 px-2 py-1 text-sm text-right" /></td>
                    <td className="px-4 py-2"><input type="number" step="0.01" value={editData.rate} onChange={(e) => setEditData({ ...editData, rate: e.target.value })} className="w-20 rounded border border-ap-cream-300 px-2 py-1 text-sm text-right" /></td>
                    <td className="px-4 py-2 text-right text-ap-cream-600">—</td>
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
                  <td className="px-4 py-2 text-ap-green-900 font-medium">{item.name}</td>
                  <td className="text-right px-4 py-2 text-ap-cream-800">{item.default_headcount}</td>
                  <td className="text-right px-4 py-2 text-ap-cream-800">{formatCents(item.hourly_rate_cents)}/h</td>
                  <td className="text-right px-4 py-2 font-medium text-ap-green-900">{formatCents(item.default_headcount * item.hourly_rate_cents)}/h</td>
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
