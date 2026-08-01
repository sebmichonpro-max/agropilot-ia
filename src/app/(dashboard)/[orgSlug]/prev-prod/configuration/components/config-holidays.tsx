'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { PrevHoliday } from '@/types/database'
import { createHoliday, deleteHoliday } from '../../actions'

interface ConfigHolidaysProps {
  orgSlug: string
  holidays: PrevHoliday[]
}

export function ConfigHolidays({ orgSlug, holidays }: ConfigHolidaysProps) {
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState('')
  const [label, setLabel] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    if (!date || !label.trim()) return

    startTransition(async () => {
      const result = await createHoliday(orgSlug, { date, label: label.trim() })
      if ('error' in result) toast.error(result.error)
      else {
        toast.success('Jour férié ajouté')
        setShowForm(false)
        setDate('')
        setLabel('')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteHoliday(orgSlug, id)
      if ('error' in result) toast.error(result.error)
      else toast.success('Jour férié supprimé')
    })
  }

  const pastHolidays = holidays.filter((h) => h.date < new Date().toISOString().split('T')[0])
  const futureHolidays = holidays.filter((h) => h.date >= new Date().toISOString().split('T')[0])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ap-cream-700">{holidays.length} jour(s) férié(s)</p>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4 text-sm text-amber-800">
        <p>Les jours fériés sont exclus du calcul de stock cible. Si un jour de référence tombe un jour férié, les poids sont redistribués sur les semaines restantes.</p>
      </div>

      {showForm && (
        <div className="rounded-xl border border-ap-cream-200 bg-white p-5 mb-4">
          <h3 className="text-lg font-medium text-ap-green-900 mb-4">Nouveau jour férié</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="holidayDate">Date</Label>
              <Input id="holidayDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="holidayLabel">Libellé</Label>
              <Input id="holidayLabel" value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1" placeholder="1er mai" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={isPending}>Ajouter</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ap-cream-300">
              <th className="text-left px-4 py-3 text-ap-cream-700 font-normal">Date</th>
              <th className="text-left px-4 py-3 text-ap-cream-700 font-normal">Libellé</th>
              <th className="text-center px-4 py-3 text-ap-cream-700 font-normal hidden sm:table-cell">Source</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {futureHolidays.map((h) => (
              <tr key={h.id} className="border-b border-ap-cream-200 hover:bg-ap-cream-100">
                <td className="px-4 py-3 text-ap-green-900 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-ap-cream-500" />
                    {new Date(h.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </td>
                <td className="px-4 py-3 text-ap-cream-800">{h.label}</td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${h.auto_generated ? 'bg-ap-cream-200 text-ap-cream-600' : 'bg-blue-100 text-blue-700'}`}>
                    {h.auto_generated ? 'Auto' : 'Manuel'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(h.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" aria-label="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {pastHolidays.length > 0 && (
              <tr><td colSpan={4} className="px-4 py-2 bg-ap-cream-50 text-xs text-ap-cream-500 font-medium">Passés ({pastHolidays.length})</td></tr>
            )}
            {pastHolidays.map((h) => (
              <tr key={h.id} className="border-b border-ap-cream-100 opacity-60">
                <td className="px-4 py-2 text-ap-cream-600">
                  {new Date(h.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-2 text-ap-cream-500">{h.label}</td>
                <td className="px-4 py-2 text-center hidden sm:table-cell">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-ap-cream-200 text-ap-cream-500">
                    {h.auto_generated ? 'Auto' : 'Manuel'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => handleDelete(h.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" aria-label="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {holidays.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-ap-cream-600">Aucun jour férié configuré.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
