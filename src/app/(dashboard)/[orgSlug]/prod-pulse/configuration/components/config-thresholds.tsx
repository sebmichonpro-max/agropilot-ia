'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { TrsThreshold } from '@/types/database'
import { updateThresholds } from '../../actions'
import { DEFAULT_THRESHOLDS } from '../../lib/trs-constants'

interface ConfigThresholdsProps {
  orgSlug: string
  thresholds: TrsThreshold | null
}

export function ConfigThresholds({ orgSlug, thresholds }: ConfigThresholdsProps) {
  const t = thresholds ?? DEFAULT_THRESHOLDS
  const [excellent, setExcellent] = useState(t.excellent_min / 100)
  const [good, setGood] = useState(t.good_min / 100)
  const [warning, setWarning] = useState(t.warning_min / 100)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const result = await updateThresholds(orgSlug, {
        excellent_min: Math.round(excellent * 100),
        good_min: Math.round(good * 100),
        warning_min: Math.round(warning * 100),
      })
      if ('error' in result) toast.error(result.error)
      else toast.success('Seuils mis à jour')
    })
  }

  return (
    <div>
      <div className="rounded-xl border border-ap-cream-200 bg-white p-5 mb-6">
        <h3 className="text-lg font-medium text-ap-green-900 mb-4">Seuils TRS</h3>
        <p className="text-sm text-ap-cream-700 mb-4">
          Définissez les niveaux de performance pour vos lignes de production.
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="thExcellent" className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-ap-green-100 border border-ap-green-300" />
              Excellent (min)
            </Label>
            <div className="flex items-center gap-3 mt-1">
              <Input
                id="thExcellent"
                type="number"
                step="0.5"
                min={0}
                max={100}
                value={excellent}
                onChange={(e) => setExcellent(parseFloat(e.target.value) || 0)}
                className="w-32"
              />
              <span className="text-sm text-ap-cream-700">%</span>
              <span className="text-xs text-ap-cream-600">≥ {excellent}% = Excellent</span>
            </div>
          </div>

          <div>
            <Label htmlFor="thGood" className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-ap-green-300" />
              Bon (min)
            </Label>
            <div className="flex items-center gap-3 mt-1">
              <Input
                id="thGood"
                type="number"
                step="0.5"
                min={0}
                max={100}
                value={good}
                onChange={(e) => setGood(parseFloat(e.target.value) || 0)}
                className="w-32"
              />
              <span className="text-sm text-ap-cream-700">%</span>
              <span className="text-xs text-ap-cream-600">{good}% – {excellent - 0.1}%</span>
            </div>
          </div>

          <div>
            <Label htmlFor="thWarning" className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-amber-300" />
              Alerte (min)
            </Label>
            <div className="flex items-center gap-3 mt-1">
              <Input
                id="thWarning"
                type="number"
                step="0.5"
                min={0}
                max={100}
                value={warning}
                onChange={(e) => setWarning(parseFloat(e.target.value) || 0)}
                className="w-32"
              />
              <span className="text-sm text-ap-cream-700">%</span>
              <span className="text-xs text-ap-cream-600">{warning}% – {good - 0.1}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-ap-cream-700">
            <span className="inline-block w-3 h-3 rounded-full bg-red-300" />
            Critique : &lt; {warning}%
          </div>
        </div>

        <Button onClick={handleSave} disabled={isPending} className="mt-6">
          Enregistrer les seuils
        </Button>
      </div>

      {/* Visual preview */}
      <div className="rounded-xl border border-ap-cream-200 bg-white p-5">
        <h3 className="text-lg font-medium text-ap-green-900 mb-4">Aperçu</h3>
        <div className="h-6 rounded-full overflow-hidden flex">
          <div className="bg-red-200 flex items-center justify-center text-xs" style={{ width: `${warning}%` }}>
            <span className="text-red-800 font-medium">Critique</span>
          </div>
          <div className="bg-amber-200 flex items-center justify-center text-xs" style={{ width: `${good - warning}%` }}>
            <span className="text-amber-800 font-medium">Alerte</span>
          </div>
          <div className="bg-ap-green-200 flex items-center justify-center text-xs" style={{ width: `${excellent - good}%` }}>
            <span className="text-ap-green-800 font-medium">Bon</span>
          </div>
          <div className="bg-ap-green-100 flex items-center justify-center text-xs" style={{ width: `${100 - excellent}%` }}>
            <span className="text-ap-green-800 font-medium">Excellent</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-ap-cream-600 mt-1">
          <span>0%</span>
          <span>{warning}%</span>
          <span>{good}%</span>
          <span>{excellent}%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  )
}
