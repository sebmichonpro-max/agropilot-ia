'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { addProductLabor, removeProductLabor } from '../../actions'
import { formatCents } from '../../lib/cost-calculations'

interface LaborEditorProps {
  orgSlug: string
  sheetId: string
  assignments: Array<{
    id: string
    pole_id: string
    headcount_override: number | null
    rate_override_cents: number | null
    labor_poles: { name: string; default_headcount: number; hourly_rate_cents: number } | null
  }>
  poles: Array<{ id: string; name: string; default_headcount: number; hourly_rate_cents: number }>
  cadence: number | null
}

export function LaborEditor({ orgSlug, sheetId, assignments, poles, cadence }: LaborEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [poleId, setPoleId] = useState('')

  const totalHourlyCents = assignments.reduce((sum, a) => {
    const hc = a.headcount_override ?? a.labor_poles?.default_headcount ?? 1
    const rate = a.rate_override_cents ?? a.labor_poles?.hourly_rate_cents ?? 0
    return sum + hc * rate
  }, 0)

  const laborPerUnit = cadence && cadence > 0 ? Math.round(totalHourlyCents / cadence) : 0

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!poleId) { toast.error('Sélectionnez un pôle'); return }
    startTransition(async () => {
      const res = await addProductLabor(orgSlug, {
        product_sheet_id: sheetId,
        pole_id: poleId,
      })
      if (res.error) { toast.error(res.error); return }
      toast.success('Pôle ajouté')
      setPoleId('')
      router.refresh()
    })
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeProductLabor(orgSlug, id, sheetId)
      toast.success('Pôle retiré')
      router.refresh()
    })
  }

  const assignedPoleIds = new Set(assignments.map((a) => a.pole_id))
  const availablePoles = poles.filter((p) => !assignedPoleIds.has(p.id))

  return (
    <div className="rounded-xl border border-ap-cream-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-ap-green-900">Pôles de main-d&apos;œuvre affectés</h3>
        <div className="text-right">
          <p className="text-sm text-ap-cream-700">Coût MO horaire : {formatCents(totalHourlyCents)}/h</p>
          {cadence ? (
            <p className="text-sm font-medium text-ap-green-900">Coût MO unitaire : {formatCents(laborPerUnit)}</p>
          ) : (
            <p className="text-xs text-amber-700">Renseignez la cadence dans Infos pour calculer le coût unitaire</p>
          )}
        </div>
      </div>

      {assignments.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ap-cream-300">
              <th className="text-left px-3 py-2 text-ap-cream-700 font-normal">Pôle</th>
              <th className="text-right px-3 py-2 text-ap-cream-700 font-normal">Effectif</th>
              <th className="text-right px-3 py-2 text-ap-cream-700 font-normal">Taux horaire</th>
              <th className="text-right px-3 py-2 text-ap-cream-700 font-normal">Coût/h</th>
              <th className="w-10 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => {
              const hc = a.headcount_override ?? a.labor_poles?.default_headcount ?? 1
              const rate = a.rate_override_cents ?? a.labor_poles?.hourly_rate_cents ?? 0
              return (
                <tr key={a.id} className="border-b border-ap-cream-200">
                  <td className="px-3 py-2 text-ap-green-900 font-medium">{a.labor_poles?.name ?? '—'}</td>
                  <td className="text-right px-3 py-2 text-ap-cream-800">{hc}</td>
                  <td className="text-right px-3 py-2 text-ap-cream-800">{formatCents(rate)}/h</td>
                  <td className="text-right px-3 py-2 font-medium text-ap-green-900">{formatCents(hc * rate)}/h</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleRemove(a.id)}
                      disabled={isPending}
                      className="p-1 rounded hover:bg-red-50 text-ap-cream-600 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {availablePoles.length > 0 && (
        <form onSubmit={handleAdd} className="flex items-end gap-3 pt-2 border-t border-ap-cream-200">
          <div className="flex-1">
            <label className="block text-xs text-ap-cream-700 mb-1">Ajouter un pôle</label>
            <select
              value={poleId}
              onChange={(e) => setPoleId(e.target.value)}
              className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">— Choisir —</option>
              {availablePoles.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.default_headcount} pers. × {formatCents(p.hourly_rate_cents)}/h)</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-ap-green-900 text-ap-green-100 text-sm font-medium hover:bg-ap-green-800 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </form>
      )}
    </div>
  )
}
