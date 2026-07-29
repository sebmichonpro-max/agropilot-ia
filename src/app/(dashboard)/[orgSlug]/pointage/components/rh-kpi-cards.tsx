'use client'

import { Users, Coffee, UserX, Clock } from 'lucide-react'
import type { RhEmployee, RhClockEvent, EmployeeStatus } from '@/types/database'
import { getEmployeeStatus, formatMinutes } from './pointage-utils'

interface RhKpiCardsProps {
  employees: RhEmployee[]
  events: RhClockEvent[]
}

export function RhKpiCards({ employees, events }: RhKpiCardsProps) {
  const statuses = employees.map((emp) => ({
    employee: emp,
    status: getEmployeeStatus(emp.id, events),
  }))

  const presentCount = statuses.filter((s) => s.status === 'present').length
  const onBreakCount = statuses.filter((s) => s.status === 'on_break').length
  const absentCount = statuses.filter(
    (s) => s.status === 'absent' || s.status === 'left'
  ).length

  const totalMinutesToday = calculateTotalMinutes(employees, events)

  const cards = [
    {
      label: 'Présents',
      value: presentCount,
      sub: employees.length > 0 ? `${Math.round((presentCount / employees.length) * 100)}%` : '0%',
      icon: Users,
      bg: 'bg-ap-green-100',
      text: 'text-ap-green-800',
    },
    {
      label: 'En pause',
      value: onBreakCount,
      icon: Coffee,
      bg: 'bg-amber-50',
      text: 'text-amber-800',
    },
    {
      label: 'Absents / Sortis',
      value: absentCount,
      icon: UserX,
      bg: 'bg-red-50',
      text: 'text-red-800',
    },
    {
      label: 'Heures cumulées',
      value: formatMinutes(totalMinutesToday),
      icon: Clock,
      bg: 'bg-blue-50',
      text: 'text-blue-800',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className={`${card.bg} rounded-lg p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`h-4 w-4 ${card.text}`} />
              <span className={`text-xs ${card.text}`}>{card.label}</span>
            </div>
            <p className={`text-2xl font-medium ${card.text}`}>{card.value}</p>
            {card.sub && (
              <p className={`text-xs ${card.text} opacity-70`}>{card.sub}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function calculateTotalMinutes(employees: RhEmployee[], events: RhClockEvent[]): number {
  let total = 0
  const now = new Date()

  for (const emp of employees) {
    const empEvents = events
      .filter((e) => e.employee_id === emp.id)
      .sort((a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime())

    let clockInTime: Date | null = null
    let breakStartTime: Date | null = null
    let totalBreakMs = 0
    let workMs = 0

    for (const evt of empEvents) {
      const t = new Date(evt.event_time)
      switch (evt.event_type) {
        case 'clock_in':
          clockInTime = t
          totalBreakMs = 0
          break
        case 'break_start':
          breakStartTime = t
          break
        case 'break_end':
          if (breakStartTime) {
            totalBreakMs += t.getTime() - breakStartTime.getTime()
            breakStartTime = null
          }
          break
        case 'clock_out':
          if (clockInTime) {
            workMs += t.getTime() - clockInTime.getTime() - totalBreakMs
            clockInTime = null
            totalBreakMs = 0
          }
          break
      }
    }

    if (clockInTime) {
      const currentBreak = breakStartTime ? now.getTime() - breakStartTime.getTime() : 0
      workMs += now.getTime() - clockInTime.getTime() - totalBreakMs - currentBreak
    }

    total += Math.max(0, workMs)
  }

  return Math.round(total / 60000)
}
