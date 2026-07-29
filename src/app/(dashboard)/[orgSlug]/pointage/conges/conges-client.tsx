'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { RhEmployee, RhAbsence, AbsenceType } from '@/types/database'
import { PointageTabs } from '../components/pointage-tabs'
import { createAbsence, updateAbsenceStatus } from '../actions'

const ABSENCE_TYPES: { value: AbsenceType; label: string; color: string }[] = [
  { value: 'CP', label: 'Congés payés', color: 'bg-blue-50 text-blue-800' },
  { value: 'RTT', label: 'RTT', color: 'bg-purple-50 text-purple-800' },
  { value: 'Maladie', label: 'Maladie', color: 'bg-amber-50 text-amber-800' },
  { value: 'AT', label: 'Accident du travail', color: 'bg-red-50 text-red-800' },
  { value: 'Absence_injustifiee', label: 'Absence injustifiée', color: 'bg-red-50 text-red-700' },
  { value: 'Autre', label: 'Autre', color: 'bg-gray-100 text-gray-800' },
]

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-amber-50 text-amber-800' },
  approved: { label: 'Validé', color: 'bg-ap-green-100 text-ap-green-800' },
  rejected: { label: 'Refusé', color: 'bg-red-50 text-red-800' },
}

interface CongesClientProps {
  employees: RhEmployee[]
  absences: RhAbsence[]
  orgSlug: string
  isAdmin: boolean
}

export function CongesClient({ employees, absences, orgSlug, isAdmin }: CongesClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState('all')

  // Form state
  const [employeeId, setEmployeeId] = useState('')
  const [absenceType, setAbsenceType] = useState<AbsenceType>('CP')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')

  const employeeMap = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e.full_name])),
    [employees]
  )

  const filteredAbsences = useMemo(() => {
    if (filterType === 'all') return absences
    return absences.filter((a) => a.absence_type === filterType)
  }, [absences, filterType])

  function handleSubmit() {
    if (!employeeId || !startDate || !endDate) {
      toast.error('Champs obligatoires manquants')
      return
    }
    const formData = new FormData()
    formData.set('employee_id', employeeId)
    formData.set('absence_type', absenceType)
    formData.set('start_date', startDate)
    formData.set('end_date', endDate)
    formData.set('note', note)

    startTransition(async () => {
      const res = await createAbsence(formData)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Absence enregistrée')
        setShowForm(false)
        setEmployeeId('')
        setStartDate('')
        setEndDate('')
        setNote('')
        router.refresh()
      }
    })
  }

  function handleStatusChange(id: string, status: 'approved' | 'rejected') {
    startTransition(async () => {
      const res = await updateAbsenceStatus(id, status)
      if (res.error) toast.error(res.error)
      else {
        toast.success(status === 'approved' ? 'Absence validée' : 'Absence refusée')
        router.refresh()
      }
    })
  }

  function daysBetween(start: string, end: string): number {
    const s = new Date(start)
    const e = new Date(end)
    return Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ap-green-900 mb-4">Point&apos;age</h1>
      <PointageTabs orgSlug={orgSlug} isAdmin={isAdmin} />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">Tous types</option>
          {ABSENCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <div className="flex-1" />
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nouvelle absence
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-ap-cream-200 bg-white p-5 mb-6">
          <h3 className="text-lg font-medium text-ap-green-900 mb-4">Déclarer une absence</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="employee">Employé</Label>
              <select
                id="employee"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Sélectionner...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="absenceType">Type</Label>
              <select
                id="absenceType"
                value={absenceType}
                onChange={(e) => setAbsenceType(e.target.value as AbsenceType)}
                className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
              >
                {ABSENCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="startDate">Date début</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="endDate">Date fin</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="note">Note (optionnelle)</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Commentaire..." />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isPending} size="sm">Enregistrer</Button>
            <Button variant="outline" onClick={() => setShowForm(false)} size="sm">Annuler</Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {filteredAbsences.map((absence) => {
          const typeInfo = ABSENCE_TYPES.find((t) => t.value === absence.absence_type)
          const statusInfo = STATUS_LABELS[absence.status]
          return (
            <div key={absence.id} className="rounded-lg border border-ap-cream-200 bg-white px-4 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ap-green-900">
                  {employeeMap[absence.employee_id] ?? 'Inconnu'}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo?.color}`}>
                    {typeInfo?.label ?? absence.absence_type}
                  </span>
                  <span className="text-xs text-ap-cream-700">
                    {new Date(absence.start_date).toLocaleDateString('fr-FR')} → {new Date(absence.end_date).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="text-xs text-ap-cream-600">
                    ({daysBetween(absence.start_date, absence.end_date)} j)
                  </span>
                </div>
                {absence.note && (
                  <p className="text-xs text-ap-cream-600 mt-1">{absence.note}</p>
                )}
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              {isAdmin && absence.status === 'pending' && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleStatusChange(absence.id, 'approved')}
                    disabled={isPending}
                    className="p-1.5 rounded-md bg-ap-green-100 text-ap-green-800 hover:bg-ap-green-200"
                    aria-label="Valider"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleStatusChange(absence.id, 'rejected')}
                    disabled={isPending}
                    className="p-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100"
                    aria-label="Refuser"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filteredAbsences.length === 0 && (
          <p className="text-center text-ap-cream-600 py-12">
            Aucune absence enregistrée
          </p>
        )}
      </div>
    </div>
  )
}
