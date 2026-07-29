'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import { Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { RhEmployee, RhClockEvent, RhAgency } from '@/types/database'
import { PointageTabs } from '../components/pointage-tabs'
import { getEventsForPeriod } from '../actions'
import { formatMinutes, formatTime } from '../components/pointage-utils'

type ViewMode = 'day' | 'week' | 'month'

interface RecapClientProps {
  employees: RhEmployee[]
  agencies: RhAgency[]
  orgSlug: string
  isAdmin: boolean
}

interface EmployeeDayRow {
  employee: RhEmployee
  clockIn: string | null
  pauses: { start: string; end: string | null }[]
  clockOut: string | null
  totalPauseMin: number
  workMin: number
  overtimeMin: number
}

export function RecapClient({ employees, agencies, orgSlug, isAdmin }: RecapClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })
  const [events, setEvents] = useState<RhClockEvent[]>([])
  const [isPending, startTransition] = useTransition()
  const [filterContract, setFilterContract] = useState('all')
  const [filterPosition, setFilterPosition] = useState('all')

  const positions = useMemo(
    () => [...new Set(employees.map((e) => e.position).filter(Boolean))],
    [employees]
  )

  useEffect(() => {
    loadEvents()
  }, [selectedDate, viewMode])

  function loadEvents() {
    const start = new Date(selectedDate)
    const end = new Date(selectedDate)

    if (viewMode === 'day') {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    } else if (viewMode === 'week') {
      const day = start.getDay()
      const diff = day === 0 ? -6 : 1 - day
      start.setDate(start.getDate() + diff)
      start.setHours(0, 0, 0, 0)
      end.setTime(start.getTime())
      end.setDate(end.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
      end.setHours(23, 59, 59, 999)
    }

    startTransition(async () => {
      const res = await getEventsForPeriod(start.toISOString(), end.toISOString())
      if (res.data) setEvents(res.data)
      if (res.error) toast.error(res.error)
    })
  }

  const filteredEmployees = useMemo(() => {
    let list = employees
    if (filterContract !== 'all') list = list.filter((e) => e.contract_type === filterContract)
    if (filterPosition !== 'all') list = list.filter((e) => e.position === filterPosition)
    return list
  }, [employees, filterContract, filterPosition])

  const rows = useMemo(() => {
    return computeDayRows(filteredEmployees, events, selectedDate)
  }, [filteredEmployees, events, selectedDate])

  const activeRows = rows.filter((r) => r.clockIn)

  const totalWorkMin = activeRows.reduce((s, r) => s + r.workMin, 0)
  const totalPauseMin = activeRows.reduce((s, r) => s + r.totalPauseMin, 0)
  const totalOvertimeMin = activeRows.reduce((s, r) => s + r.overtimeMin, 0)

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ap-green-900 mb-4">Point&apos;age</h1>
      <PointageTabs orgSlug={orgSlug} isAdmin={isAdmin} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 bg-ap-cream-100 rounded-lg p-1">
          {(['day', 'week', 'month'] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === m ? 'bg-white text-ap-green-900 shadow-sm' : 'text-ap-cream-700 hover:text-ap-cream-900'
              }`}
            >
              {m === 'day' ? 'Jour' : m === 'week' ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-auto"
        />
        <select
          value={filterContract}
          onChange={(e) => setFilterContract(e.target.value)}
          className="rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
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
          className="rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">Tous postes</option>
          {positions.map((p) => (
            <option key={p} value={p!}>{p}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-ap-cream-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ap-cream-100">
              <th className="text-left px-3 py-2 font-normal text-ap-cream-700">Nom</th>
              <th className="text-left px-3 py-2 font-normal text-ap-cream-700">Catégorie</th>
              <th className="text-left px-3 py-2 font-normal text-ap-cream-700">Poste</th>
              <th className="text-left px-3 py-2 font-normal text-ap-cream-700">Entrée</th>
              <th className="text-left px-3 py-2 font-normal text-ap-cream-700">P1 début</th>
              <th className="text-left px-3 py-2 font-normal text-ap-cream-700">P1 fin</th>
              <th className="text-left px-3 py-2 font-normal text-ap-cream-700">P2 début</th>
              <th className="text-left px-3 py-2 font-normal text-ap-cream-700">P2 fin</th>
              <th className="text-left px-3 py-2 font-normal text-ap-cream-700">Sortie</th>
              <th className="text-left px-3 py-2 font-normal text-ap-cream-700">Nb pauses</th>
              <th className="text-left px-3 py-2 font-normal text-ap-cream-700">Total pause</th>
              <th className="text-left px-3 py-2 font-normal text-ap-cream-700">Travail effectif</th>
              <th className="text-left px-3 py-2 font-normal text-ap-cream-700">Heures sup</th>
              {isAdmin && (
                <>
                  <th className="text-left px-3 py-2 font-normal text-ap-cream-700">€/h</th>
                  <th className="text-left px-3 py-2 font-normal text-ap-cream-700">Coût total</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {activeRows.map((row) => (
              <tr key={row.employee.id} className="border-b border-ap-cream-200 hover:bg-ap-cream-100">
                <td className="px-3 py-2 font-medium text-ap-green-900">{row.employee.full_name}</td>
                <td className="px-3 py-2 text-ap-cream-800">{row.employee.contract_type}</td>
                <td className="px-3 py-2 text-ap-cream-800">{row.employee.position ?? '—'}</td>
                <td className="px-3 py-2 tabular-nums">{row.clockIn ? formatTime(row.clockIn) : '—'}</td>
                <td className="px-3 py-2 tabular-nums">{row.pauses[0]?.start ? formatTime(row.pauses[0].start) : '—'}</td>
                <td className="px-3 py-2 tabular-nums">{row.pauses[0]?.end ? formatTime(row.pauses[0].end) : '—'}</td>
                <td className="px-3 py-2 tabular-nums">{row.pauses[1]?.start ? formatTime(row.pauses[1].start) : '—'}</td>
                <td className="px-3 py-2 tabular-nums">{row.pauses[1]?.end ? formatTime(row.pauses[1].end) : '—'}</td>
                <td className="px-3 py-2 tabular-nums">{row.clockOut ? formatTime(row.clockOut) : '—'}</td>
                <td className="px-3 py-2 text-center">{row.pauses.length}</td>
                <td className="px-3 py-2 tabular-nums">{formatMinutes(row.totalPauseMin)}</td>
                <td className="px-3 py-2 tabular-nums font-medium">{formatMinutes(row.workMin)}</td>
                <td className="px-3 py-2 tabular-nums">{row.overtimeMin > 0 ? formatMinutes(row.overtimeMin) : '—'}</td>
                {isAdmin && (
                  <>
                    <td className="px-3 py-2 tabular-nums">{(row.employee.hourly_cost_cents / 100).toFixed(2)}</td>
                    <td className="px-3 py-2 tabular-nums font-medium">
                      {((row.workMin / 60) * (row.employee.hourly_cost_cents / 100)).toFixed(2)} €
                    </td>
                  </>
                )}
              </tr>
            ))}
            {activeRows.length > 0 && (
              <tr className="bg-ap-cream-100 font-bold">
                <td className="px-3 py-2 text-ap-green-900" colSpan={9}>TOTAL</td>
                <td className="px-3 py-2 text-center">{activeRows.reduce((s, r) => s + r.pauses.length, 0)}</td>
                <td className="px-3 py-2 tabular-nums">{formatMinutes(totalPauseMin)}</td>
                <td className="px-3 py-2 tabular-nums">{formatMinutes(totalWorkMin)}</td>
                <td className="px-3 py-2 tabular-nums">{totalOvertimeMin > 0 ? formatMinutes(totalOvertimeMin) : '—'}</td>
                {isAdmin && (
                  <>
                    <td className="px-3 py-2">—</td>
                    <td className="px-3 py-2 tabular-nums">
                      {activeRows.reduce((s, r) => s + (r.workMin / 60) * (r.employee.hourly_cost_cents / 100), 0).toFixed(2)} €
                    </td>
                  </>
                )}
              </tr>
            )}
          </tbody>
        </table>
        {activeRows.length === 0 && (
          <p className="text-center text-ap-cream-600 py-8">
            {isPending ? 'Chargement...' : 'Aucun pointage pour cette période'}
          </p>
        )}
      </div>
    </div>
  )
}

function computeDayRows(
  employees: RhEmployee[],
  events: RhClockEvent[],
  dateStr: string,
  dailyThreshold = 420
): EmployeeDayRow[] {
  const dayStart = new Date(dateStr)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dateStr)
  dayEnd.setHours(23, 59, 59, 999)

  return employees.map((emp) => {
    const empEvents = events
      .filter(
        (e) =>
          e.employee_id === emp.id &&
          new Date(e.event_time) >= dayStart &&
          new Date(e.event_time) <= dayEnd
      )
      .sort((a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime())

    let clockIn: string | null = null
    let clockOut: string | null = null
    const pauses: { start: string; end: string | null }[] = []

    for (const evt of empEvents) {
      switch (evt.event_type) {
        case 'clock_in':
          if (!clockIn) clockIn = evt.event_time
          break
        case 'break_start':
          pauses.push({ start: evt.event_time, end: null })
          break
        case 'break_end':
          if (pauses.length > 0 && !pauses[pauses.length - 1].end) {
            pauses[pauses.length - 1].end = evt.event_time
          }
          break
        case 'clock_out':
          clockOut = evt.event_time
          break
      }
    }

    let totalPauseMin = 0
    for (const p of pauses) {
      if (p.end) {
        totalPauseMin += (new Date(p.end).getTime() - new Date(p.start).getTime()) / 60000
      }
    }

    let workMin = 0
    if (clockIn) {
      const endTime = clockOut ? new Date(clockOut) : new Date()
      workMin = Math.max(0, (endTime.getTime() - new Date(clockIn).getTime()) / 60000 - totalPauseMin)
    }

    const overtimeMin = Math.max(0, workMin - dailyThreshold)

    return {
      employee: emp,
      clockIn,
      pauses,
      clockOut,
      totalPauseMin: Math.round(totalPauseMin),
      workMin: Math.round(workMin),
      overtimeMin: Math.round(overtimeMin),
    }
  })
}
