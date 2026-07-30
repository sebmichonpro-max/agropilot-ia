'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { SimSettings } from '@/types/database'
import { SimulTabs } from '../components/simul-tabs'
import { updateSimSettings } from '../actions'

interface SettingsClientProps {
  settings: SimSettings
  orgSlug: string
}

export function SettingsClient({ settings, orgSlug }: SettingsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [companyName, setCompanyName] = useState(settings.company_name ?? '')
  const [atMp, setAtMp] = useState(settings.at_mp_rate_bps)
  const [mutPat, setMutPat] = useState(settings.mutual_employer_cents)
  const [mutSal, setMutSal] = useState(settings.mutual_employee_cents)
  const [prevPat, setPrevPat] = useState(settings.prevoyance_employer_rate_bps)
  const [prevSal, setPrevSal] = useState(settings.prevoyance_employee_rate_bps)
  const [fnal, setFnal] = useState(settings.fnal_rate_bps)
  const [formation, setFormation] = useState(settings.formation_rate_bps)
  const [transport, setTransport] = useState(settings.transport_rate_bps)
  const [headcount, setHeadcount] = useState(settings.headcount)

  function handleSave() {
    const formData = new FormData()
    formData.set('company_name', companyName)
    formData.set('at_mp_rate_bps', String(atMp))
    formData.set('mutual_employer_cents', String(mutPat))
    formData.set('mutual_employee_cents', String(mutSal))
    formData.set('prevoyance_employer_rate_bps', String(prevPat))
    formData.set('prevoyance_employee_rate_bps', String(prevSal))
    formData.set('fnal_rate_bps', String(fnal))
    formData.set('formation_rate_bps', String(formation))
    formData.set('transport_rate_bps', String(transport))
    formData.set('headcount', String(headcount))

    startTransition(async () => {
      const res = await updateSimSettings(formData)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Paramètres sauvegardés')
        router.refresh()
      }
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ap-green-900 mb-4">Simul&apos;Paie</h1>
      <SimulTabs orgSlug={orgSlug} />

      <div className="max-w-2xl space-y-6">
        {/* Entreprise */}
        <section className="rounded-xl border border-ap-cream-200 bg-white p-5">
          <h2 className="text-lg font-medium text-ap-green-900 mb-3">Entreprise</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Nom (affiché sur le PDF)</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Mon entreprise"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="headcount">Effectif</Label>
              <Input
                id="headcount"
                type="number"
                min={1}
                value={headcount}
                onChange={(e) => setHeadcount(parseInt(e.target.value) || 30)}
                className="mt-1"
              />
              <p className="text-xs text-ap-cream-600 mt-1">Impacte FNAL et formation</p>
            </div>
          </div>
        </section>

        {/* Taux */}
        <section className="rounded-xl border border-ap-cream-200 bg-white p-5">
          <h2 className="text-lg font-medium text-ap-green-900 mb-3">Taux et montants</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="atMp">AT/MP (basis points, ex: 306 = 3,06%)</Label>
              <Input
                id="atMp"
                type="number"
                min={0}
                value={atMp}
                onChange={(e) => setAtMp(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
              <p className="text-xs text-ap-cream-600 mt-1">= {(atMp / 100).toFixed(2)}%</p>
            </div>
            <div>
              <Label htmlFor="mutPat">Mutuelle patronale (centimes/mois)</Label>
              <Input
                id="mutPat"
                type="number"
                min={0}
                value={mutPat}
                onChange={(e) => setMutPat(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
              <p className="text-xs text-ap-cream-600 mt-1">= {(mutPat / 100).toFixed(2)} €/mois</p>
            </div>
            <div>
              <Label htmlFor="mutSal">Mutuelle salariale (centimes/mois)</Label>
              <Input
                id="mutSal"
                type="number"
                min={0}
                value={mutSal}
                onChange={(e) => setMutSal(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
              <p className="text-xs text-ap-cream-600 mt-1">= {(mutSal / 100).toFixed(2)} €/mois</p>
            </div>
            <div>
              <Label htmlFor="prevPat">Prévoyance patronale (bps)</Label>
              <Input
                id="prevPat"
                type="number"
                min={0}
                value={prevPat}
                onChange={(e) => setPrevPat(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
              <p className="text-xs text-ap-cream-600 mt-1">= {(prevPat / 100).toFixed(2)}%</p>
            </div>
            <div>
              <Label htmlFor="prevSal">Prévoyance salariale (bps)</Label>
              <Input
                id="prevSal"
                type="number"
                min={0}
                value={prevSal}
                onChange={(e) => setPrevSal(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
              <p className="text-xs text-ap-cream-600 mt-1">= {(prevSal / 100).toFixed(2)}%</p>
            </div>
            <div>
              <Label htmlFor="fnal">FNAL (bps, 10 ou 50)</Label>
              <select
                id="fnal"
                value={fnal}
                onChange={(e) => setFnal(parseInt(e.target.value))}
                className="w-full mt-1 rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
              >
                <option value={10}>0,10% (&lt; 50 salariés)</option>
                <option value={50}>0,50% (≥ 50 salariés)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="formation">Formation (bps)</Label>
              <select
                id="formation"
                value={formation}
                onChange={(e) => setFormation(parseInt(e.target.value))}
                className="w-full mt-1 rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
              >
                <option value={55}>0,55% (&lt; 11 salariés)</option>
                <option value={100}>1,00% (≥ 11 salariés)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="transport">Versement mobilité (bps)</Label>
              <Input
                id="transport"
                type="number"
                min={0}
                max={300}
                value={transport}
                onChange={(e) => setTransport(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
              <p className="text-xs text-ap-cream-600 mt-1">= {(transport / 100).toFixed(2)}%</p>
            </div>
          </div>
        </section>

        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Enregistrement...' : 'Sauvegarder les paramètres'}
        </Button>
      </div>
    </div>
  )
}
