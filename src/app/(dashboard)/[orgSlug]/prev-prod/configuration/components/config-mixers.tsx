'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { PrevMixer } from '@/types/database'
import { createMixer, updateMixer, deleteMixer } from '../../actions'

interface ConfigMixersProps {
  orgSlug: string
  mixers: PrevMixer[]
}

export function ConfigMixers({ orgSlug, mixers }: ConfigMixersProps) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [capacityKg, setCapacityKg] = useState('')
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditId(null)
    setName('')
    setCapacityKg('')
    setShowForm(true)
  }

  function openEdit(mixer: PrevMixer) {
    setEditId(mixer.id)
    setName(mixer.name)
    setCapacityKg(String(mixer.capacity_grams / 1000))
    setShowForm(true)
  }

  function handleSubmit() {
    if (!name.trim() || !capacityKg) return
    const capacity = Math.round(parseFloat(capacityKg) * 1000)
    if (capacity <= 0) return

    startTransition(async () => {
      const result = editId
        ? await updateMixer(orgSlug, editId, { name: name.trim(), capacity_grams: capacity, sort_order: 0 })
        : await createMixer(orgSlug, { name: name.trim(), capacity_grams: capacity, sort_order: 0 })
      if ('error' in result) toast.error(result.error)
      else {
        toast.success(editId ? 'Mélangeur mis à jour' : 'Mélangeur créé')
        setShowForm(false)
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteMixer(orgSlug, id)
      if ('error' in result) toast.error(result.error)
      else toast.success('Mélangeur supprimé')
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ap-cream-700">{mixers.length} mélangeur(s)</p>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-ap-cream-200 bg-white p-5 mb-4">
          <h3 className="text-lg font-medium text-ap-green-900 mb-4">
            {editId ? 'Modifier le mélangeur' : 'Nouveau mélangeur'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="mixerName">Nom</Label>
              <Input id="mixerName" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="Mélangeur 1" />
            </div>
            <div>
              <Label htmlFor="mixerCap">Capacité (kg)</Label>
              <Input id="mixerCap" type="number" step="1" min="1" value={capacityKg} onChange={(e) => setCapacityKg(e.target.value)} className="mt-1" placeholder="980" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isPending}>{editId ? 'Modifier' : 'Créer'}</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ap-cream-300">
              <th className="text-left px-4 py-3 text-ap-cream-700 font-normal">Nom</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">Capacité</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mixers.map((mixer) => (
              <tr key={mixer.id} className="border-b border-ap-cream-200 hover:bg-ap-cream-100">
                <td className="px-4 py-3 text-ap-green-900 font-medium">{mixer.name}</td>
                <td className="px-4 py-3 text-right text-ap-cream-700">{(mixer.capacity_grams / 1000).toFixed(0)} kg</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(mixer)} className="p-1.5 rounded hover:bg-ap-cream-200 text-ap-cream-700" aria-label="Modifier"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(mixer.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {mixers.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-ap-cream-600">Aucun mélangeur configuré.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
