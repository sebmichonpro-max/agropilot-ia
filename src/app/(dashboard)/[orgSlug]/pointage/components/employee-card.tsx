'use client'

import { useEffect, useState } from 'react'
import type { RhEmployee, RhClockEvent, EmployeeStatus } from '@/types/database'
import {
  getEmployeeStatus,
  getStatusColor,
  getContractBadge,
  getClockInTime,
  getTotalBreakMs,
  formatMinutes,
} from './pointage-utils'

interface EmployeeCardProps {
  employee: RhEmployee
  events: RhClockEvent[]
  agencyName?: string
  onClick: () => void
  showCost?: boolean
}

export function EmployeeCard({
  employee,
  events,
  agencyName,
  onClick,
  showCost,
}: EmployeeCardProps) {
  const status = getEmployeeStatus(employee.id, events)
  const statusInfo = getStatusColor(status)
  const contractBadge = getContractBadge(employee.contract_type)
  const clockInTime = getClockInTime(employee.id, events)

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-ap-cream-200 bg-white p-4 hover:border-ap-green-300 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-ap-green-900 truncate">
            {employee.full_name}
          </p>
          {employee.position && (
            <p className="text-xs text-ap-cream-700 italic truncate">
              {employee.position}
            </p>
          )}
        </div>
        <span className={`h-3 w-3 rounded-full ${statusInfo.dot} shrink-0 mt-1`} />
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={`${contractBadge.bg} ${contractBadge.text} px-2 py-0.5 rounded-full text-xs font-medium`}
        >
          {employee.contract_type}
        </span>
        {agencyName && (
          <span className="text-xs text-ap-cream-600 truncate">{agencyName}</span>
        )}
      </div>

      {(status === 'present' || status === 'on_break') && clockInTime && (
        <div className="mt-2">
          <LiveTimer
            clockInTime={clockInTime}
            totalBreakMs={getTotalBreakMs(employee.id, events)}
            isPaused={status === 'on_break'}
          />
        </div>
      )}

      {showCost && employee.hourly_cost_cents > 0 && (
        <p className="text-xs text-ap-cream-600 mt-1">
          {(employee.hourly_cost_cents / 100).toFixed(2)} €/h
        </p>
      )}
    </button>
  )
}

function LiveTimer({
  clockInTime,
  totalBreakMs,
  isPaused,
}: {
  clockInTime: Date
  totalBreakMs: number
  isPaused: boolean
}) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    function calc() {
      const now = Date.now()
      const raw = now - clockInTime.getTime() - totalBreakMs
      setElapsed(Math.max(0, Math.round(raw / 60000)))
    }
    calc()
    const id = setInterval(calc, 30000)
    return () => clearInterval(id)
  }, [clockInTime, totalBreakMs])

  return (
    <p className={`text-xs font-medium ${isPaused ? 'text-amber-700' : 'text-ap-green-700'}`}>
      {isPaused ? '⏸ ' : '⏱ '}
      {formatMinutes(elapsed)}
    </p>
  )
}
