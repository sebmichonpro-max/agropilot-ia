import type { RhClockEvent, EmployeeStatus } from '@/types/database'

export function getEmployeeStatus(
  employeeId: string,
  events: RhClockEvent[]
): EmployeeStatus {
  const empEvents = events
    .filter((e) => e.employee_id === employeeId)
    .sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime())

  if (empEvents.length === 0) return 'absent'

  const lastEvent = empEvents[0]
  switch (lastEvent.event_type) {
    case 'clock_in':
    case 'break_end':
      return 'present'
    case 'break_start':
      return 'on_break'
    case 'clock_out':
      return 'left'
    default:
      return 'absent'
  }
}

export function getStatusColor(status: EmployeeStatus) {
  switch (status) {
    case 'present':
      return { dot: 'bg-ap-green-500', label: 'Présent', labelColor: 'text-ap-green-800' }
    case 'on_break':
      return { dot: 'bg-amber-500', label: 'En pause', labelColor: 'text-amber-800' }
    case 'left':
      return { dot: 'bg-red-500', label: 'Sorti', labelColor: 'text-red-800' }
    case 'absent':
    default:
      return { dot: 'bg-gray-400', label: 'Absent', labelColor: 'text-gray-600' }
  }
}

export function getContractBadge(contractType: string) {
  switch (contractType) {
    case 'CDI':
      return { bg: 'bg-ap-green-100', text: 'text-ap-green-800' }
    case 'CDD':
      return { bg: 'bg-amber-50', text: 'text-amber-800' }
    case 'Interim':
      return { bg: 'bg-blue-50', text: 'text-blue-800' }
    case 'Stage':
      return { bg: 'bg-purple-50', text: 'text-purple-800' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' }
  }
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${m.toString().padStart(2, '0')}`
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getClockInTime(
  employeeId: string,
  events: RhClockEvent[]
): Date | null {
  const empEvents = events
    .filter((e) => e.employee_id === employeeId)
    .sort((a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime())

  let clockIn: Date | null = null
  for (const evt of empEvents) {
    if (evt.event_type === 'clock_in') clockIn = new Date(evt.event_time)
    if (evt.event_type === 'clock_out') clockIn = null
  }
  return clockIn
}

export function getTotalBreakMs(
  employeeId: string,
  events: RhClockEvent[]
): number {
  const empEvents = events
    .filter((e) => e.employee_id === employeeId)
    .sort((a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime())

  let totalBreak = 0
  let breakStart: Date | null = null

  for (const evt of empEvents) {
    if (evt.event_type === 'clock_out') {
      if (breakStart) {
        totalBreak += new Date(evt.event_time).getTime() - breakStart.getTime()
        breakStart = null
      }
      break
    }
    if (evt.event_type === 'break_start') {
      breakStart = new Date(evt.event_time)
    }
    if (evt.event_type === 'break_end' && breakStart) {
      totalBreak += new Date(evt.event_time).getTime() - breakStart.getTime()
      breakStart = null
    }
  }

  if (breakStart) {
    totalBreak += Date.now() - breakStart.getTime()
  }

  return totalBreak
}
