'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createCategory, deleteCategory } from '../../actions'

interface CategoriesTableProps {
  orgSlug: string
  items: Array<{ id: string; name: string }>
}

export function CategoriesTable({ orgSlug, items: initial }: CategoriesTableProps) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [newName, setNewName] = useState('')

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    startTransition(async () => {
      const res = await createCategory(orgSlug, { name: newName.trim() })
      if (res.error) { toast.error(res.error); return }
      toast.success('Catégorie ajoutée')
      setNewName('')
      router.refresh()
    })
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer "${name}" ?`)) return
    startTransition(async () => {
      await deleteCategory(orgSlug, id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Catégorie supprimée')
    })
  }

  return (
    <div className="rounded-xl border border-ap-cream-200 bg-white p-5 space-y-4">
      <h3 className="text-sm font-medium text-ap-green-900">Catégories produits ({items.length})</h3>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nouvelle catégorie (salade, taboulé, wrap…)"
          className="flex-1 rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ap-green-500"
        />
        <button type="submit" disabled={isPending} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-ap-green-900 text-ap-green-100 text-sm font-medium hover:bg-ap-green-800 transition-colors disabled:opacity-50">
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </form>

      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-ap-cream-100 transition-colors">
            <span className="text-sm text-ap-green-900">{item.name}</span>
            <button onClick={() => handleDelete(item.id, item.name)} disabled={isPending} className="p-1 rounded hover:bg-red-50 text-ap-cream-600 hover:text-red-600 transition-colors disabled:opacity-50">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-ap-cream-600 text-center py-4">Aucune catégorie</p>}
      </div>
    </div>
  )
}
