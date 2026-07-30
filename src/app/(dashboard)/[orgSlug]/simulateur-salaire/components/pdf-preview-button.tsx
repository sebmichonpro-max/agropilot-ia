'use client'

import { useState } from 'react'
import { Download, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { SimulationInputs, SimulationResults } from '@/types/database'
import { buildDefaultLabel } from '../lib/salary-engine'
import { saveSimulation } from '../actions'

interface PdfPreviewButtonProps {
  inputs: SimulationInputs
  results: SimulationResults
  companyName?: string | null
}

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatRate(r: number): string {
  if (r === 0) return '—'
  return (r * 100).toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + '%'
}

function generatePDF(inputs: SimulationInputs, results: SimulationResults, companyName?: string | null) {
  const durationLabel = inputs.duration === 'forfait_jour' ? 'Forfait jour' : inputs.duration
  const statutLabel = inputs.statut === 'cadre' ? 'Cadre' : 'Non cadre'
  const today = new Date().toLocaleDateString('fr-FR')

  const categorizedLines: Record<string, typeof results.detail> = {}
  for (const line of results.detail) {
    if (!categorizedLines[line.category]) categorizedLines[line.category] = []
    categorizedLines[line.category].push(line)
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Simulation salariale — ${companyName || 'AgroPilot.IA'}</title>
<style>
  @page { size: A4 portrait; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #3d3728; background: #fdfcf9; }
  .header { background: #1a3a2a; color: #e0f2e7; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
  .header h1 { font-size: 16px; font-weight: 600; }
  .header .subtitle { font-size: 11px; opacity: 0.8; }
  .section { padding: 12px 20px; border-bottom: 1px solid #e3dac8; }
  .section-title { font-size: 12px; font-weight: 600; color: #1a3a2a; margin-bottom: 8px; }
  .params { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 16px; }
  .params .item { display: flex; gap: 4px; }
  .params .label { color: #7a6f58; }
  .params .value { font-weight: 600; }
  .kpi-row { display: flex; gap: 12px; padding: 12px 20px; }
  .kpi { flex: 1; padding: 10px; border-radius: 6px; text-align: center; }
  .kpi-green { background: #e0f2e7; }
  .kpi-blue { background: #e6f1fb; }
  .kpi-amber { background: #faeeda; }
  .kpi .val { font-size: 18px; font-weight: 700; }
  .kpi .lbl { font-size: 9px; text-transform: uppercase; margin-bottom: 2px; }
  .kpi .sub { font-size: 9px; margin-top: 2px; opacity: 0.7; }
  .ratio { text-align: center; padding: 6px 20px; font-size: 11px; color: #5c5340; border-bottom: 1px solid #e3dac8; }
  .brut-table { width: 100%; border-collapse: collapse; }
  .brut-table td { padding: 3px 0; }
  .brut-table .total { border-top: 2px solid #1a3a2a; font-weight: 700; }
  .brut-table .right { text-align: right; }
  table.cotis { width: 100%; border-collapse: collapse; font-size: 10px; }
  table.cotis th { text-align: left; padding: 4px 2px; font-weight: 500; color: #7a6f58; border-bottom: 1px solid #e3dac8; }
  table.cotis th.right { text-align: right; }
  table.cotis td { padding: 3px 2px; border-bottom: 1px solid #f0ebe0; }
  table.cotis td.right { text-align: right; }
  table.cotis tr.cat { background: #f7f4ed; }
  table.cotis tr.cat td { font-weight: 600; color: #1a3a2a; padding: 5px 2px; }
  table.cotis tr.total-row { border-top: 2px solid #1a3a2a; }
  table.cotis tr.total-row td { font-weight: 700; padding: 6px 2px; }
  .neg { color: #2d6148; }
  .footer { padding: 12px 20px; font-size: 9px; color: #998b70; text-align: center; }
  @media print { body { background: white; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>Simulation de coût salarial</h1>
    <div class="subtitle">${companyName || ''}</div>
  </div>
  <div style="text-align:right">
    <div style="font-size:13px;font-weight:600">AgroPilot.IA</div>
    <div class="subtitle">${today}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">PARAMÈTRES D'ENTRÉE</div>
  <div class="params">
    <div class="item"><span class="label">Taux horaire :</span><span class="value">${inputs.hourlyRate.toFixed(2)} €</span></div>
    <div class="item"><span class="label">Durée :</span><span class="value">${durationLabel}</span></div>
    <div class="item"><span class="label">Coefficient :</span><span class="value">${inputs.coefficient}</span></div>
    <div class="item"><span class="label">Statut :</span><span class="value">${statutLabel}</span></div>
    <div class="item"><span class="label">Ancienneté :</span><span class="value">${inputs.seniority} ans</span></div>
    <div class="item"><span class="label">13ème mois :</span><span class="value">${inputs.treizieme ? 'Oui' : 'Non'}</span></div>
    ${inputs.primeExceptionnelle ? `<div class="item"><span class="label">Prime excep. :</span><span class="value">${inputs.primeExceptionnelle} €</span></div>` : ''}
  </div>
</div>

<div class="kpi-row">
  <div class="kpi kpi-green">
    <div class="lbl">Coût employeur</div>
    <div class="val">${formatCurrency(results.coutEmployeur)} €</div>
    <div class="sub">${formatCurrency(results.coutAnnuel)} €/an</div>
  </div>
  <div class="kpi kpi-blue">
    <div class="lbl">Salaire net</div>
    <div class="val">${formatCurrency(results.netAvantImpot)} €</div>
    <div class="sub">${formatCurrency(results.netAvantImpot * 12)} €/an</div>
  </div>
  <div class="kpi kpi-amber">
    <div class="lbl">Charges totales</div>
    <div class="val">${formatCurrency(results.cotisationsSalariales + results.cotisationsPatronales - results.rgdu)} €</div>
  </div>
</div>

<div class="ratio">Pour 1 € net versé, l'entreprise dépense ${results.netAvantImpot > 0 ? (results.coutEmployeur / results.netAvantImpot).toFixed(2) : '—'} €</div>

<div class="section">
  <div class="section-title">DÉCOMPOSITION DU BRUT</div>
  <table class="brut-table">
    <tr><td>Salaire de base (151,67h × ${(results.baseSalary / 151.67).toFixed(2)} €)</td><td class="right">${formatCurrency(results.baseSalary)} €</td></tr>
    ${results.hsAmount > 0 ? `<tr><td>Heures sup 25% (${results.hsMonthly.toFixed(2)}h)</td><td class="right">${formatCurrency(results.hsAmount)} €</td></tr>` : ''}
    ${results.anciennete > 0 ? `<tr><td>Prime d'ancienneté</td><td class="right">${formatCurrency(results.anciennete)} €</td></tr>` : ''}
    ${results.treizieme > 0 ? `<tr><td>13ème mois (mensualisé)</td><td class="right">${formatCurrency(results.treizieme)} €</td></tr>` : ''}
    ${results.primeExceptionnelle > 0 ? `<tr><td>Prime exceptionnelle</td><td class="right">${formatCurrency(results.primeExceptionnelle)} €</td></tr>` : ''}
    <tr class="total"><td><strong>BRUT TOTAL</strong></td><td class="right"><strong>${formatCurrency(results.brut)} €</strong></td></tr>
  </table>
</div>

<div class="section">
  <div class="section-title">DÉTAIL DES COTISATIONS</div>
  <table class="cotis">
    <thead>
      <tr><th>Libellé</th><th class="right">Base</th><th class="right">Taux sal.</th><th class="right">Mt sal.</th><th class="right">Taux pat.</th><th class="right">Mt pat.</th></tr>
    </thead>
    <tbody>
      ${Object.entries(categorizedLines).map(([cat, lines]) => `
        <tr class="cat"><td colspan="6">${cat}</td></tr>
        ${lines.map(l => `
          <tr>
            <td style="padding-left:12px">${l.label}</td>
            <td class="right">${l.base > 0 ? formatCurrency(l.base) : '—'}</td>
            <td class="right">${formatRate(l.rateSal)}</td>
            <td class="right ${l.montantSal < 0 ? 'neg' : ''}">${l.montantSal !== 0 ? formatCurrency(l.montantSal) : '—'}</td>
            <td class="right">${formatRate(l.ratePat)}</td>
            <td class="right ${l.montantPat < 0 ? 'neg' : ''}">${l.montantPat !== 0 ? formatCurrency(l.montantPat) : '—'}</td>
          </tr>
        `).join('')}
      `).join('')}
      <tr class="total-row">
        <td><strong>TOTAL</strong></td>
        <td></td><td></td>
        <td class="right"><strong>${formatCurrency(results.cotisationsSalariales)} €</strong></td>
        <td></td>
        <td class="right"><strong>${formatCurrency(results.cotisationsPatronales - results.rgdu)} €</strong></td>
      </tr>
    </tbody>
  </table>
</div>

<div class="footer">
  Simulation indicative — ne constitue pas un bulletin de paie<br>
  Taux URSSAF/AGIRC-ARRCO 2026 — CCN IDCC 1396 (Industries de produits alimentaires élaborés)<br>
  AgroPilot.IA
</div>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }
}

export function PdfPreviewButton({ inputs, results, companyName }: PdfPreviewButtonProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [label, setLabel] = useState(buildDefaultLabel(inputs))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await saveSimulation(label, inputs, results)
    setSaving(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Simulation sauvegardée')
      setShowSaveDialog(false)
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <Button onClick={() => setShowSaveDialog(true)} size="sm">
          <Save className="h-4 w-4 mr-1" />
          Sauvegarder
        </Button>
        <Button
          variant="outline"
          onClick={() => generatePDF(inputs, results, companyName)}
          size="sm"
        >
          <Download className="h-4 w-4 mr-1" />
          PDF
        </Button>
      </div>

      {showSaveDialog && (
        <div className="mt-3 rounded-lg border border-ap-cream-200 bg-white p-4">
          <label className="text-sm font-medium text-ap-green-900 block mb-1">
            Nom de la simulation
          </label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: CDI 39h coef 225 — 14€/h"
            className="mb-2"
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || !label.trim()} size="sm">
              {saving ? 'Enregistrement...' : 'Confirmer'}
            </Button>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} size="sm">
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
