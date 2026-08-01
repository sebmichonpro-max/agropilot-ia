'use client'

import { AlertTriangle, Zap, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PrevPlanRequirement, PrevRecipe } from '@/types/database'
import { STOCK_TYPE_LABELS, PRIORITY_LABELS, FORECAST_METHOD_LABELS } from '@/modules/prev-prod'

interface RequirementsTableProps {
  requirements: PrevPlanRequirement[]
  recipeMap: Map<string, Pick<PrevRecipe, 'id' | 'code' | 'name' | 'brand' | 'stock_type' | 'dispatch_priority' | 'min_batch_grams' | 'min_batch_exception'>>
  onForceThreshold: (reqId: string) => void
  isPending: boolean
}

export function RequirementsTable({ requirements, recipeMap, onForceThreshold, isPending }: RequirementsTableProps) {
  if (requirements.length === 0) {
    return (
      <div className="rounded-xl border border-ap-cream-200 bg-white p-8 text-center text-ap-cream-600">
        Aucun besoin net calculé pour ce plan. Vérifiez que des commandes et/ou des stocks sont importés.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ap-cream-300 bg-ap-cream-50">
              <th className="text-left px-4 py-3 text-ap-cream-700 font-normal">Recette</th>
              <th className="text-left px-4 py-3 text-ap-cream-700 font-normal hidden md:table-cell">Type</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">Stock</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">Cdes</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal hidden lg:table-cell">Cible</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal hidden lg:table-cell">J+1</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal font-semibold">Besoin net</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">Poids (+perte)</th>
              <th className="text-center px-4 py-3 text-ap-cream-700 font-normal w-24">Statut</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req) => {
              const recipe = recipeMap.get(req.recipe_id)
              const isBelowThreshold = req.below_threshold && !req.threshold_forced

              return (
                <tr
                  key={req.id}
                  className={`border-b border-ap-cream-200 hover:bg-ap-cream-50 ${
                    isBelowThreshold ? 'bg-amber-50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {recipe?.dispatch_priority === 'matin' && (
                        <Zap className="h-4 w-4 text-red-500 shrink-0" aria-label="Priorité matin" />
                      )}
                      <div>
                        <p className="font-medium text-ap-green-900">{recipe?.name ?? 'Inconnu'}</p>
                        <p className="text-xs text-ap-cream-600">{recipe?.code}{recipe?.brand ? ` — ${recipe.brand}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ap-cream-700 hidden md:table-cell">
                    {STOCK_TYPE_LABELS[recipe?.stock_type ?? ''] ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-ap-cream-800">{req.current_stock_pieces ?? 0}</td>
                  <td className="px-4 py-3 text-right text-ap-cream-800">{req.orders_pieces ?? 0}</td>
                  <td className="px-4 py-3 text-right text-ap-cream-800 hidden lg:table-cell">{req.stock_target_pieces ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-ap-cream-800 hidden lg:table-cell">{req.coverage_j1_pieces ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ap-green-900">{req.net_requirement_pieces}</td>
                  <td className="px-4 py-3 text-right text-ap-cream-800">
                    {(req.total_weight_with_loss_grams / 1000).toFixed(1)} kg
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isBelowThreshold ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                          <AlertTriangle className="h-3.5 w-3.5" /> Sous seuil
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-6 px-2"
                          onClick={() => onForceThreshold(req.id)}
                          disabled={isPending}
                        >
                          Forcer
                        </Button>
                      </div>
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-ap-cream-50 font-medium">
              <td className="px-4 py-3 text-ap-green-900" colSpan={6}>Total</td>
              <td className="px-4 py-3 text-right text-ap-green-900">
                {requirements.reduce((s, r) => s + r.net_requirement_pieces, 0)} pcs
              </td>
              <td className="px-4 py-3 text-right text-ap-green-900">
                {(requirements.reduce((s, r) => s + r.total_weight_with_loss_grams, 0) / 1000).toFixed(0)} kg
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
