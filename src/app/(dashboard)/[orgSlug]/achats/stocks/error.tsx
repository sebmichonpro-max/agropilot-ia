'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function StocksError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <p className="text-lg font-semibold">Une erreur est survenue</p>
          <p className="text-sm text-muted-foreground text-center">
            Impossible de charger les données de stocks. Veuillez réessayer.
          </p>
          <Button onClick={reset}>Réessayer</Button>
        </CardContent>
      </Card>
    </div>
  )
}
