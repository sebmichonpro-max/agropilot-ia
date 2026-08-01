'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { PrevLine } from '@/types/database'
import { createPrevLine, updatePrevLine, deletePrevLine } from '../../actions'

interface ConfigPrevLinesProps {
  orgSlug: string
  lines: PrevLine[]
}

export function ConfigPrevLines({ orgSlug, lines }: ConfigPrevLinesProps) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [weights, setWeights] = useState('')
  const [maxCapacity, setMaxCapacity] = useState('')
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditId(null)
    setName('')
    setWeights('')
    setMaxCapacity('')
    setShowForm(true)
  }

  function openEdit(line: PrevLine) {
    setEditId(line.id)
    setName(line.name)
    setWeights(line.compatible_weights_grams.join(', '))
    setMaxCapacity(line.max_capacity_grams ? String(line.max_capacity_grams / 1000) : '')
    setShowForm(true)
  }

  function handleSubmit() {
    if (!name.trim()) return
    const parsedWeights = weights
      .split(',')
      .map((w) => parseInt(w.trim()))
      .filter((w) => !isNaN(w) && w > 0)
    const capacity = maxCapacity ? Math.round(parseFloat(maxCapacity) * 1000) : null

    const input = {
      name: name.trim(),
      compatible_weights_grams: parsedWeights,
      max_capacity_grams: capacity,
      sort_order: 0,
    }

    startTransition(async () => {
      const result = editId
        ? await updatePrevLine(orgSlug, editId, input)
        : await createPrevLine(orgSlug, input)
      if ('error' in result) toast.error(result.error)
      else {
        toast.success(editId ? 'Ligne mise à jour' : 'Ligne créée')
        setShowForm(false)
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deletePrevLine(orgSlug, id)
      if ('error' in result) toast.error(result.error)
      else toast.success('Ligne supprimée')
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ap-cream-700">{lines.length} ligne(s) de conditionnement</p>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-ap-cream-200 bg-white p-5 mb-4">
          <h3 className="text-lg font-medium text-ap-green-900 mb-4">
            {editId ? 'Modifier la ligne' : 'Nouvelle ligne'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="lineName">Nom</Label>
              <Input id="lineName" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="Ligne 1" />
            </div>
            <div>
              <Label htmlFor="lineWeights">Formats compatibles (g)</Label>
              <Input id="lineWeights" value={weights} onChange={(e) => setWeights(e.target.value)} className="mt-1" placeholder="400, 350, 230" />
              <p className="text-xs text-ap-cream-500 mt-1">Séparés par des virgules</p>
            </div>
            <div>
              <Label htmlFor="lineCap">Capacité max (kg/jour)</Label>
              <Input id="lineCap" type="number" step="1" min="0" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} className="mt-1" placeholder="Optionnel" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isPending}>
              {editId ? 'Modifier' : 'Créer'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ap-cream-300">
              <th className="text-left px-4 py-3 text-ap-cream-700 font-normal">Nom</th>
              <th className="text-left px-4 py-3 text-ap-cream-700 font-normal hidden sm:table-cell">Formats</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal hidden sm:table-cell">Cap. max</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-b border-ap-cream-200 hover:bg-ap-cream-100">
                <td className="px-4 py-3 text-ap-green-900 font-medium">{line.name}</td>
                <td className="px-4 py-3 text-ap-cream-700 hidden sm:table-cell">
                  {line.compatible_weights_grams.length > 0 ? line.compatible_weights_grams.map((w) => `${w}g`).join(', ') : '—'}
                </td>
                <td className="px-4 py-3 text-right text-ap-cream-700 hidden sm:table-cell">
                  {line.max_capacity_grams ? `${(line.max_capacity_grams / 1000).toFixed(0)} kg` : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(line)} className="p-1.5 rounded hover:bg-ap-cream-200 text-ap-cream-700" aria-label="Modifier"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(line.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-ap-cream-600">Aucune ligne configurée.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
