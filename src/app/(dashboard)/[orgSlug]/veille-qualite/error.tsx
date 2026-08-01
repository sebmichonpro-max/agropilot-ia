'use client'

export default function VeilleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <p className="text-red-700 font-medium mb-2">
        Erreur lors du chargement de la veille qualité
      </p>
      <p className="text-sm text-red-600 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
      >
        Réessayer
      </button>
    </div>
  )
}
