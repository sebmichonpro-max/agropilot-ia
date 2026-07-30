'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { addRecipeLine, removeRecipeLine } from '../../actions'
import { formatCents } from '../../lib/cost-calculations'
import { RECIPE_UNITS } from '../../lib/unit-conversions'

interface RecipeEditorProps {
  orgSlug: string
  sheetId: string
  lines: Array<{
    id: string
    ingredient_id: string
    quantity: number
    unit: string
    line_cost_cents: number | null
    ingredients: { name: string; price_cents: number; unit: string } | null
  }>
  ingredients: Array<{ id: string; name: string; price_cents: number; unit: string }>
}

export function RecipeEditor({ orgSlug, sheetId, lines, ingredients }: RecipeEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [ingredientId, setIngredientId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('g')

  const totalMp = lines.reduce((sum, l) => sum + (l.line_cost_cents ?? 0), 0)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!ingredientId || !quantity) { toast.error('Sélectionnez un ingrédient et une quantité'); return }
    startTransition(async () => {
      const res = await addRecipeLine(orgSlug, {
        product_sheet_id: sheetId,
        ingredient_id: ingredientId,
        quantity: parseInt(quantity),
        unit,
      })
      if (res.error) { toast.error(res.error); return }
      toast.success('Ingrédient ajouté')
      setIngredientId('')
      setQuantity('')
      router.refresh()
    })
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeRecipeLine(orgSlug, id, sheetId)
      toast.success('Ligne supprimée')
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-ap-cream-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-ap-green-900">Nomenclature matières premières</h3>
        <span className="text-sm font-medium text-ap-green-900">Total MP : {formatCents(totalMp)}</span>
      </div>

      {lines.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ap-cream-300">
              <th className="text-left px-3 py-2 text-ap-cream-700 font-normal">Ingrédient</th>
              <th className="text-right px-3 py-2 text-ap-cream-700 font-normal">Quantité</th>
              <th className="text-right px-3 py-2 text-ap-cream-700 font-normal">Prix/unité</th>
              <th className="text-right px-3 py-2 text-ap-cream-700 font-normal">Coût</th>
              <th className="w-10 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="border-b border-ap-cream-200">
                <td className="px-3 py-2 text-ap-green-900 font-medium">{l.ingredients?.name ?? '—'}</td>
                <td className="text-right px-3 py-2 text-ap-cream-800">{l.quantity} {l.unit}</td>
                <td className="text-right px-3 py-2 text-ap-cream-800">
                  {l.ingredients ? formatCents(l.ingredients.price_cents) + '/' + l.ingredients.unit : '—'}
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
          <label className="block text-xs text-ap-cream-700 mb-1">Ingrédient</label>
          <select
            value={ingredientId}
            onChange={(e) => setIngredientId(e.target.value)}
            className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">— Choisir —</option>
            {ingredients.map((ing) => (
              <option key={ing.id} value={ing.id}>{ing.name} ({formatCents(ing.price_cents)}/{ing.unit})</option>
            ))}
          </select>
        </div>
        <div className="w-24">
          <label className="block text-xs text-ap-cream-700 mb-1">Quantité</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
            placeholder="150"
          />
        </div>
        <div className="w-20">
          <label className="block text-xs text-ap-cream-700 mb-1">Unité</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
          >
            {RECIPE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
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
