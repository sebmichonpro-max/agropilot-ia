'use client'

import type { SimulationResults, SimMode } from '@/types/database'

interface ResultSummaryProps {
  results: SimulationResults
  mode: SimMode
}

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function ResultSummary({ results, mode }: ResultSummaryProps) {
  const ratio = results.netAvantImpot > 0
    ? (results.coutEmployeur / results.netAvantImpot).toFixed(2)
    : '—'

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className={`rounded-lg p-4 ${mode === 'employeur' ? 'bg-ap-green-100 ring-2 ring-ap-green-300' : 'bg-ap-green-100'}`}>
          <p className="text-xs text-ap-green-800 mb-1">Coût employeur</p>
          <p className="text-2xl font-medium text-ap-green-900">{formatCurrency(results.coutEmployeur)} €</p>
          <p className="text-xs text-ap-green-700 mt-1">{formatCurrency(results.coutAnnuel)} €/an</p>
        </div>

        <div className={`rounded-lg p-4 ${mode === 'salarie' ? 'bg-blue-50 ring-2 ring-blue-200' : 'bg-blue-50'}`}>
          <p className="text-xs text-blue-700 mb-1">Salaire net</p>
          <p className="text-2xl font-medium text-blue-900">{formatCurrency(results.netAvantImpot)} €</p>
          <p className="text-xs text-blue-600 mt-1">{formatCurrency(results.netAvantImpot * 12)} €/an</p>
        </div>

        <div className="rounded-lg p-4 bg-amber-50">
          <p className="text-xs text-amber-800 mb-1">Charges totales</p>
          <p className="text-2xl font-medium text-amber-900">
            {formatCurrency(results.cotisationsSalariales + results.cotisationsPatronales - results.rgdu)} €
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Sal. {formatCurrency(results.cotisationsSalariales)} + Pat. {formatCurrency(results.cotisationsPatronales - results.rgdu)}
          </p>
        </div>
      </div>

      {/* Ratio */}
      <p className="text-sm text-ap-cream-700 text-center mb-4">
        Pour <span className="font-medium text-ap-green-900">1 € net</span> versé, l&apos;entreprise dépense{' '}
        <span className="font-medium text-ap-green-900">{ratio} €</span>
      </p>

      {/* Décomposition du brut */}
      <div className="rounded-lg border border-ap-cream-200 bg-white p-4 mb-4">
        <h3 className="text-sm font-medium text-ap-green-900 mb-3">Décomposition du brut</h3>
        <div className="space-y-1.5 text-sm">
          {results.isForfaitJour ? (
            <>
              <div className="flex justify-between text-ap-cream-800">
                <span>Salaire mensuel ({formatCurrency(results.baseSalary * 12)} € / 12)</span>
                <span className="font-medium">{formatCurrency(results.baseSalary)} €</span>
              </div>
              <div className="flex justify-between text-ap-cream-600 text-xs">
                <span>Taux journalier indicatif</span>
                <span>{formatCurrency(results.tauxJournalier)} €/jour</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-ap-cream-800">
                <span>Salaire de base (151,67h × {(results.baseSalary / 151.67).toFixed(2)} €)</span>
                <span className="font-medium">{formatCurrency(results.baseSalary)} €</span>
              </div>
              {results.hsAmount > 0 && (
                <div className="flex justify-between text-ap-cream-800">
                  <span>Heures sup 25% ({results.hsMonthly.toFixed(2)}h)</span>
                  <span className="font-medium">{formatCurrency(results.hsAmount)} €</span>
                </div>
              )}
            </>
          )}
          {results.anciennete > 0 && (
            <div className="flex justify-between text-ap-cream-800">
              <span>Prime d&apos;ancienneté</span>
              <span className="font-medium">{formatCurrency(results.anciennete)} €</span>
            </div>
          )}
          {results.treizieme > 0 && (
            <div className="flex justify-between text-ap-cream-800">
              <span>13ème mois (mensualisé)</span>
              <span className="font-medium">{formatCurrency(results.treizieme)} €</span>
            </div>
          )}
          {results.primeExceptionnelle > 0 && (
            <div className="flex justify-between text-ap-cream-800">
              <span>Prime exceptionnelle</span>
              <span className="font-medium">{formatCurrency(results.primeExceptionnelle)} €</span>
            </div>
          )}
          <div className="flex justify-between pt-1.5 border-t border-ap-cream-200 font-medium text-ap-green-900">
            <span>BRUT TOTAL</span>
            <span>{formatCurrency(results.brut)} €</span>
          </div>
        </div>
      </div>

      {/* RTT */}
      {results.rtt > 0 && (
        <p className="text-xs text-ap-cream-600 text-center">
          RTT : environ {results.rtt} jours/an
        </p>
      )}
    </div>
  )
}
