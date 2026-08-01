'use client'

import { useState, useTransition } from 'react'
import { CalendarDays, Plus, CheckCircle2, AlertTriangle, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { PrevDailyPlan, PrevPlanRequirement, PrevRecipe, PrevLine, PrevMixer } from '@/types/database'
import { PLAN_STATUS_LABELS, STOCK_TYPE_LABELS, PRIORITY_LABELS } from '@/modules/prev-prod'
import { createDailyPlan, validatePlan, forceThreshold, deletePlan } from '../actions'
import { RequirementsTable } from './requirements-table'
import { LineRecaps } from './line-recaps'
import { MixerRecaps } from './mixer-recaps'

interface PlanDashboardProps {
  orgSlug: string
  plans: PrevDailyPlan[]
  requirements: PrevPlanRequirement[]
  recipes: Pick<PrevRecipe, 'id' | 'code' | 'name' | 'brand' | 'stock_type' | 'dispatch_priority' | 'min_batch_grams' | 'min_batch_exception'>[]
  lines: Pick<PrevLine, 'id' | 'name' | 'compatible_weights_grams'>[]
  mixers: Pick<PrevMixer, 'id' | 'name' | 'capacity_grams'>[]
  today: string
}

type ViewTab = 'besoins' | 'lignes' | 'melangeurs'

export function PlanDashboard({ orgSlug, plans, requirements, recipes, lines, mixers, today }: PlanDashboardProps) {
  const [selectedDate, setSelectedDate] = useState(today)
  const [isPending, startTransition] = useTransition()
  const [viewTab, setViewTab] = useState<ViewTab>('besoins')

  const activePlan = plans.find((p) => p.plan_date === selectedDate)
  const recipeMap = new Map(recipes.map((r) => [r.id, r]))

  function handleCreatePlan() {
    startTransition(async () => {
      const result = await createDailyPlan(orgSlug, selectedDate)
      if ('error' in result) {
        if (result.planId) toast.info('Un plan existe déjà pour cette date')
        else toast.error(result.error)
      } else {
        toast.success('Plan créé et besoins calculés')
      }
    })
  }

  function handleValidatePlan() {
    if (!activePlan) return
    startTransition(async () => {
      const result = await validatePlan(orgSlug, activePlan.id)
      if ('error' in result) toast.error(result.error)
      else toast.success('Plan validé')
    })
  }

  function handleDeletePlan() {
    if (!activePlan) return
    startTransition(async () => {
      const result = await deletePlan(orgSlug, activePlan.id)
      if ('error' in result) toast.error(result.error)
      else toast.success('Plan supprimé')
    })
  }

  function handleForceThreshold(reqId: string) {
    startTransition(async () => {
      const result = await forceThreshold(orgSlug, reqId)
      if ('error' in result) toast.error(result.error)
      else toast.success('Seuil forcé')
    })
  }

  const totalWeight = requirements.reduce((s, r) => s + r.total_weight_with_loss_grams, 0)
  const belowThresholdCount = requirements.filter((r) => r.below_threshold && !r.threshold_forced).length

  const VIEW_TABS = [
    { key: 'besoins' as const, label: 'Besoins nets' },
    { key: 'lignes' as const, label: `Lignes (${lines.length})` },
    { key: 'melangeurs' as const, label: `Mélangeurs (${mixers.length})` },
  ]

  return (
    <div>
      {/* Date selector + actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-ap-cream-600" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-44"
          />
        </div>

        {activePlan ? (
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              activePlan.status === 'validated' ? 'bg-green-100 text-green-800'
              : activePlan.status === 'in_progress' ? 'bg-blue-100 text-blue-800'
              : activePlan.status === 'done' ? 'bg-ap-cream-200 text-ap-cream-700'
              : 'bg-amber-100 text-amber-800'
            }`}>
              {activePlan.status === 'validated' && <CheckCircle2 className="h-3 w-3" />}
              {PLAN_STATUS_LABELS[activePlan.status]}
            </span>
            {activePlan.status === 'draft' && (
              <>
                <Button onClick={handleValidatePlan} disabled={isPending} size="sm" className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Valider
                </Button>
                <Button onClick={handleDeletePlan} disabled={isPending} size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                  Supprimer
                </Button>
              </>
            )}
          </div>
        ) : (
          <Button onClick={handleCreatePlan} disabled={isPending} className="gap-2">
            <Plus className="h-4 w-4" /> Créer le plan du {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Button>
        )}
      </div>

      {activePlan && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border border-ap-cream-200 bg-white p-4">
              <p className="text-xs text-ap-cream-600 mb-1">Recettes</p>
              <p className="text-2xl font-semibold text-ap-green-900">{requirements.length}</p>
            </div>
            <div className="rounded-xl border border-ap-cream-200 bg-white p-4">
              <p className="text-xs text-ap-cream-600 mb-1">Poids total</p>
              <p className="text-2xl font-semibold text-ap-green-900">{(totalWeight / 1000).toFixed(0)} kg</p>
            </div>
            <div className="rounded-xl border border-ap-cream-200 bg-white p-4">
              <p className="text-xs text-ap-cream-600 mb-1">Sous seuil</p>
              <p className={`text-2xl font-semibold ${belowThresholdCount > 0 ? 'text-amber-600' : 'text-ap-green-900'}`}>
                {belowThresholdCount}
              </p>
            </div>
            <div className="rounded-xl border border-ap-cream-200 bg-white p-4">
              <p className="text-xs text-ap-cream-600 mb-1">Statut</p>
              <p className="text-2xl font-semibold text-ap-green-900">{PLAN_STATUS_LABELS[activePlan.status]}</p>
            </div>
          </div>

          {/* View tabs */}
          <div className="flex gap-2 mb-4">
            {VIEW_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setViewTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  viewTab === t.key
                    ? 'bg-ap-green-800 text-white'
                    : 'bg-ap-cream-100 text-ap-cream-700 hover:bg-ap-cream-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {viewTab === 'besoins' && (
            <RequirementsTable
              requirements={requirements}
              recipeMap={recipeMap}
              onForceThreshold={handleForceThreshold}
              isPending={isPending}
            />
          )}
          {viewTab === 'lignes' && <LineRecaps lines={lines} requirements={requirements} recipeMap={recipeMap} />}
          {viewTab === 'melangeurs' && <MixerRecaps mixers={mixers} requirements={requirements} recipeMap={recipeMap} />}
        </>
      )}

      {!activePlan && (
        <div className="rounded-xl border border-ap-cream-200 bg-white p-12 text-center">
          <CalendarDays className="h-12 w-12 text-ap-cream-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-ap-green-900 mb-2">Pas de plan pour cette date</h3>
          <p className="text-sm text-ap-cream-600 mb-4">
            Sélectionnez une date et créez un plan pour calculer les besoins nets.
          </p>
        </div>
      )}
    </div>
  )
}
