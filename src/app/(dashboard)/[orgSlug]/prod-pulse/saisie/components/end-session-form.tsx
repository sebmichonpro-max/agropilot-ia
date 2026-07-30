'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EndSessionFormProps {
  unitLabel: string
  isPending: boolean
  onSubmit: (qtyProduced: number, qtyConforming: number) => void
  onCancel: () => void
}

export function EndSessionForm({ unitLabel, isPending, onSubmit, onCancel }: EndSessionFormProps) {
  const [qtyProduced, setQtyProduced] = useState(0)
  const [qtyConforming, setQtyConforming] = useState(0)
  const [conformingLinked, setConformingLinked] = useState(true)

  function handleQtyChange(val: number) {
    setQtyProduced(val)
    if (conformingLinked) setQtyConforming(val)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="rounded-xl bg-white p-6 w-full max-w-md">
        <h2 className="text-xl font-medium text-ap-green-900 mb-4">Fin de lot</h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="qtyProduced">Quantité produite ({unitLabel}s)</Label>
            <Input
              id="qtyProduced"
              type="number"
              min={0}
              value={qtyProduced}
              onChange={(e) => handleQtyChange(parseInt(e.target.value) || 0)}
              className="mt-1 text-lg"
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="qtyConforming">Quantité conforme ({unitLabel}s)</Label>
              <button
                type="button"
                onClick={() => setConformingLinked(!conformingLinked)}
                className="text-xs text-ap-green-600 hover:underline"
              >
                {conformingLinked ? 'Modifier séparément' : 'Lier à la production'}
              </button>
            </div>
            <Input
              id="qtyConforming"
              type="number"
              min={0}
              max={qtyProduced}
              value={qtyConforming}
              onChange={(e) => { setQtyConforming(parseInt(e.target.value) || 0); setConformingLinked(false) }}
              className="mt-1 text-lg"
              disabled={conformingLinked}
            />
            {qtyProduced > 0 && qtyConforming < qtyProduced && (
              <p className="text-xs text-amber-700 mt-1">
                {qtyProduced - qtyConforming} rebut(s) — Qualité : {((qtyConforming / qtyProduced) * 100).toFixed(1)}%
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={() => onSubmit(qtyProduced, qtyConforming)} disabled={isPending || qtyProduced <= 0} className="flex-1">
            Valider le lot
          </Button>
          <Button variant="outline" onClick={onCancel}>Annuler</Button>
        </div>
      </div>
    </div>
  )
}
