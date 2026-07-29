'use client'

import { Button } from '@/components/ui/button'

export default function PointageError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h2 className="text-xl font-semibold text-ap-green-900 mb-2">
        Une erreur est survenue
      </h2>
      <p className="text-sm text-ap-cream-700 mb-4">
        Impossible de charger le module Point&apos;age.
      </p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  )
}
