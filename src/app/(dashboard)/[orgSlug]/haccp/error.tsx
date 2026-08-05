'use client'

import { Button } from '@/components/ui/button'

export default function HaccpError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-xl font-medium text-ap-green-900">Erreur de chargement</h2>
      <p className="mt-2 text-ap-cream-700">Impossible de charger les plans HACCP.</p>
      <Button onClick={reset} className="mt-4 bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800">
        Réessayer
      </Button>
    </div>
  )
}
