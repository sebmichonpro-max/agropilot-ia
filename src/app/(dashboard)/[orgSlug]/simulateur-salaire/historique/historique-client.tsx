'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Trash2, Search, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { SimSimulation, SimulationResults, SimulationInputs } from '@/types/database'
import { SimulTabs } from '../components/simul-tabs'
import { deleteSimulation } from '../actions'

interface HistoriqueClientProps {
  simulations: SimSimulation[]
  orgSlug: string
}

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatRate(r: number): string {
  if (r === 0) return '—'
  return (r * 100).toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + '%'
}

function generatePdfFromSim(sim: SimSimulation) {
  const inputs = sim.inputs as SimulationInputs
  const results = sim.results as SimulationResults
  const durationLabel = inputs.duration === 'forfait_jour' ? 'Forfait jour' : inputs.duration
  const statutLabel = inputs.statut === 'cadre' ? 'Cadre' : 'Non cadre'
  const today = new Date(sim.created_at).toLocaleDateString('fr-FR')

  const categorizedLines: Record<string, typeof results.detail> = {}
  for (const line of results.detail) {
    if (!categorizedLines[line.category]) categorizedLines[line.category] = []
    categorizedLines[line.category].push(line)
  }

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Simulation — ${sim.label}</title>
<style>
@page{size:A4 portrait;margin:15mm}*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:11px;color:#3d3728;background:#fdfcf9}
.header{background:#1a3a2a;color:#e0f2e7;padding:16px 20px;display:flex;justify-content:space-between;align-items:center}
.header h1{font-size:16px;font-weight:600}.section{padding:12px 20px;border-bottom:1px solid #e3dac8}
.section-title{font-size:12px;font-weight:600;color:#1a3a2a;margin-bottom:8px}
.params{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px 16px}
.kpi-row{display:flex;gap:12px;padding:12px 20px}.kpi{flex:1;padding:10px;border-radius:6px;text-align:center}
.kpi-green{background:#e0f2e7}.kpi-blue{background:#e6f1fb}.kpi-amber{background:#faeeda}
.kpi .val{font-size:18px;font-weight:700}.kpi .lbl{font-size:9px;text-transform:uppercase;margin-bottom:2px}
.kpi .sub{font-size:9px;margin-top:2px;opacity:0.7}
table.cotis{width:100%;border-collapse:collapse;font-size:10px}
table.cotis th{text-align:left;padding:4px 2px;font-weight:500;color:#7a6f58;border-bottom:1px solid #e3dac8}
table.cotis th.right{text-align:right}table.cotis td{padding:3px 2px;border-bottom:1px solid #f0ebe0}
table.cotis td.right{text-align:right}table.cotis tr.cat{background:#f7f4ed}
table.cotis tr.cat td{font-weight:600;color:#1a3a2a;padding:5px 2px}
table.cotis tr.total-row{border-top:2px solid #1a3a2a}table.cotis tr.total-row td{font-weight:700;padding:6px 2px}
.neg{color:#2d6148}.footer{padding:12px 20px;font-size:9px;color:#998b70;text-align:center}
@media print{body{background:white}}
</style></head><body>
<div class="header"><div><h1>${sim.label}</h1></div><div style="text-align:right"><div style="font-size:13px;font-weight:600">AgroPilot.IA</div><div style="font-size:11px;opacity:0.8">${today}</div></div></div>
<div class="section"><div class="section-title">PARAMÈTRES</div><div class="params">
<div><span style="color:#7a6f58">Taux :</span> <strong>${inputs.hourlyRate.toFixed(2)} €/h</strong></div>
<div><span style="color:#7a6f58">Durée :</span> <strong>${durationLabel}</strong></div>
<div><span style="color:#7a6f58">Coef :</span> <strong>${inputs.coefficient}</strong></div>
<div><span style="color:#7a6f58">Statut :</span> <strong>${statutLabel}</strong></div>
<div><span style="color:#7a6f58">Ancienneté :</span> <strong>${inputs.seniority} ans</strong></div>
<div><span style="color:#7a6f58">13ème mois :</span> <strong>${inputs.treizieme ? 'Oui' : 'Non'}</strong></div>
</div></div>
<div class="kpi-row">
<div class="kpi kpi-green"><div class="lbl">Coût employeur</div><div class="val">${formatCurrency(results.coutEmployeur)} €</div><div class="sub">${formatCurrency(results.coutAnnuel)} €/an</div></div>
<div class="kpi kpi-blue"><div class="lbl">Salaire net</div><div class="val">${formatCurrency(results.netAvantImpot)} €</div></div>
<div class="kpi kpi-amber"><div class="lbl">Charges</div><div class="val">${formatCurrency(results.cotisationsSalariales + results.cotisationsPatronales - results.rgdu)} €</div></div>
</div>
<div class="section"><div class="section-title">DÉTAIL DES COTISATIONS</div>
<table class="cotis"><thead><tr><th>Libellé</th><th class="right">Base</th><th class="right">Taux sal.</th><th class="right">Mt sal.</th><th class="right">Taux pat.</th><th class="right">Mt pat.</th></tr></thead><tbody>
${Object.entries(categorizedLines).map(([cat, lines]) => `<tr class="cat"><td colspan="6">${cat}</td></tr>${lines.map(l => `<tr><td style="padding-left:12px">${l.label}</td><td class="right">${l.base > 0 ? formatCurrency(l.base) : '—'}</td><td class="right">${formatRate(l.rateSal)}</td><td class="right ${l.montantSal < 0 ? 'neg' : ''}">${l.montantSal !== 0 ? formatCurrency(l.montantSal) : '—'}</td><td class="right">${formatRate(l.ratePat)}</td><td class="right ${l.montantPat < 0 ? 'neg' : ''}">${l.montantPat !== 0 ? formatCurrency(l.montantPat) : '—'}</td></tr>`).join('')}`).join('')}
<tr class="total-row"><td><strong>TOTAL</strong></td><td></td><td></td><td class="right"><strong>${formatCurrency(results.cotisationsSalariales)} €</strong></td><td></td><td class="right"><strong>${formatCurrency(results.cotisationsPatronales - results.rgdu)} €</strong></td></tr>
</tbody></table></div>
<div class="footer">Simulation indicative — CCN IDCC 1396 — Taux 2026<br>AgroPilot.IA</div>
</body></html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }
}

export function HistoriqueClient({ simulations, orgSlug }: HistoriqueClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return simulations
    const q = search.toLowerCase()
    return simulations.filter((s) => s.label.toLowerCase().includes(q))
  }, [simulations, search])

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteSimulation(id)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Simulation supprimée')
        router.refresh()
      }
    })
  }

  function handleReload(sim: SimSimulation) {
    const inputs = sim.inputs as SimulationInputs
    const qs = new URLSearchParams({
      hourlyRate: String(inputs.hourlyRate),
      duration: inputs.duration,
      coefficient: String(inputs.coefficient),
      statut: inputs.statut,
      seniority: String(inputs.seniority),
      treizieme: inputs.treizieme ? '1' : '0',
      primeExceptionnelle: String(inputs.primeExceptionnelle || 0),
      extraHS: String(inputs.extraHS || 0),
      mode: inputs.mode,
    })
    router.push(`/${orgSlug}/simulateur-salaire?${qs.toString()}`)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ap-green-900 mb-4">Simul&apos;Paie</h1>
      <SimulTabs orgSlug={orgSlug} />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ap-cream-600" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une simulation..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-ap-cream-600 py-12">
          {simulations.length === 0 ? 'Aucune simulation sauvegardée' : 'Aucun résultat'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((sim) => {
            const results = sim.results as SimulationResults
            return (
              <div
                key={sim.id}
                className="rounded-lg border border-ap-cream-200 bg-white px-4 py-3 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ap-green-900 truncate">{sim.label}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-ap-cream-700">
                    <span>{new Date(sim.created_at).toLocaleDateString('fr-FR')}</span>
                    <span>Coût : {formatCurrency(results.coutEmployeur)} €</span>
                    <span>Net : {formatCurrency(results.netAvantImpot)} €</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleReload(sim)}
                    className="p-2 rounded-md text-ap-cream-700 hover:bg-ap-cream-100"
                    aria-label="Recharger"
                    title="Recharger"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => generatePdfFromSim(sim)}
                    className="p-2 rounded-md text-ap-cream-700 hover:bg-ap-cream-100"
                    aria-label="Télécharger PDF"
                    title="PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(sim.id)}
                    disabled={isPending}
                    className="p-2 rounded-md text-red-500 hover:bg-red-50"
                    aria-label="Supprimer"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
