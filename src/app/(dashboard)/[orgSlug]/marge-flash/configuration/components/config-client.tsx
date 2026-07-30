'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateMarginThresholds } from '../../actions'

interface ConfigClientProps {
  orgSlug: string
  thresholds: {
    good_min_bps: number
    warning_min_bps: number
    price_freshness_days: number
  } | null
}

export function ConfigClient({ orgSlug, thresholds }: ConfigClientProps) {
  const [isPending, startTransition] = useTransition()
  const [goodMin, setGoodMin] = useState(String((thresholds?.good_min_bps ?? 2000) / 100))
  const [warningMin, setWarningMin] = useState(String((thresholds?.warning_min_bps ?? 1000) / 100))
  const [freshnessDays, setFreshnessDays] = useState(String(thresholds?.price_freshness_days ?? 30))

  function handleSave() {
    const good = Math.round(parseFloat(goodMin) * 100)
    const warning = Math.round(parseFloat(warningMin) * 100)
    const days = parseInt(freshnessDays) || 30

    if (warning >= good) { toast.error('Le seuil alerte doit être inférieur au seuil bon'); return }

    startTransition(async () => {
      const res = await updateMarginThresholds(orgSlug, {
        good_min_bps: good,
        warning_min_bps: warning,
        price_freshness_days: days,
      })
      if (res.error) { toast.error(res.error); return }
      toast.success('Configuration enregistrée')
    })
  }

  const good = parseFloat(goodMin) || 20
  const warning = parseFloat(warningMin) || 10

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-xl border border-ap-cream-200 bg-white p-5 space-y-5">
        <h3 className="text-sm font-medium text-ap-green-900">Seuils de marge</h3>

        <div>
          <label htmlFor="good" className="block text-sm font-medium text-ap-green-900 mb-1">
            Seuil &quot;Bon&quot; (%)
          </label>
          <input
            id="good"
            type="number"
            step="0.1"
            min="0"
            value={goodMin}
            onChange={(e) => setGoodMin(e.target.value)}
            className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ap-green-500"
          />
          <p className="text-xs text-ap-cream-600 mt-1">Marge &ge; {good}% = badge vert</p>
        </div>

        <div>
          <label htmlFor="warning" className="block text-sm font-medium text-ap-green-900 mb-1">
            Seuil &quot;Alerte&quot; (%)
          </label>
          <input
            id="warning"
            type="number"
            step="0.1"
            min="0"
            value={warningMin}
            onChange={(e) => setWarningMin(e.target.value)}
            className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ap-green-500"
          />
          <p className="text-xs text-ap-cream-600 mt-1">Marge {warning}–{good}% = badge orange, &lt; {warning}% = badge rouge</p>
        </div>

        {/* Visual preview */}
        <div className="rounded-lg bg-ap-cream-100 p-3">
          <p className="text-xs text-ap-cream-700 mb-2">Aperçu des seuils</p>
          <div className="h-4 rounded-full overflow-hidden flex">
            <div className="bg-red-200" style={{ width: `${warning}%` }} />
            <div className="bg-amber-200" style={{ width: `${good - warning}%` }} />
            <div className="bg-ap-green-200" style={{ width: `${100 - good}%` }} />
          </div>
          <div className="flex justify-between text-xs text-ap-cream-600 mt-1">
            <span>0%</span>
            <span>{warning}%</span>
            <span>{good}%</span>
            <span>100%</span>
          </div>
          <div className="flex gap-3 text-xs mt-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-300" /> Critique/Perte</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-300" /> Alerte</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-ap-green-300" /> Bon</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-ap-cream-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-medium text-ap-green-900">Fraîcheur des prix</h3>
        <div>
          <label htmlFor="freshness" className="block text-sm font-medium text-ap-green-900 mb-1">
            Délai avant alerte (jours)
          </label>
          <input
            id="freshness"
            type="number"
            min="1"
            value={freshnessDays}
            onChange={(e) => setFreshnessDays(e.target.value)}
            className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ap-green-500"
          />
          <p className="text-xs text-ap-cream-600 mt-1">
            Les prix MP et packaging non mis à jour depuis {freshnessDays || 30} jours afficheront un avertissement
          </p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isPending}
        className="px-4 py-2 rounded-lg bg-ap-green-900 text-ap-green-100 text-sm font-medium hover:bg-ap-green-800 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  )
}
