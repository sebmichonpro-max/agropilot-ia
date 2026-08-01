'use client'

import type { PrevPlanRequirement, PrevRecipe, PrevMixer } from '@/types/database'

interface MixerRecapsProps {
  mixers: Pick<PrevMixer, 'id' | 'name' | 'capacity_grams'>[]
  requirements: PrevPlanRequirement[]
  recipeMap: Map<string, Pick<PrevRecipe, 'id' | 'code' | 'name' | 'brand' | 'stock_type' | 'dispatch_priority' | 'min_batch_grams' | 'min_batch_exception'>>
}

function assignToMixers(
  requirements: PrevPlanRequirement[],
  mixers: Pick<PrevMixer, 'id' | 'name' | 'capacity_grams'>[],
): Map<string, PrevPlanRequirement[]> {
  const sorted = [...requirements].sort((a, b) => b.total_weight_with_loss_grams - a.total_weight_with_loss_grams)
  const assignment = new Map<string, PrevPlanRequirement[]>()
  for (const m of mixers) assignment.set(m.id, [])

  if (mixers.length === 0) return assignment

  const sortedMixers = [...mixers].sort((a, b) => b.capacity_grams - a.capacity_grams)

  for (const req of sorted) {
    const weight = req.total_weight_with_loss_grams
    let assigned = false

    for (const mixer of sortedMixers) {
      if (weight > 500000 && mixer.capacity_grams >= 900000) {
        assignment.get(mixer.id)!.push(req)
        assigned = true
        break
      }
      if (weight >= 300000 && weight <= 500000 && mixer.capacity_grams >= 400000 && mixer.capacity_grams < 900000) {
        assignment.get(mixer.id)!.push(req)
        assigned = true
        break
      }
    }

    if (!assigned) {
      const lightest = sortedMixers.reduce((best, m) => {
        const currentLoad = (assignment.get(m.id) ?? []).reduce((s, r) => s + r.total_weight_with_loss_grams, 0)
        const bestLoad = (assignment.get(best.id) ?? []).reduce((s, r) => s + r.total_weight_with_loss_grams, 0)
        return currentLoad < bestLoad ? m : best
      })
      assignment.get(lightest.id)!.push(req)
    }
  }

  return assignment
}

export function MixerRecaps({ mixers, requirements, recipeMap }: MixerRecapsProps) {
  if (mixers.length === 0) {
    return (
      <div className="rounded-xl border border-ap-cream-200 bg-white p-8 text-center text-ap-cream-600">
        Aucun mélangeur configuré. Ajoutez-en dans la configuration.
      </div>
    )
  }

  const assignment = assignToMixers(requirements, mixers)

  return (
    <div className="space-y-4">
      {mixers.map((mixer) => {
        const assigned = assignment.get(mixer.id) ?? []
        const totalCharge = assigned.reduce((s, r) => s + r.total_weight_with_loss_grams, 0)
        const chargeRatio = mixer.capacity_grams > 0 ? Math.round((totalCharge / mixer.capacity_grams) * 100) : 0

        return (
          <div key={mixer.id} className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-ap-cream-50 border-b border-ap-cream-200">
              <div>
                <h3 className="font-medium text-ap-green-900">{mixer.name}</h3>
                <p className="text-xs text-ap-cream-600">
                  Cap. {(mixer.capacity_grams / 1000).toFixed(0)} kg
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-ap-green-900">
                  {(totalCharge / 1000).toFixed(0)} kg — {assigned.length} recette(s)
                </p>
                <div className="w-32 h-2 rounded-full bg-ap-cream-200 mt-1">
                  <div
                    className={`h-2 rounded-full ${chargeRatio > 100 ? 'bg-red-500' : chargeRatio > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(chargeRatio, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ap-cream-200">
                  <th className="text-left px-4 py-2 text-ap-cream-600 font-normal text-xs">#</th>
                  <th className="text-left px-4 py-2 text-ap-cream-600 font-normal text-xs">Recette</th>
                  <th className="text-right px-4 py-2 text-ap-cream-600 font-normal text-xs">Poids</th>
                </tr>
              </thead>
              <tbody>
                {assigned.length > 0 ? assigned.map((req, idx) => {
                  const recipe = recipeMap.get(req.recipe_id)
                  return (
                    <tr key={req.id} className="border-b border-ap-cream-100 hover:bg-ap-cream-50">
                      <td className="px-4 py-2 text-ap-cream-500">{idx + 1}</td>
                      <td className="px-4 py-2 font-medium text-ap-green-900">
                        {recipe?.dispatch_priority === 'matin' ? '⚡ ' : ''}{recipe?.name ?? '?'}
                      </td>
                      <td className="px-4 py-2 text-right text-ap-cream-800">
                        {(req.total_weight_with_loss_grams / 1000).toFixed(1)} kg
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-ap-cream-500">
                      Aucune recette affectée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
