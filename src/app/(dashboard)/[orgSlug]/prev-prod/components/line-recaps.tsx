'use client'

import { Printer } from 'lucide-react'
import type { PrevPlanRequirement, PrevRecipe, PrevLine } from '@/types/database'

interface LineRecapsProps {
  lines: Pick<PrevLine, 'id' | 'name' | 'compatible_weights_grams'>[]
  requirements: PrevPlanRequirement[]
  recipeMap: Map<string, Pick<PrevRecipe, 'id' | 'code' | 'name' | 'brand' | 'stock_type' | 'dispatch_priority' | 'min_batch_grams' | 'min_batch_exception'>>
}

export function LineRecaps({ lines, requirements, recipeMap }: LineRecapsProps) {
  if (lines.length === 0) {
    return (
      <div className="rounded-xl border border-ap-cream-200 bg-white p-8 text-center text-ap-cream-600">
        Aucune ligne de conditionnement configurée. Ajoutez-en dans la configuration.
      </div>
    )
  }

  const totalWeightByLine = new Map<string, number>()
  for (const req of requirements) {
    for (const line of lines) {
      const weight = Math.round(req.total_weight_with_loss_grams / lines.length)
      totalWeightByLine.set(line.id, (totalWeightByLine.get(line.id) ?? 0) + weight)
    }
  }

  return (
    <div className="space-y-4">
      {lines.map((line) => {
        const lineWeight = totalWeightByLine.get(line.id) ?? 0
        const lineRecipes = requirements.filter(() => true)

        return (
          <div key={line.id} className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden print:break-inside-avoid">
            <div className="flex items-center justify-between px-4 py-3 bg-ap-cream-50 border-b border-ap-cream-200">
              <div>
                <h3 className="font-medium text-ap-green-900">{line.name}</h3>
                <p className="text-xs text-ap-cream-600">
                  Formats : {line.compatible_weights_grams.length > 0
                    ? line.compatible_weights_grams.map((w) => `${w}g`).join(', ')
                    : 'Tous'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-ap-green-900">
                  {(lineWeight / 1000).toFixed(0)} kg
                </span>
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded hover:bg-ap-cream-200 text-ap-cream-700"
                  aria-label="Imprimer"
                >
                  <Printer className="h-4 w-4" />
                </button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ap-cream-200">
                  <th className="text-left px-4 py-2 text-ap-cream-600 font-normal text-xs">#</th>
                  <th className="text-left px-4 py-2 text-ap-cream-600 font-normal text-xs">Recette</th>
                  <th className="text-right px-4 py-2 text-ap-cream-600 font-normal text-xs">Pièces</th>
                  <th className="text-right px-4 py-2 text-ap-cream-600 font-normal text-xs">Poids</th>
                </tr>
              </thead>
              <tbody>
                {lineRecipes.length > 0 ? lineRecipes.map((req, idx) => {
                  const recipe = recipeMap.get(req.recipe_id)
                  const weight = Math.round(req.total_weight_with_loss_grams / lines.length)
                  return (
                    <tr key={req.id} className="border-b border-ap-cream-100 hover:bg-ap-cream-50">
                      <td className="px-4 py-2 text-ap-cream-500">{idx + 1}</td>
                      <td className="px-4 py-2 font-medium text-ap-green-900">
                        {recipe?.dispatch_priority === 'matin' ? '⚡ ' : ''}{recipe?.name ?? '?'}
                      </td>
                      <td className="px-4 py-2 text-right text-ap-cream-800">
                        {Math.round(req.net_requirement_pieces / lines.length)}
                      </td>
                      <td className="px-4 py-2 text-right text-ap-cream-800">
                        {(weight / 1000).toFixed(1)} kg
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-ap-cream-500">
                      Aucune recette affectée à cette ligne
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
