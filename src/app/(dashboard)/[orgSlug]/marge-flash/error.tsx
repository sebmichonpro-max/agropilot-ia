'use client'

import { Button } from '@/components/ui/button'

export default function MargeFlashError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-lg font-medium text-ap-green-900 mb-2">
        Une erreur est survenue
      </p>
      <p className="text-sm text-ap-cream-700 mb-6 max-w-md">
        {error.message || 'Le module Marge Flash a rencontré un problème.'}
      </p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  )
}
