'use client'

interface TrsKpiCardsProps {
  sessionCount: number
  totalLossCents: number
}

export function TrsKpiCards({ sessionCount, totalLossCents }: TrsKpiCardsProps) {
  const lossEuros = (totalLossCents / 100).toFixed(0)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
      <div className="rounded-lg bg-ap-green-100 p-4">
        <p className="text-xs text-ap-green-800 mb-1">Sessions analysées</p>
        <p className="text-2xl font-medium text-ap-green-900">{sessionCount}</p>
      </div>
      <div className={`rounded-lg p-4 ${totalLossCents > 0 ? 'bg-red-50' : 'bg-ap-green-100'}`}>
        <p className={`text-xs mb-1 ${totalLossCents > 0 ? 'text-red-700' : 'text-ap-green-800'}`}>
          Perte estimée
        </p>
        <p className={`text-2xl font-medium ${totalLossCents > 0 ? 'text-red-800' : 'text-ap-green-900'}`}>
          {totalLossCents > 0 ? `${lossEuros} €` : '0 €'}
        </p>
        <p className="text-xs text-ap-cream-600 mt-1">Basé sur le coût horaire des lignes</p>
      </div>
    </div>
  )
}
