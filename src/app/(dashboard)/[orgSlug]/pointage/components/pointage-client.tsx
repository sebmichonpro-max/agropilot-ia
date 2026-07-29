'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { RhEmployee, RhClockEvent, RhAgency, RhPosition } from '@/types/database'
import { PointageTabs } from './pointage-tabs'
import { RhKpiCards } from './rh-kpi-cards'
import { EmployeeGrid } from './employee-grid'

interface PointageClientProps {
  employees: RhEmployee[]
  events: RhClockEvent[]
  agencies: RhAgency[]
  positions: RhPosition[]
  orgSlug: string
  isAdmin: boolean
}

export function PointageClient({
  employees,
  events,
  agencies,
  positions,
  orgSlug,
  isAdmin,
}: PointageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isKiosk = searchParams.get('mode') === 'kiosk'

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <div className={isKiosk ? 'max-w-5xl mx-auto px-4 py-6' : ''}>
      {!isKiosk && (
        <>
          <h1 className="text-2xl font-semibold text-ap-green-900 mb-4">Point&apos;age</h1>
          <PointageTabs orgSlug={orgSlug} isAdmin={isAdmin} />
          <RhKpiCards employees={employees} events={events} />
        </>
      )}

      <EmployeeGrid
        employees={employees}
        events={events}
        agencies={agencies}
        positions={positions}
        orgSlug={orgSlug}
        isAdmin={isAdmin}
        isKiosk={isKiosk}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
