'use client'

import { useEffect, useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import type { RhEmployee, RhClockEvent } from '@/types/database'
import {
  getEmployeeStatus,
  getStatusColor,
  getContractBadge,
  getClockInTime,
  getTotalBreakMs,
  formatMinutes,
} from './pointage-utils'
import { deleteEmployee } from '../actions'

interface EmployeeCardProps {
  employee: RhEmployee
  events: RhClockEvent[]
  agencyName?: string
  onClick: () => void
  showCost?: boolean
  isAdmin?: boolean
  onDelete?: () => void
}

export function EmployeeCard({
  employee,
  events,
  agencyName,
  onClick,
  showCost,
  isAdmin,
  onDelete,
}: EmployeeCardProps) {
  const [isPending, startTransition] = useTransition()
  const status = getEmployeeStatus(employee.id, events)
  const statusInfo = getStatusColor(status)
  const contractBadge = getContractBadge(employee.contract_type)
  const clockInTime = getClockInTime(employee.id, events)

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Supprimer ${employee.full_name} ?`)) return
    startTransition(async () => {
      const res = await deleteEmployee(employee.id)
      if (res.error) toast.error(res.error)
      else {
        toast.success(`${employee.full_name} supprimé`)
        onDelete?.()
      }
    })
  }

  return (
    <div
      onClick={onClick}
      className="relative rounded-xl border border-ap-cream-200 bg-white p-3 hover:border-ap-green-300 hover:shadow-sm transition-all cursor-pointer"
    >
      {/* Delete button (admin) */}
      {isAdmin && (
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
          aria-label={`Supprimer ${employee.full_name}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Status dot */}
      <span className={`absolute top-2 right-2 h-2.5 w-2.5 rounded-full ${statusInfo.dot}`} />

      {/* Name */}
      <p className="font-medium text-sm text-ap-green-900 truncate pr-5">
        {employee.full_name}
      </p>

      {/* Agency + Position */}
      {agencyName && (
        <p className="text-xs text-ap-cream-600 italic truncate">{agencyName}</p>
      )}
      {employee.position && (
        <p className="text-xs text-ap-cream-700 italic truncate">{employee.position}</p>
      )}

      {/* Contract badge */}
      <span
        className={`inline-block mt-1.5 ${contractBadge.bg} ${contractBadge.text} px-2 py-0.5 rounded-full text-xs font-medium`}
      >
        {employee.contract_type}
      </span>

      {/* Live timer */}
      {(status === 'present' || status === 'on_break') && clockInTime && (
        <LiveTimer
          clockInTime={clockInTime}
          totalBreakMs={getTotalBreakMs(employee.id, events)}
          isPaused={status === 'on_break'}
        />
      )}

      {/* Cost (admin only) */}
      {showCost && employee.hourly_cost_cents > 0 && (
        <p className="text-xs text-ap-cream-600 mt-1">
          {(employee.hourly_cost_cents / 100).toFixed(2)} €/h
        </p>
      )}
    </div>
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
    <p className={`text-xs font-medium mt-1 ${isPaused ? 'text-amber-700' : 'text-ap-green-700'}`}>
      {isPaused ? '⏸ ' : '⏱ '}
      {formatMinutes(elapsed)}
    </p>
  )
}
