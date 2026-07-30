'use client'

import { useState, useCallback } from 'react'
import { Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SimulationInputs, SimDuration, SimStatut, SimMode } from '@/types/database'
import { C2026 } from '../lib/salary-engine'

const DURATIONS: { value: SimDuration; label: string }[] = [
  { value: '35h', label: '35h' },
  { value: '37h30', label: '37h30' },
  { value: '39h', label: '39h' },
  { value: 'forfait_jour', label: 'Forfait jour' },
]

const SENIORITY_OPTIONS = [0, 3, 6, 9, 12, 15, 18, 21]

interface SalaryFormProps {
  onSimulate: (inputs: SimulationInputs) => void
  isPending: boolean
  initialInputs?: SimulationInputs
}

export function SalaryForm({ onSimulate, isPending, initialInputs }: SalaryFormProps) {
  const [mode, setMode] = useState<SimMode>(initialInputs?.mode ?? 'employeur')
  const [duration, setDuration] = useState<SimDuration>(initialInputs?.duration ?? '35h')

  // Mode horaire
  const [hourlyRate, setHourlyRate] = useState(initialInputs?.hourlyRate ?? C2026.SMIC_HORAIRE)
  const [monthlySalary, setMonthlySalary] = useState(
    initialInputs ? Math.round(initialInputs.hourlyRate * C2026.HOURS_35H * 100) / 100 : Math.round(C2026.SMIC_HORAIRE * C2026.HOURS_35H * 100) / 100
  )
  const [inputMode, setInputMode] = useState<'hourly' | 'monthly'>('hourly')
  const [extraHS, setExtraHS] = useState(initialInputs?.extraHS ?? 0)

  // Mode forfait jour
  const [salaryAnnual, setSalaryAnnual] = useState(initialInputs?.salaryAnnual ?? 36000)
  const [salaryMonthlyFJ, setSalaryMonthlyFJ] = useState(
    initialInputs?.salaryAnnual ? Math.round(initialInputs.salaryAnnual / 12 * 100) / 100 : 3000
  )
  const [fjInputMode, setFjInputMode] = useState<'annual' | 'monthly'>('annual')
  const [forfaitJours, setForfaitJours] = useState(initialInputs?.forfaitJours ?? 218)

  // Communs
  const [coefficient, setCoefficient] = useState(initialInputs?.coefficient ?? 200)
  const [statut, setStatut] = useState<SimStatut>(initialInputs?.statut ?? 'non_cadre')
  const [seniority, setSeniority] = useState(initialInputs?.seniority ?? 0)
  const [treizieme, setTreizieme] = useState(initialInputs?.treizieme ?? false)
  const [primeExceptionnelle, setPrimeExceptionnelle] = useState(initialInputs?.primeExceptionnelle ?? 0)

  const isForfaitJour = duration === 'forfait_jour'

  const handleHourlyChange = useCallback((val: number) => {
    setHourlyRate(val)
    setMonthlySalary(Math.round(val * C2026.HOURS_35H * 100) / 100)
  }, [])

  const handleMonthlyChange = useCallback((val: number) => {
    setMonthlySalary(val)
    setHourlyRate(Math.round((val / C2026.HOURS_35H) * 100) / 100)
  }, [])

  const handleAnnualChange = useCallback((val: number) => {
    setSalaryAnnual(val)
    setSalaryMonthlyFJ(Math.round(val / 12 * 100) / 100)
  }, [])

  const handleFjMonthlyChange = useCallback((val: number) => {
    setSalaryMonthlyFJ(val)
    setSalaryAnnual(Math.round(val * 12 * 100) / 100)
  }, [])

  function handleSubmit() {
    onSimulate({
      mode,
      duration,
      hourlyRate: isForfaitJour ? 0 : hourlyRate,
      salaryAnnual: isForfaitJour ? salaryAnnual : 0,
      coefficient,
      statut,
      seniority,
      treizieme,
      primeExceptionnelle,
      forfaitJours,
      extraHS: isForfaitJour ? 0 : extraHS,
    })
  }

  return (
    <div className="rounded-xl border border-ap-cream-200 bg-white p-5">
      <h2 className="text-lg font-medium text-ap-green-900 mb-4">Paramètres</h2>

      {/* Mode toggle */}
      <div className="mb-4">
        <Label className="text-xs text-ap-cream-700 mb-1.5 block">Vue</Label>
        <div className="flex rounded-lg border border-ap-cream-300 overflow-hidden">
          <button
            type="button"
            onClick={() => setMode('employeur')}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              mode === 'employeur'
                ? 'bg-ap-green-900 text-ap-green-100'
                : 'bg-white text-ap-cream-700 hover:bg-ap-cream-100'
            }`}
          >
            Employeur
          </button>
          <button
            type="button"
            onClick={() => setMode('salarie')}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              mode === 'salarie'
                ? 'bg-ap-green-900 text-ap-green-100'
                : 'bg-white text-ap-cream-700 hover:bg-ap-cream-100'
            }`}
          >
            Salarié
          </button>
        </div>
      </div>

      {/* Durée du travail */}
      <div className="mb-4">
        <Label htmlFor="duration">Durée du travail</Label>
        <select
          id="duration"
          value={duration}
          onChange={(e) => setDuration(e.target.value as SimDuration)}
          className="w-full mt-1 rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-ap-green-500 focus:border-ap-green-500"
        >
          {DURATIONS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
        {!isForfaitJour && duration !== '35h' && (
          <p className="text-xs text-ap-cream-600 mt-1">
            {duration === '37h30' ? 'HS structurelles : 10,83h/mois — RTT : ~12 j/an' : 'HS structurelles : 17,33h/mois — RTT : ~23 j/an'}
          </p>
        )}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* CHAMPS FORFAIT JOUR */}
      {/* ══════════════════════════════════════════════ */}
      {isForfaitJour && (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <Label>{fjInputMode === 'annual' ? 'Salaire annuel brut' : 'Salaire mensuel brut'}</Label>
              <button
                type="button"
                onClick={() => setFjInputMode(fjInputMode === 'annual' ? 'monthly' : 'annual')}
                className="text-xs text-ap-green-600 hover:text-ap-green-800 underline"
              >
                {fjInputMode === 'annual' ? 'Saisir le mensuel' : "Saisir l'annuel"}
              </button>
            </div>
            {fjInputMode === 'annual' ? (
              <div className="relative">
                <Input
                  type="number"
                  step="100"
                  min={20000}
                  value={salaryAnnual}
                  onChange={(e) => handleAnnualChange(parseFloat(e.target.value) || 36000)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ap-cream-600">€/an</span>
              </div>
            ) : (
              <div className="relative">
                <Input
                  type="number"
                  step="10"
                  min={1500}
                  value={salaryMonthlyFJ}
                  onChange={(e) => handleFjMonthlyChange(parseFloat(e.target.value) || 3000)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ap-cream-600">€/mois</span>
              </div>
            )}
            <p className="text-xs text-ap-cream-600 mt-1">
              {fjInputMode === 'annual'
                ? `= ${salaryMonthlyFJ.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €/mois`
                : `= ${salaryAnnual.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €/an`}
              {' — '}
              {(salaryAnnual / forfaitJours).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/jour
            </p>
          </div>

          <div className="mb-4">
            <Label htmlFor="forfaitJours">Jours travaillés / an</Label>
            <Input
              id="forfaitJours"
              type="number"
              min={200}
              max={230}
              value={forfaitJours}
              onChange={(e) => setForfaitJours(parseInt(e.target.value) || 218)}
              className="mt-1"
            />
            <p className="text-xs text-ap-cream-600 mt-1">
              RTT indicatif : ~{365 - 104 - 25 - 8 - forfaitJours} jours/an
            </p>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* CHAMPS MODE HORAIRE (35h / 37h30 / 39h) */}
      {/* ══════════════════════════════════════════════ */}
      {!isForfaitJour && (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <Label>{inputMode === 'hourly' ? 'Taux horaire brut' : 'Salaire mensuel brut'}</Label>
              <button
                type="button"
                onClick={() => setInputMode(inputMode === 'hourly' ? 'monthly' : 'hourly')}
                className="text-xs text-ap-green-600 hover:text-ap-green-800 underline"
              >
                {inputMode === 'hourly' ? 'Saisir le mensuel' : 'Saisir le taux horaire'}
              </button>
            </div>
            {inputMode === 'hourly' ? (
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min={C2026.SMIC_HORAIRE}
                  max={100}
                  value={hourlyRate}
                  onChange={(e) => handleHourlyChange(parseFloat(e.target.value) || C2026.SMIC_HORAIRE)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ap-cream-600">€/h</span>
              </div>
            ) : (
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min={Math.round(C2026.SMIC_HORAIRE * C2026.HOURS_35H)}
                  value={monthlySalary}
                  onChange={(e) => handleMonthlyChange(parseFloat(e.target.value) || C2026.SMIC_MENSUEL)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ap-cream-600">€/mois</span>
              </div>
            )}
            <p className="text-xs text-ap-cream-600 mt-1">
              {inputMode === 'hourly'
                ? `= ${monthlySalary.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €/mois`
                : `= ${hourlyRate.toFixed(2)} €/h`}
            </p>
          </div>

          {/* HS supplémentaires */}
          <div className="mb-4">
            <Label htmlFor="extraHS">HS supplémentaires / sem</Label>
            <Input
              id="extraHS"
              type="number"
              min={0}
              max={12}
              step={0.5}
              value={extraHS}
              onChange={(e) => setExtraHS(parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
            <p className="text-xs text-ap-cream-600 mt-1">En plus des HS structurelles</p>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* CHAMPS COMMUNS */}
      {/* ══════════════════════════════════════════════ */}

      {/* Coefficient */}
      <div className="mb-4">
        <Label htmlFor="coefficient">Coefficient</Label>
        <Input
          id="coefficient"
          type="number"
          min={100}
          max={999}
          value={coefficient}
          onChange={(e) => setCoefficient(parseInt(e.target.value) || 200)}
          className="mt-1"
        />
      </div>

      {/* Statut */}
      <div className="mb-4">
        <Label htmlFor="statut">Statut</Label>
        <select
          id="statut"
          value={statut}
          onChange={(e) => setStatut(e.target.value as SimStatut)}
          className="w-full mt-1 rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-ap-green-500 focus:border-ap-green-500"
        >
          <option value="non_cadre">Non cadre</option>
          <option value="cadre">Cadre</option>
        </select>
      </div>

      {/* Ancienneté */}
      <div className="mb-4">
        <Label htmlFor="seniority">Ancienneté</Label>
        <select
          id="seniority"
          value={seniority}
          onChange={(e) => setSeniority(parseInt(e.target.value))}
          className="w-full mt-1 rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-ap-green-500 focus:border-ap-green-500"
        >
          {SENIORITY_OPTIONS.map((y) => (
            <option key={y} value={y}>{y === 0 ? 'Moins de 3 ans' : `${y} ans`}</option>
          ))}
        </select>
      </div>

      {/* 13ème mois */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="checkbox"
          id="treizieme"
          checked={treizieme}
          onChange={(e) => setTreizieme(e.target.checked)}
          className="h-4 w-4 rounded border-ap-cream-300 text-ap-green-700 focus:ring-ap-green-500"
        />
        <Label htmlFor="treizieme" className="mb-0">13ème mois</Label>
      </div>

      {/* Prime exceptionnelle */}
      <div className="mb-4">
        <Label htmlFor="prime">Prime exceptionnelle (€/mois)</Label>
        <Input
          id="prime"
          type="number"
          min={0}
          max={5000}
          value={primeExceptionnelle}
          onChange={(e) => setPrimeExceptionnelle(parseFloat(e.target.value) || 0)}
          className="mt-1"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full mt-2"
      >
        <Calculator className="h-4 w-4 mr-2" />
        Calculer
      </Button>
    </div>
  )
}
