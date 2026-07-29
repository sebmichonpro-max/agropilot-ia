'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { RhEmployee, RhClockEvent, RhAgency, RhPosition } from '@/types/database'
import { EmployeeCard } from './employee-card'
import { PointagePanel } from './pointage-panel'
import { createEmployee } from '../actions'

interface EmployeeGridProps {
  employees: RhEmployee[]
  events: RhClockEvent[]
  agencies: RhAgency[]
  positions: RhPosition[]
  orgSlug: string
  isAdmin: boolean
  isKiosk: boolean
  onRefresh: () => void
}

interface GroupedEmployees {
  label: string
  employees: RhEmployee[]
}

export function EmployeeGrid({
  employees,
  events,
  agencies,
  positions,
  orgSlug,
  isAdmin,
  isKiosk,
  onRefresh,
}: EmployeeGridProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<RhEmployee | null>(null)
  const [filterContract, setFilterContract] = useState<string>('all')
  const [filterAgency, setFilterAgency] = useState<string>('all')
  const [filterPosition, setFilterPosition] = useState<string>('all')

  // Add employee form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newContract, setNewContract] = useState('CDI')
  const [newAgency, setNewAgency] = useState('')
  const [newPosition, setNewPosition] = useState('')
  const [newCost, setNewCost] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const agencyMap = useMemo(
    () => Object.fromEntries(agencies.map((a) => [a.id, a.name])),
    [agencies]
  )

  const usedPositions = useMemo(
    () => [...new Set(employees.map((e) => e.position).filter(Boolean))] as string[],
    [employees]
  )

  const filtered = useMemo(() => {
    let list = employees
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((e) => e.full_name.toLowerCase().includes(q))
    }
    if (filterContract !== 'all') {
      list = list.filter((e) => e.contract_type === filterContract)
    }
    if (filterAgency !== 'all') {
      list = list.filter((e) => e.agency_id === filterAgency)
    }
    if (filterPosition !== 'all') {
      list = list.filter((e) => e.position === filterPosition)
    }
    return list
  }, [employees, search, filterContract, filterAgency, filterPosition])

  const grouped = useMemo(() => {
    const groups: GroupedEmployees[] = []
    const byContract: Record<string, RhEmployee[]> = {}

    for (const emp of filtered) {
      const key = emp.contract_type
      if (!byContract[key]) byContract[key] = []
      byContract[key].push(emp)
    }

    const contractOrder = ['CDI', 'CDD', 'Stage', 'Interim']
    for (const ct of contractOrder) {
      const emps = byContract[ct]
      if (!emps) continue

      if ((ct === 'CDD' || ct === 'Interim') && emps.some((e) => e.agency_id)) {
        const byAgency: Record<string, RhEmployee[]> = {}
        const noAgency: RhEmployee[] = []

        for (const emp of emps) {
          if (emp.agency_id) {
            const agName = agencyMap[emp.agency_id] ?? 'Autre'
            if (!byAgency[agName]) byAgency[agName] = []
            byAgency[agName].push(emp)
          } else {
            noAgency.push(emp)
          }
        }

        for (const [agName, agEmps] of Object.entries(byAgency).sort(([a], [b]) => a.localeCompare(b))) {
          groups.push({ label: `${ct} — ${agName}`, employees: agEmps })
        }
        if (noAgency.length > 0) {
          groups.push({ label: ct, employees: noAgency })
        }
      } else {
        groups.push({ label: ct, employees: emps })
      }
    }

    return groups
  }, [filtered, agencyMap])

  async function handleAddEmployee() {
    if (!newName.trim()) {
      toast.error('Nom obligatoire')
      return
    }
    setIsAdding(true)
    const formData = new FormData()
    formData.set('full_name', newName.trim())
    formData.set('contract_type', newContract)
    formData.set('position', newPosition)
    formData.set('agency_id', newAgency)
    formData.set('hourly_cost_cents', String(Math.round(parseFloat(newCost || '0') * 100)))

    const res = await createEmployee(formData)
    setIsAdding(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`${newName} ajouté`)
      setNewName('')
      setNewCost('')
      onRefresh()
    }
  }

  if (selectedEmployee) {
    return (
      <PointagePanel
        employee={selectedEmployee}
        events={events.filter((e) => e.employee_id === selectedEmployee.id)}
        agencyName={selectedEmployee.agency_id ? agencyMap[selectedEmployee.agency_id] : undefined}
        isAdmin={isAdmin}
        isKiosk={isKiosk}
        orgSlug={orgSlug}
        onBack={() => setSelectedEmployee(null)}
        onRefresh={onRefresh}
      />
    )
  }

  return (
    <div>
      {/* Clock — always visible */}
      <LiveClock />

      {/* Add employee bar (admin only, not kiosk) */}
      {isAdmin && !isKiosk && (
        <div className="flex flex-wrap items-end gap-2 mb-4 rounded-lg border border-ap-cream-200 bg-white p-3">
          <div className="flex-1 min-w-[180px]">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom Prénom"
              onKeyDown={(e) => e.key === 'Enter' && handleAddEmployee()}
            />
          </div>
          <select
            value={newContract}
            onChange={(e) => setNewContract(e.target.value)}
            className="rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm h-9"
          >
            <option value="CDI">CDI</option>
            <option value="CDD">CDD</option>
            <option value="Interim">Intérim</option>
            <option value="Stage">Stage</option>
          </select>
          {(newContract === 'CDD' || newContract === 'Interim') && agencies.length > 0 && (
            <select
              value={newAgency}
              onChange={(e) => setNewAgency(e.target.value)}
              className="rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm h-9"
            >
              <option value="">Société</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          )}
          <select
            value={newPosition}
            onChange={(e) => setNewPosition(e.target.value)}
            className="rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm h-9"
          >
            <option value="">— Poste —</option>
            {positions.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          {isAdmin && (
            <div className="w-20">
              <Input
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                placeholder="EUR/h"
                type="number"
                step="0.01"
              />
            </div>
          )}
          <Button onClick={handleAddEmployee} disabled={isAdding} size="sm" className="bg-ap-green-900 text-ap-green-100">
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <label className="text-xs text-ap-cream-700">Cat.</label>
        <select
          value={filterContract}
          onChange={(e) => setFilterContract(e.target.value)}
          className="rounded-lg border border-ap-cream-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="all">Toutes</option>
          <option value="CDI">CDI</option>
          <option value="CDD">CDD</option>
          <option value="Interim">Intérim</option>
          <option value="Stage">Stage</option>
        </select>
        <label className="text-xs text-ap-cream-700">Société</label>
        <select
          value={filterAgency}
          onChange={(e) => setFilterAgency(e.target.value)}
          className="rounded-lg border border-ap-cream-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="all">Toutes</option>
          {agencies.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <label className="text-xs text-ap-cream-700">Poste</label>
        <select
          value={filterPosition}
          onChange={(e) => setFilterPosition(e.target.value)}
          className="rounded-lg border border-ap-cream-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="all">Tous postes</option>
          {(positions.length > 0 ? positions.map((p) => p.name) : usedPositions).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ap-cream-600" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="pl-10 h-9"
            autoFocus={isKiosk}
          />
        </div>
      </div>

      {/* Counter */}
      <p className="text-xs text-ap-cream-700 mb-3">
        {filtered.length} employé{filtered.length > 1 ? 's' : ''} sur {employees.length}
      </p>

      {/* Grouped Grid */}
      {grouped.map((group) => (
        <div key={group.label} className="mb-6">
          <div className="border-b border-ap-cream-300 mb-3">
            <h3 className="text-sm font-semibold text-ap-green-900 pb-1">{group.label}</h3>
          </div>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}
          >
            {group.employees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                events={events}
                agencyName={emp.agency_id ? agencyMap[emp.agency_id] : undefined}
                onClick={() => setSelectedEmployee(emp)}
                showCost={isAdmin}
                isAdmin={isAdmin}
                onDelete={() => onRefresh()}
              />
            ))}
          </div>
        </div>
      ))}

      {grouped.length === 0 && (
        <p className="text-center text-ap-cream-600 py-12">
          Aucun employé trouvé
        </p>
      )}
    </div>
  )
}

function LiveClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="text-center mb-4">
      <p className="text-lg font-medium text-ap-green-900">
        {time.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        {' — '}
        <span className="tabular-nums">
          {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </p>
    </div>
  )
}
