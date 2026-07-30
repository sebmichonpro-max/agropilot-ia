'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { StopCause, StopCategory } from '@/types/database'
import { createStopCause, updateStopCause, deleteStopCause, seedDefaultCauses } from '../../actions'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../../lib/trs-constants'

interface ConfigCausesProps {
  orgSlug: string
  causes: StopCause[]
}

export function ConfigCauses({ orgSlug, causes }: ConfigCausesProps) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<StopCategory>('availability')
  const [icon, setIcon] = useState('AlertTriangle')
  const [order, setOrder] = useState(0)
  const [isPlanned, setIsPlanned] = useState(false)
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditId(null)
    setName('')
    setCategory('availability')
    setIcon('AlertTriangle')
    setOrder(causes.length + 1)
    setIsPlanned(false)
    setShowForm(true)
  }

  function openEdit(c: StopCause) {
    setEditId(c.id)
    setName(c.name)
    setCategory(c.category)
    setIcon(c.icon)
    setOrder(c.display_order)
    setIsPlanned(c.is_planned)
    setShowForm(true)
  }

  function handleSubmit() {
    if (!name.trim()) return
    startTransition(async () => {
      const input = { name: name.trim(), category, icon, display_order: order, is_planned: isPlanned }
      const result = editId
        ? await updateStopCause(orgSlug, editId, input)
        : await createStopCause(orgSlug, input)

      if ('error' in result) toast.error(result.error)
      else {
        toast.success(editId ? 'Cause mise à jour' : 'Cause créée')
        setShowForm(false)
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteStopCause(orgSlug, id)
      if ('error' in result) toast.error(result.error)
      else toast.success('Cause supprimée')
    })
  }

  function handleSeedDefaults() {
    startTransition(async () => {
      const result = await seedDefaultCauses(orgSlug)
      if ('error' in result) toast.error(result.error)
      else toast.success('Causes par défaut créées')
    })
  }

  const grouped = {
    availability: causes.filter((c) => c.category === 'availability' && !c.is_planned),
    performance: causes.filter((c) => c.category === 'performance'),
    quality: causes.filter((c) => c.category === 'quality'),
    planned: causes.filter((c) => c.is_planned),
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ap-cream-700">{causes.length} cause(s) configurée(s)</p>
        <div className="flex gap-2">
          {causes.length === 0 && (
            <Button variant="outline" onClick={handleSeedDefaults} disabled={isPending} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Charger par défaut
            </Button>
          )}
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-ap-cream-200 bg-white p-5 mb-4">
          <h3 className="text-lg font-medium text-ap-green-900 mb-4">
            {editId ? 'Modifier la cause' : 'Nouvelle cause'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="causeName">Nom</Label>
              <Input id="causeName" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="causeCategory">Catégorie</Label>
              <select
                id="causeCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value as StopCategory)}
                className="w-full mt-1 rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-ap-green-500"
              >
                <option value="availability">Disponibilité</option>
                <option value="performance">Performance</option>
                <option value="quality">Qualité</option>
              </select>
            </div>
            <div>
              <Label htmlFor="causeIcon">Icône (Lucide)</Label>
              <Input id="causeIcon" value={icon} onChange={(e) => setIcon(e.target.value)} className="mt-1" placeholder="AlertTriangle" />
            </div>
            <div>
              <Label htmlFor="causeOrder">Ordre</Label>
              <Input id="causeOrder" type="number" min={0} value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} className="mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="isPlanned"
              checked={isPlanned}
              onChange={(e) => setIsPlanned(e.target.checked)}
              className="h-4 w-4 rounded border-ap-cream-300 text-ap-green-700"
            />
            <Label htmlFor="isPlanned" className="mb-0">Arrêt planifié (pause, nettoyage)</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isPending}>{editId ? 'Modifier' : 'Créer'}</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </div>
      )}

      {/* Grouped display */}
      {(['availability', 'performance', 'quality'] as const).map((cat) => {
        const items = grouped[cat]
        if (items.length === 0) return null
        const colors = CATEGORY_COLORS[cat]
        return (
          <div key={cat} className="mb-4">
            <h3 className="text-sm font-medium text-ap-green-900 mb-2">{CATEGORY_LABELS[cat]}</h3>
            <div className="space-y-1">
              {items.map((c) => (
                <div key={c.id} className={`flex items-center justify-between rounded-lg px-4 py-2 ${colors.bg}`}>
                  <span className={`text-sm font-medium ${colors.text}`}>{c.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="p-1 rounded hover:bg-white/50" aria-label="Modifier"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1 rounded hover:bg-white/50 text-red-600" aria-label="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {grouped.planned.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-ap-green-900 mb-2">Arrêts planifiés</h3>
          <div className="space-y-1">
            {grouped.planned.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg px-4 py-2 bg-ap-cream-100">
                <span className="text-sm font-medium text-ap-cream-800">{c.name}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1 rounded hover:bg-white/50" aria-label="Modifier"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1 rounded hover:bg-white/50 text-red-600" aria-label="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
