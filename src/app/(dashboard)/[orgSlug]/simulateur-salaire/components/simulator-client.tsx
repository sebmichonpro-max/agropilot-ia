'use client'

import { useState } from 'react'
import type { SimulationInputs, SimulationResults, SimSettings } from '@/types/database'
import { simulate } from '../lib/salary-engine'
import { SimulTabs } from './simul-tabs'
import { SalaryForm } from './salary-form'
import { ResultSummary } from './result-summary'
import { ResultBreakdown } from './result-breakdown'
import { ResultCharts } from './result-charts'
import { PdfPreviewButton } from './pdf-preview-button'

interface SimulatorClientProps {
  orgSlug: string
  settings: SimSettings | null
}

export function SimulatorClient({ orgSlug, settings }: SimulatorClientProps) {
  const [results, setResults] = useState<SimulationResults | null>(null)
  const [currentInputs, setCurrentInputs] = useState<SimulationInputs | null>(null)

  function handleSimulate(inputs: SimulationInputs) {
    const res = simulate(inputs, settings ?? undefined)
    setResults(res)
    setCurrentInputs(inputs)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ap-green-900 mb-4">Simul&apos;Paie</h1>
      <SimulTabs orgSlug={orgSlug} />

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        {/* Formulaire */}
        <div>
          <SalaryForm onSimulate={handleSimulate} isPending={false} />
        </div>

        {/* Résultats */}
        <div className="space-y-4">
          {results && currentInputs ? (
            <>
              <ResultSummary results={results} mode={currentInputs.mode} />
              <ResultBreakdown
                lines={results.detail}
                totalSalarial={results.cotisationsSalariales}
                totalPatronal={results.cotisationsPatronales}
                rgdu={results.rgdu}
              />
              <ResultCharts results={results} />
              <PdfPreviewButton
                inputs={currentInputs}
                results={results}
                companyName={settings?.company_name}
              />
            </>
          ) : (
            <div className="rounded-xl border border-ap-cream-200 bg-white p-12 text-center">
              <p className="text-ap-cream-600 text-lg">
                Remplissez le formulaire et cliquez sur Calculer
              </p>
              <p className="text-ap-cream-500 text-sm mt-2">
                Le simulateur utilise les taux URSSAF/AGIRC-ARRCO 2026 et la CCN IDCC 1396
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
