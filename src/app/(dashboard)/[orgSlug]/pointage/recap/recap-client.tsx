'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import { Download, FileText, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { RhEmployee, RhClockEvent, RhAgency } from '@/types/database'
import { PointageTabs } from '../components/pointage-tabs'
import { AdminDialog } from '../components/admin-dialog'
import { getEventsForPeriod } from '../actions'
import { formatMinutes, formatTime } from '../components/pointage-utils'

type ViewMode = 'day' | 'week' | 'month'

interface RecapClientProps {
  employees: RhEmployee[]
  agencies: RhAgency[]
  orgSlug: string
  canBeAdmin: boolean
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

export function RecapClient({ employees, agencies, orgSlug, canBeAdmin }: RecapClientProps) {
  const [isAdminMode, setIsAdminMode] = useState(false)
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

  function getDateRange() {
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
    return { start, end }
  }

  function loadEvents() {
    const { start, end } = getDateRange()
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

  function getPeriodLabel() {
    const d = new Date(selectedDate)
    if (viewMode === 'day') return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (viewMode === 'week') {
      const { start, end } = getDateRange()
      return `Semaine du ${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  async function handleExportExcel() {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    const headerRow = ['Nom', 'Catégorie', 'Poste', 'Entrée', 'P1 début', 'P1 fin', 'P2 début', 'P2 fin', 'Sortie', 'Nb pauses', 'Total pause', 'Travail effectif', 'Heures sup']
    if (isAdminMode) headerRow.push('€/h', 'Coût total')

    const dataRows = activeRows.map((row) => {
      const r: (string | number)[] = [
        row.employee.full_name,
        row.employee.contract_type,
        row.employee.position ?? '',
        row.clockIn ? formatTime(row.clockIn) : '',
        row.pauses[0]?.start ? formatTime(row.pauses[0].start) : '',
        row.pauses[0]?.end ? formatTime(row.pauses[0].end) : '',
        row.pauses[1]?.start ? formatTime(row.pauses[1].start) : '',
        row.pauses[1]?.end ? formatTime(row.pauses[1].end) : '',
        row.clockOut ? formatTime(row.clockOut) : '',
        row.pauses.length,
        formatMinutes(row.totalPauseMin),
        formatMinutes(row.workMin),
        row.overtimeMin > 0 ? formatMinutes(row.overtimeMin) : '',
      ]
      if (isAdminMode) {
        r.push(
          (row.employee.hourly_cost_cents / 100).toFixed(2),
          ((row.workMin / 60) * (row.employee.hourly_cost_cents / 100)).toFixed(2) + ' €'
        )
      }
      return r
    })

    const totalRow: (string | number)[] = ['TOTAL', '', '', '', '', '', '', '', '', activeRows.reduce((s, r) => s + r.pauses.length, 0), formatMinutes(totalPauseMin), formatMinutes(totalWorkMin), totalOvertimeMin > 0 ? formatMinutes(totalOvertimeMin) : '']
    if (isAdminMode) {
      totalRow.push('', activeRows.reduce((s, r) => s + (r.workMin / 60) * (r.employee.hourly_cost_cents / 100), 0).toFixed(2) + ' €')
    }

    const wsData = [
      [`POINTAGE — ${getPeriodLabel()}`],
      [],
      headerRow,
      ...dataRows,
      totalRow,
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = headerRow.map(() => ({ wch: 16 }))
    XLSX.utils.book_append_sheet(wb, ws, viewMode === 'day' ? 'Jour' : viewMode === 'week' ? 'Semaine' : 'Mois')
    XLSX.writeFile(wb, `pointage_${selectedDate}.xlsx`)
    toast.success('Export Excel téléchargé')
  }

  function handleExportPDF() {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Popup bloquée — autorisez les popups pour cette page')
      return
    }

    const adminCols = isAdminMode ? '<th>€/h</th><th>Coût total</th>' : ''
    const adminTotalCols = isAdminMode
      ? `<td>—</td><td><strong>${activeRows.reduce((s, r) => s + (r.workMin / 60) * (r.employee.hourly_cost_cents / 100), 0).toFixed(2)} €</strong></td>`
      : ''

    const rowsHtml = activeRows.map((row) => {
      const adminData = isAdminMode
        ? `<td>${(row.employee.hourly_cost_cents / 100).toFixed(2)}</td><td>${((row.workMin / 60) * (row.employee.hourly_cost_cents / 100)).toFixed(2)} €</td>`
        : ''
      return `<tr>
        <td><strong>${row.employee.full_name}</strong></td>
        <td>${row.employee.contract_type}</td>
        <td>${row.employee.position ?? ''}</td>
        <td>${row.clockIn ? formatTime(row.clockIn) : '—'}</td>
        <td>${row.pauses[0]?.start ? formatTime(row.pauses[0].start) : '—'}</td>
        <td>${row.pauses[0]?.end ? formatTime(row.pauses[0].end) : '—'}</td>
        <td>${row.pauses[1]?.start ? formatTime(row.pauses[1].start) : '—'}</td>
        <td>${row.pauses[1]?.end ? formatTime(row.pauses[1].end) : '—'}</td>
        <td>${row.clockOut ? formatTime(row.clockOut) : '—'}</td>
        <td style="text-align:center">${row.pauses.length}</td>
        <td>${formatMinutes(row.totalPauseMin)}</td>
        <td><strong>${formatMinutes(row.workMin)}</strong></td>
        <td>${row.overtimeMin > 0 ? formatMinutes(row.overtimeMin) : '—'}</td>
        ${adminData}
      </tr>`
    }).join('')

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Pointage — ${getPeriodLabel()}</title>
    <style>
      @page { size: A3 landscape; margin: 10mm; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #333; }
      h1 { font-size: 16px; color: #1a3a2a; margin-bottom: 4px; }
      h2 { font-size: 12px; color: #666; font-weight: normal; margin-top: 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th { background: #f0ebe0; color: #7a6f58; font-weight: normal; padding: 6px 8px; text-align: left; border-bottom: 2px solid #e3dac8; font-size: 10px; }
      td { padding: 5px 8px; border-bottom: 1px solid #e3dac8; }
      tr:last-child td { border-bottom: 2px solid #1a3a2a; font-weight: bold; background: #f7f4ed; }
    </style></head><body>
    <h1>AgroPilot.IA — POINTAGE</h1>
    <h2>${getPeriodLabel()}</h2>
    <table>
      <thead><tr>
        <th>Nom</th><th>Cat.</th><th>Poste</th><th>Entrée</th><th>P1 début</th><th>P1 fin</th><th>P2 début</th><th>P2 fin</th><th>Sortie</th><th>Nb pauses</th><th>Total pause</th><th>Travail effectif</th><th>Heures sup</th>${adminCols}
      </tr></thead>
      <tbody>
        ${rowsHtml}
        <tr>
          <td colspan="9"><strong>TOTAL</strong></td>
          <td style="text-align:center">${activeRows.reduce((s, r) => s + r.pauses.length, 0)}</td>
          <td>${formatMinutes(totalPauseMin)}</td>
          <td><strong>${formatMinutes(totalWorkMin)}</strong></td>
          <td>${totalOvertimeMin > 0 ? formatMinutes(totalOvertimeMin) : '—'}</td>
          ${adminTotalCols}
        </tr>
      </tbody>
    </table>
    </body></html>`)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-ap-green-900">Point&apos;age</h1>
        <div className="flex gap-2">
          <Button onClick={handleExportExcel} size="sm" variant="outline" disabled={activeRows.length === 0}>
            <Download className="h-4 w-4 mr-1" />
            Excel
          </Button>
          <Button onClick={handleExportPDF} size="sm" variant="outline" disabled={activeRows.length === 0}>
            <FileText className="h-4 w-4 mr-1" />
            PDF
          </Button>
          {canBeAdmin && (
            <AdminDialog isAdminMode={isAdminMode} onToggle={setIsAdminMode} />
          )}
        </div>
      </div>
      <PointageTabs orgSlug={orgSlug} isAdmin={isAdminMode} />

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
              {isAdminMode && (
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
                {isAdminMode && (
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
                {isAdminMode && (
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
