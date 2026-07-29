'use client'

import { useState, useMemo } from 'react'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { RhEmployee, RhClockEvent, RhAgency } from '@/types/database'
import { EmployeeCard } from './employee-card'
import { PointagePanel } from './pointage-panel'

interface EmployeeGridProps {
  employees: RhEmployee[]
  events: RhClockEvent[]
  agencies: RhAgency[]
  orgSlug: string
  isAdmin: boolean
  isKiosk: boolean
  onRefresh: () => void
}

export function EmployeeGrid({
  employees,
  events,
  agencies,
  orgSlug,
  isAdmin,
  isKiosk,
  onRefresh,
}: EmployeeGridProps) {
  const [search, setSearch] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<RhEmployee | null>(null)
  const [filterContract, setFilterContract] = useState<string>('all')
  const [filterPosition, setFilterPosition] = useState<string>('all')

  const agencyMap = useMemo(
    () => Object.fromEntries(agencies.map((a) => [a.id, a.name])),
    [agencies]
  )

  const positions = useMemo(
    () => [...new Set(employees.map((e) => e.position).filter(Boolean))],
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
    if (filterPosition !== 'all') {
      list = list.filter((e) => e.position === filterPosition)
    }
    return list
  }, [employees, search, filterContract, filterPosition])

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
      {/* Clock */}
      {isKiosk && <KioskClock />}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ap-cream-600" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tapez votre nom..."
            className="pl-10"
            autoFocus={isKiosk}
          />
        </div>
        {!isKiosk && (
          <div className="flex gap-2">
            <select
              value={filterContract}
              onChange={(e) => setFilterContract(e.target.value)}
              className="rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm text-ap-cream-800"
            >
              <option value="all">Tous contrats</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="Interim">Intérim</option>
              <option value="Stage">Stage</option>
            </select>
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm text-ap-cream-800"
            >
              <option value="all">Tous postes</option>
              {positions.map((p) => (
                <option key={p} value={p!}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Counter */}
      <p className="text-sm text-ap-cream-700 mb-3">
        {filtered.length} employé{filtered.length > 1 ? 's' : ''} sur {employees.length}
      </p>

      {/* Grid */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {filtered.map((emp) => (
          <EmployeeCard
            key={emp.id}
            employee={emp}
            events={events}
            agencyName={emp.agency_id ? agencyMap[emp.agency_id] : undefined}
            onClick={() => setSelectedEmployee(emp)}
            showCost={isAdmin}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-ap-cream-600 py-12">
          Aucun employé trouvé
        </p>
      )}
    </div>
  )
}

function KioskClock() {
  const [time, setTime] = useState(new Date())

  useState(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  })

  return (
    <div className="text-center mb-6">
      <p className="text-xl font-medium text-ap-green-900">
        {time.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </p>
      <p className="text-4xl font-bold text-ap-green-900 tabular-nums">
        {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
    </div>
  )
}
