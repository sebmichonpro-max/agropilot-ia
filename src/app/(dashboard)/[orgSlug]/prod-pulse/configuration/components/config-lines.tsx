'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { ProductionLine } from '@/types/database'
import { createLine, updateLine, deleteLine } from '../../actions'

interface ConfigLinesProps {
  orgSlug: string
  lines: ProductionLine[]
}

export function ConfigLines({ orgSlug, lines }: ConfigLinesProps) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [costEuros, setCostEuros] = useState('')
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditId(null)
    setName('')
    setCostEuros('')
    setShowForm(true)
  }

  function openEdit(line: ProductionLine) {
    setEditId(line.id)
    setName(line.name)
    setCostEuros((line.hourly_cost_cents / 100).toFixed(2))
    setShowForm(true)
  }

  function handleSubmit() {
    if (!name.trim()) return
    const cents = Math.round(parseFloat(costEuros || '0') * 100)

    startTransition(async () => {
      const result = editId
        ? await updateLine(orgSlug, editId, { name: name.trim(), hourly_cost_cents: cents })
        : await createLine(orgSlug, { name: name.trim(), hourly_cost_cents: cents })

      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(editId ? 'Ligne mise à jour' : 'Ligne créée')
        setShowForm(false)
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteLine(orgSlug, id)
      if ('error' in result) toast.error(result.error)
      else toast.success('Ligne supprimée')
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ap-cream-700">{lines.length} ligne(s) de production</p>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-ap-cream-200 bg-white p-5 mb-4">
          <h3 className="text-lg font-medium text-ap-green-900 mb-4">
            {editId ? 'Modifier la ligne' : 'Nouvelle ligne'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="lineName">Nom</Label>
              <Input id="lineName" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="Ligne Barquettes 1" />
            </div>
            <div>
              <Label htmlFor="lineCost">Coût horaire (€/h)</Label>
              <Input id="lineCost" type="number" step="0.01" min="0" value={costEuros} onChange={(e) => setCostEuros(e.target.value)} className="mt-1" placeholder="0.00" />
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
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">Coût horaire</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-b border-ap-cream-200 hover:bg-ap-cream-100">
                <td className="px-4 py-3 text-ap-green-900 font-medium">{line.name}</td>
                <td className="px-4 py-3 text-right text-ap-cream-800">
                  {line.hourly_cost_cents > 0 ? `${(line.hourly_cost_cents / 100).toFixed(2)} €/h` : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(line)} className="p-1.5 rounded hover:bg-ap-cream-200 text-ap-cream-700" aria-label="Modifier">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(line.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" aria-label="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-ap-cream-600">
                  Aucune ligne configurée. Ajoutez votre première ligne de production.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
