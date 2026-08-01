'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { PrevProduct, PrevRecipe, PrevLine } from '@/types/database'
import { createPrevProduct, updatePrevProduct, deletePrevProduct } from '../../actions'

interface ConfigPrevProductsProps {
  orgSlug: string
  products: PrevProduct[]
  recipes: PrevRecipe[]
  lines: PrevLine[]
}

export function ConfigPrevProducts({ orgSlug, products, recipes, lines }: ConfigPrevProductsProps) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [recipeId, setRecipeId] = useState('')
  const [weightGrams, setWeightGrams] = useState('')
  const [formatLabel, setFormatLabel] = useState('')
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([])

  function openCreate() {
    setEditId(null)
    setCode('')
    setLabel('')
    setRecipeId(recipes[0]?.id ?? '')
    setWeightGrams('')
    setFormatLabel('')
    setSelectedLineIds([])
    setShowForm(true)
  }

  function openEdit(p: PrevProduct) {
    setEditId(p.id)
    setCode(p.code)
    setLabel(p.label)
    setRecipeId(p.recipe_id)
    setWeightGrams(String(p.weight_grams))
    setFormatLabel(p.format_label)
    setSelectedLineIds(p.compatible_line_ids ?? [])
    setShowForm(true)
  }

  function toggleLine(lineId: string) {
    setSelectedLineIds((prev) =>
      prev.includes(lineId) ? prev.filter((id) => id !== lineId) : [...prev, lineId],
    )
  }

  function handleSubmit() {
    if (!code.trim() || !label.trim() || !recipeId || !weightGrams || !formatLabel.trim()) return

    const input = {
      code: code.trim(),
      label: label.trim(),
      recipe_id: recipeId,
      weight_grams: parseInt(weightGrams),
      format_label: formatLabel.trim(),
      compatible_line_ids: selectedLineIds.length > 0 ? selectedLineIds : null,
    }

    startTransition(async () => {
      const result = editId
        ? await updatePrevProduct(orgSlug, editId, input)
        : await createPrevProduct(orgSlug, input)
      if ('error' in result) toast.error(result.error)
      else {
        toast.success(editId ? 'Produit mis à jour' : 'Produit créé')
        setShowForm(false)
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deletePrevProduct(orgSlug, id)
      if ('error' in result) toast.error(result.error)
      else toast.success('Produit supprimé')
    })
  }

  const recipeMap = new Map(recipes.map((r) => [r.id, r]))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ap-cream-700">{products.length} produit(s) / SKU</p>
        <Button onClick={openCreate} className="gap-2" disabled={recipes.length === 0}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      {recipes.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4 text-sm text-amber-800">
          Créez d&apos;abord des recettes avant d&apos;ajouter des produits.
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border border-ap-cream-200 bg-white p-5 mb-4">
          <h3 className="text-lg font-medium text-ap-green-900 mb-4">
            {editId ? 'Modifier le produit' : 'Nouveau produit'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="prodCode">Code</Label>
              <Input id="prodCode" value={code} onChange={(e) => setCode(e.target.value)} className="mt-1" placeholder="FRE-TAB-400" />
            </div>
            <div>
              <Label htmlFor="prodLabel">Libellé</Label>
              <Input id="prodLabel" value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1" placeholder="Taboulé Fresh 400g" />
            </div>
            <div>
              <Label htmlFor="prodRecipe">Recette</Label>
              <select id="prodRecipe" value={recipeId} onChange={(e) => setRecipeId(e.target.value)} className="mt-1 w-full rounded-md border border-ap-cream-300 px-3 py-2 text-sm">
                {recipes.map((r) => <option key={r.id} value={r.id}>{r.code} — {r.name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="prodWeight">Poids pièce (g)</Label>
              <Input id="prodWeight" type="number" min="1" value={weightGrams} onChange={(e) => setWeightGrams(e.target.value)} className="mt-1" placeholder="400" />
            </div>
            <div>
              <Label htmlFor="prodFormat">Format</Label>
              <Input id="prodFormat" value={formatLabel} onChange={(e) => setFormatLabel(e.target.value)} className="mt-1" placeholder="400g" />
            </div>
          </div>
          {lines.length > 0 && (
            <div className="mb-4">
              <Label>Lignes compatibles</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {lines.map((line) => (
                  <button
                    key={line.id}
                    type="button"
                    onClick={() => toggleLine(line.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedLineIds.includes(line.id)
                        ? 'bg-ap-green-900 text-white'
                        : 'bg-ap-cream-100 text-ap-cream-700 hover:bg-ap-cream-200'
                    }`}
                  >
                    {line.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isPending}>{editId ? 'Modifier' : 'Créer'}</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ap-cream-300">
                <th className="text-left px-4 py-3 text-ap-cream-700 font-normal">Code</th>
                <th className="text-left px-4 py-3 text-ap-cream-700 font-normal">Libellé</th>
                <th className="text-left px-4 py-3 text-ap-cream-700 font-normal hidden md:table-cell">Recette</th>
                <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">Poids</th>
                <th className="text-left px-4 py-3 text-ap-cream-700 font-normal hidden lg:table-cell">Format</th>
                <th className="text-right px-4 py-3 text-ap-cream-700 font-normal w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-ap-cream-200 hover:bg-ap-cream-100">
                  <td className="px-4 py-3 text-ap-cream-600 font-mono text-xs">{p.code}</td>
                  <td className="px-4 py-3 text-ap-green-900 font-medium">{p.label}</td>
                  <td className="px-4 py-3 text-ap-cream-700 hidden md:table-cell">{recipeMap.get(p.recipe_id)?.name ?? '?'}</td>
                  <td className="px-4 py-3 text-right text-ap-cream-700">{p.weight_grams}g</td>
                  <td className="px-4 py-3 text-ap-cream-700 hidden lg:table-cell">{p.format_label}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-ap-cream-200 text-ap-cream-700" aria-label="Modifier"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-ap-cream-600">Aucun produit configuré.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
