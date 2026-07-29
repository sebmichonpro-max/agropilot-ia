'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { RhEmployee, RhClockEvent, RhAgency, RhPosition } from '@/types/database'
import { PointageTabs } from './pointage-tabs'
import { RhKpiCards } from './rh-kpi-cards'
import { EmployeeGrid } from './employee-grid'
import { AdminDialog } from './admin-dialog'

interface PointageClientProps {
  employees: RhEmployee[]
  events: RhClockEvent[]
  agencies: RhAgency[]
  positions: RhPosition[]
  orgSlug: string
  canBeAdmin: boolean
}

export function PointageClient({
  employees,
  events,
  agencies,
  positions,
  orgSlug,
  canBeAdmin,
}: PointageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isKiosk = searchParams.get('mode') === 'kiosk'
  const [isAdminMode, setIsAdminMode] = useState(false)

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <div className={isKiosk ? 'max-w-5xl mx-auto px-4 py-6' : ''}>
      {!isKiosk && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-ap-green-900">Point&apos;age</h1>
            {canBeAdmin && (
              <AdminDialog isAdminMode={isAdminMode} onToggle={setIsAdminMode} />
            )}
          </div>
          <PointageTabs orgSlug={orgSlug} isAdmin={isAdminMode} />
          <RhKpiCards employees={employees} events={events} />
        </>
      )}

      <EmployeeGrid
        employees={employees}
        events={events}
        agencies={agencies}
        positions={positions}
        orgSlug={orgSlug}
        isAdmin={isAdminMode}
        isKiosk={isKiosk}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
