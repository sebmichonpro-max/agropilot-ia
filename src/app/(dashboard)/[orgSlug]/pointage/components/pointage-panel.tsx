'use client'

import { useState, useEffect, useTransition } from 'react'
import { ArrowLeft, LogIn, Coffee, Play, LogOut, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { RhEmployee, RhClockEvent, ClockEventType } from '@/types/database'
import { clockEvent, deleteClockEvent, deleteEmployeeDayEvents } from '../actions'
import {
  getEmployeeStatus,
  getStatusColor,
  getContractBadge,
  formatTime,
  getClockInTime,
  getTotalBreakMs,
  formatMinutes,
} from './pointage-utils'

interface PointagePanelProps {
  employee: RhEmployee
  events: RhClockEvent[]
  agencyName?: string
  isAdmin: boolean
  isKiosk: boolean
  orgSlug: string
  onBack: () => void
  onRefresh: () => void
}

const ACTIONS: {
  type: ClockEventType
  label: string
  icon: typeof LogIn
  bgColor: string
  textColor: string
  activeWhen: string[]
}[] = [
  {
    type: 'clock_in',
    label: 'ENTRÉE',
    icon: LogIn,
    bgColor: 'bg-[#e0f2e7]',
    textColor: 'text-[#1a3a2a]',
    activeWhen: ['absent', 'left'],
  },
  {
    type: 'break_start',
    label: 'PAUSE',
    icon: Coffee,
    bgColor: 'bg-[#faeeda]',
    textColor: 'text-[#854f0b]',
    activeWhen: ['present'],
  },
  {
    type: 'break_end',
    label: 'REPRISE',
    icon: Play,
    bgColor: 'bg-[#e6f1fb]',
    textColor: 'text-[#0c447c]',
    activeWhen: ['on_break'],
  },
  {
    type: 'clock_out',
    label: 'SORTIE',
    icon: LogOut,
    bgColor: 'bg-[#fcebeb]',
    textColor: 'text-[#a32d2d]',
    activeWhen: ['present'],
  },
]

export function PointagePanel({
  employee,
  events,
  agencyName,
  isAdmin,
  isKiosk,
  orgSlug,
  onBack,
  onRefresh,
}: PointagePanelProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const status = getEmployeeStatus(employee.id, events)
  const statusInfo = getStatusColor(status)
  const contractBadge = getContractBadge(employee.contract_type)

  useEffect(() => {
    if (confirmation && isKiosk) {
      const timer = setTimeout(() => {
        onBack()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [confirmation, isKiosk, onBack])

  function handleClock(eventType: ClockEventType, label: string) {
    startTransition(async () => {
      const result = await clockEvent(employee.id, eventType)
      if (result.error) {
        toast.error(result.error)
      } else {
        setConfirmation(label)
        toast.success(`${employee.full_name} — ${label}`)
        onRefresh()
      }
    })
  }

  async function handleDeleteLast() {
    if (events.length === 0) return
    const lastEvent = [...events].sort(
      (a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime()
    )[0]
    startTransition(async () => {
      const result = await deleteClockEvent(lastEvent.id)
      if (result.error) toast.error(result.error)
      else {
        toast.success('Dernier pointage annulé')
        onRefresh()
      }
    })
  }

  async function handleResetDay() {
    startTransition(async () => {
      const result = await deleteEmployeeDayEvents(employee.id)
      if (result.error) toast.error(result.error)
      else {
        toast.success('Journée réinitialisée')
        onRefresh()
      }
    })
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime()
  )

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-ap-green-900">{employee.full_name}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className={`${contractBadge.bg} ${contractBadge.text} px-2 py-0.5 rounded-full text-xs font-medium`}>
            {employee.contract_type}
          </span>
          {agencyName && <span className="text-sm text-ap-cream-700">{agencyName}</span>}
          {employee.position && <span className="text-sm text-ap-cream-700">· {employee.position}</span>}
        </div>
      </div>

      {/* Status banner */}
      <div className={`rounded-lg p-3 mb-6 flex items-center gap-2 ${
        status === 'present' ? 'bg-ap-green-100' :
        status === 'on_break' ? 'bg-amber-50' :
        status === 'left' ? 'bg-red-50' : 'bg-gray-100'
      }`}>
        <span className={`h-3 w-3 rounded-full ${statusInfo.dot}`} />
        <span className={`text-sm font-medium ${statusInfo.labelColor}`}>{statusInfo.label}</span>
      </div>

      {/* Confirmation banner */}
      {confirmation && (
        <div className="rounded-lg bg-ap-green-100 p-4 mb-6 text-center">
          <p className="text-lg font-bold text-ap-green-900">{confirmation}</p>
          <p className="text-sm text-ap-green-700">
            {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {isKiosk && <p className="text-xs text-ap-green-600 mt-1">Retour automatique...</p>}
        </div>
      )}

      {/* 4 action buttons */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        {ACTIONS.map((action) => {
          const Icon = action.icon
          const isActive = action.activeWhen.includes(status)
          return (
            <button
              key={action.type}
              onClick={() => handleClock(action.type, action.label)}
              disabled={!isActive || isPending}
              className={`${action.bgColor} ${action.textColor} rounded-lg py-5 px-6 text-lg font-bold flex items-center justify-center gap-3 transition-opacity ${
                isActive ? 'hover:opacity-80' : 'opacity-20 cursor-not-allowed'
              }`}
            >
              <Icon className="h-6 w-6" />
              {action.label}
            </button>
          )
        })}
      </div>

      {/* Admin actions */}
      {isAdmin && !isKiosk && (
        <div className="flex gap-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteLast}
            disabled={isPending || events.length === 0}
            className="text-amber-700 border-amber-300 hover:bg-amber-50"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Annuler dernier
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDay}
            disabled={isPending || events.length === 0}
            className="text-red-700 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            RAZ journée
          </Button>
        </div>
      )}

      {/* Today's log */}
      {sortedEvents.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-ap-green-900 mb-2">Historique du jour</h3>
          <div className="space-y-1">
            {sortedEvents.map((evt) => {
              const actionInfo = ACTIONS.find((a) => a.type === evt.event_type)
              return (
                <div key={evt.id} className="flex items-center gap-2 text-sm">
                  <span className="text-ap-cream-700 tabular-nums">{formatTime(evt.event_time)}</span>
                  <span className={actionInfo?.textColor ?? 'text-ap-cream-800'}>
                    {actionInfo?.label ?? evt.event_type}
                  </span>
                  {evt.is_manual && <span className="text-xs text-ap-cream-600">(admin)</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Back button */}
      <Button variant="outline" onClick={onBack} className="w-full">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>
    </div>
  )
}
