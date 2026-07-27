'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KmBadge } from './km-badge'
import { formatWeight, formatDays } from '@/modules/km/formatters'
import type { KmResult, Pallet, ProductReference, StorageZone } from '@/modules/km/types'

interface AlertPanelProps {
  orgSlug: string
  alerts: {
    pallet: Pallet
    reference: ProductReference
    zone: StorageZone
    result: KmResult
  }[]
}

export function AlertPanel({ orgSlug, alerts }: AlertPanelProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune alerte en cours
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Top alertes ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert) => (
          <Link
            key={alert.pallet.id}
            href={`/${orgSlug}/achats/stocks/palettes/${alert.pallet.id}`}
            className="flex items-center justify-between rounded-md border p-2 hover:bg-accent transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {alert.reference.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {alert.zone.name} · {formatWeight(alert.pallet.current_quantity)} · {formatDays(alert.result.daysInStock)}
              </p>
            </div>
            <KmBadge value={alert.result.value} level={alert.result.level} />
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
