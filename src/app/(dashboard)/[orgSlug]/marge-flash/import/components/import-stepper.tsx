'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileSpreadsheet, FileText, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { extractFromPdf } from '../actions'
import { bulkUpsertIngredients, bulkUpsertPackaging, bulkUpsertLabor } from '../../actions'
import type { ImportIngredientRow, ImportPackagingRow, ImportLaborRow } from '../../actions'

type Step = 'source' | 'type' | 'upload' | 'preview' | 'confirm' | 'result'
type Source = 'excel' | 'pdf'
type ImportType = 'ingredients' | 'packaging' | 'labor' | 'supplier_price_list' | 'invoice' | 'product_spec'

const IMPORT_TYPES = {
  excel: [
    { key: 'ingredients', label: 'Tarifs matières premières' },
    { key: 'packaging', label: 'Composants packaging' },
    { key: 'labor', label: 'Effectifs par pôle' },
  ],
  pdf: [
    { key: 'supplier_price_list', label: 'Tarif / catalogue fournisseur' },
    { key: 'invoice', label: 'Facture fournisseur' },
    { key: 'product_spec', label: 'Fiche technique produit' },
  ],
} as const

interface ImportStepperProps {
  orgSlug: string
}

interface ParsedRow {
  [key: string]: unknown
  _valid?: boolean
  _error?: string
}

export function ImportStepper({ orgSlug }: ImportStepperProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>('source')
  const [source, setSource] = useState<Source | null>(null)
  const [importType, setImportType] = useState<ImportType | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [result, setResult] = useState<{ created: number; updated: number; errored: number } | null>(null)
  const [pdfData, setPdfData] = useState<unknown>(null)

  function handleSourceSelect(s: Source) {
    setSource(s)
    setStep('type')
  }

  function handleTypeSelect(t: string) {
    setImportType(t as ImportType)
    setStep('upload')
  }

  async function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(ws) as ParsedRow[]

      const validated = data.map((row) => {
        const name = String(row['Nom'] ?? row['nom'] ?? row['Name'] ?? '').trim()
        if (!name) return { ...row, _valid: false, _error: 'Nom manquant' }
        return { ...row, _valid: true, name }
      })

      setParsedRows(validated)
      setStep('preview')
    }
    reader.readAsBinaryString(file)
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    startTransition(async () => {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (ev) => {
          const result = ev.target?.result as string
          resolve(result.split(',')[1])
        }
        reader.readAsDataURL(file)
      })

      const { data, error } = await extractFromPdf(base64, importType!)
      if (error) { toast.error(error); return }

      setPdfData(data)

      // Convert extracted data to rows for preview
      const extracted = data as { items?: Array<{ name: string; unit?: string; price_ht?: number; category?: string }>; lines?: Array<{ name: string; unit?: string; unit_price_ht?: number }> }
      const items = extracted.items ?? extracted.lines ?? []
      const rows: ParsedRow[] = items.map((item: { name: string; unit?: string; price_ht?: number; unit_price_ht?: number; category?: string }) => ({
        name: item.name ?? '',
        unit: item.unit ?? 'kg',
        price: item.price_ht ?? item.unit_price_ht ?? 0,
        category: item.category ?? '',
        _valid: !!item.name,
        _error: item.name ? undefined : 'Nom manquant',
      }))

      setParsedRows(rows)
      setStep('preview')
    })
  }

  function handleConfirm() {
    startTransition(async () => {
      const validRows = parsedRows.filter((r) => r._valid)

      if (importType === 'ingredients' || importType === 'supplier_price_list' || importType === 'invoice') {
        const rows: ImportIngredientRow[] = validRows.map((r) => ({
          name: String(r.name ?? r['Nom'] ?? ''),
          unit: String(r.unit ?? r['Unité'] ?? r['Unite'] ?? 'kg'),
          price_cents: Math.round(Number(r.price ?? r['Prix'] ?? r['prix'] ?? r['Prix unitaire HT'] ?? 0) * 100),
          category: r.category ? String(r.category) : null,
          supplier: r.supplier ? String(r.supplier) : null,
        }))
        const res = await bulkUpsertIngredients(orgSlug, rows)
        if (res.error) { toast.error(res.error); return }
        setResult({ created: res.created ?? 0, updated: res.updated ?? 0, errored: res.errored ?? 0 })
      } else if (importType === 'packaging') {
        const rows: ImportPackagingRow[] = validRows.map((r) => ({
          name: String(r.name ?? r['Nom'] ?? ''),
          unit: String(r.unit ?? r['Unité'] ?? r['Unite'] ?? 'pièce'),
          unit_price_cents: Math.round(Number(r.price ?? r['Prix'] ?? r['prix'] ?? r['Prix unitaire HT'] ?? 0) * 100),
          packaging_type: r.packaging_type ? String(r.packaging_type) : null,
          supplier: r.supplier ? String(r.supplier) : null,
        }))
        const res = await bulkUpsertPackaging(orgSlug, rows)
        if (res.error) { toast.error(res.error); return }
        setResult({ created: res.created ?? 0, updated: res.updated ?? 0, errored: res.errored ?? 0 })
      } else if (importType === 'labor') {
        const rows: ImportLaborRow[] = validRows.map((r) => ({
          name: String(r.name ?? r['Nom'] ?? r['Pôle'] ?? ''),
          default_headcount: Number(r.headcount ?? r['Nb personnes'] ?? r['Effectif'] ?? 1),
          hourly_rate_cents: Math.round(Number(r.rate ?? r['Taux horaire'] ?? r['Taux horaire chargé'] ?? 0) * 100),
        }))
        const res = await bulkUpsertLabor(orgSlug, rows)
        if (res.error) { toast.error(res.error); return }
        setResult({ created: res.created ?? 0, updated: res.updated ?? 0, errored: res.errored ?? 0 })
      }

      setStep('result')
      toast.success('Import terminé')
    })
  }

  function downloadTemplate() {
    const headers: Record<string, string[]> = {
      ingredients: ['Nom', 'Unité', 'Prix unitaire HT', 'Catégorie', 'Fournisseur'],
      packaging: ['Nom', 'Unité', 'Prix unitaire HT', 'Type', 'Fournisseur'],
      labor: ['Nom', 'Nb personnes', 'Taux horaire chargé'],
    }

    const examples: Record<string, unknown[]> = {
      ingredients: [{ Nom: 'Mesclun', 'Unité': 'kg', 'Prix unitaire HT': 4.20, 'Catégorie': 'légume', Fournisseur: 'Bonduelle' }],
      packaging: [{ Nom: 'Barquette plastique', 'Unité': 'pièce', 'Prix unitaire HT': 0.08, Type: 'container', Fournisseur: '' }],
      labor: [{ Nom: 'Prépa / Recette', 'Nb personnes': 2, 'Taux horaire chargé': 18.50 }],
    }

    const cols = headers[importType!]
    const ex = examples[importType!]
    if (!cols || !ex) return

    const ws = XLSX.utils.json_to_sheet(ex, { header: cols })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Import')
    XLSX.writeFile(wb, `template_${importType}.xlsx`)
  }

  function reset() {
    setStep('source')
    setSource(null)
    setImportType(null)
    setParsedRows([])
    setResult(null)
    setPdfData(null)
  }

  const steps = ['Source', 'Type', 'Upload', 'Aperçu', 'Import', 'Résultat']
  const stepIndex = ['source', 'type', 'upload', 'preview', 'confirm', 'result'].indexOf(step)

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
              i <= stepIndex ? 'bg-ap-green-900 text-ap-green-100' : 'bg-ap-cream-200 text-ap-cream-700'
            }`}>
              {i < stepIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-xs whitespace-nowrap ${i <= stepIndex ? 'text-ap-green-900 font-medium' : 'text-ap-cream-600'}`}>{label}</span>
            {i < steps.length - 1 && <div className={`w-6 h-0.5 ${i < stepIndex ? 'bg-ap-green-700' : 'bg-ap-cream-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Source */}
      {step === 'source' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          <button
            onClick={() => handleSourceSelect('excel')}
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-ap-cream-200 p-8 hover:border-ap-green-500 transition-colors"
          >
            <FileSpreadsheet className="h-10 w-10 text-ap-green-700" />
            <span className="text-sm font-medium text-ap-green-900">Fichier Excel</span>
            <span className="text-xs text-ap-cream-600">Import .xlsx avec template</span>
          </button>
          <button
            onClick={() => handleSourceSelect('pdf')}
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-ap-cream-200 p-8 hover:border-ap-green-500 transition-colors"
          >
            <FileText className="h-10 w-10 text-ap-green-700" />
            <span className="text-sm font-medium text-ap-green-900">Fichier PDF</span>
            <span className="text-xs text-ap-cream-600">Extraction IA (tarifs, factures)</span>
          </button>
        </div>
      )}

      {/* Step 2: Type */}
      {step === 'type' && source && (
        <div className="space-y-3 max-w-lg">
          <button onClick={() => setStep('source')} className="flex items-center gap-1 text-sm text-ap-cream-700 hover:text-ap-green-900">
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>
          <h3 className="text-sm font-medium text-ap-green-900">Type d&apos;import</h3>
          <div className="space-y-2">
            {IMPORT_TYPES[source].map((t) => (
              <button
                key={t.key}
                onClick={() => handleTypeSelect(t.key)}
                className="w-full text-left px-4 py-3 rounded-lg border border-ap-cream-200 hover:border-ap-green-500 hover:bg-ap-green-50 transition-colors"
              >
                <span className="text-sm font-medium text-ap-green-900">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Upload */}
      {step === 'upload' && (
        <div className="space-y-4 max-w-lg">
          <button onClick={() => setStep('type')} className="flex items-center gap-1 text-sm text-ap-cream-700 hover:text-ap-green-900">
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>

          {source === 'excel' && (
            <>
              <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ap-green-50 text-ap-green-900 text-sm font-medium border border-ap-green-200 hover:bg-ap-green-100 transition-colors">
                <FileSpreadsheet className="h-4 w-4" />
                Télécharger le template
              </button>
              <div className="rounded-xl border-2 border-dashed border-ap-cream-300 p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-3 text-ap-cream-600" />
                <label className="cursor-pointer">
                  <span className="text-sm text-ap-green-900 font-medium hover:underline">Choisir un fichier Excel</span>
                  <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} className="hidden" />
                </label>
                <p className="text-xs text-ap-cream-600 mt-2">Format .xlsx uniquement</p>
              </div>
            </>
          )}

          {source === 'pdf' && (
            <div className="rounded-xl border-2 border-dashed border-ap-cream-300 p-8 text-center">
              {isPending ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-ap-green-700 animate-spin" />
                  <p className="text-sm text-ap-green-900 font-medium">Extraction IA en cours…</p>
                  <p className="text-xs text-ap-cream-600">Analyse du document par Claude</p>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-3 text-ap-cream-600" />
                  <label className="cursor-pointer">
                    <span className="text-sm text-ap-green-900 font-medium hover:underline">Choisir un fichier PDF</span>
                    <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                  </label>
                  <p className="text-xs text-ap-cream-600 mt-2">Max 20 pages</p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          <button onClick={() => setStep('upload')} className="flex items-center gap-1 text-sm text-ap-cream-700 hover:text-ap-green-900">
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-ap-green-900">
              Aperçu ({parsedRows.length} lignes — {parsedRows.filter((r) => r._valid).length} valides)
            </h3>
          </div>

          <div className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-ap-cream-300">
                    <th className="text-center px-3 py-2 w-10 text-ap-cream-700 font-normal">#</th>
                    {Object.keys(parsedRows[0] ?? {}).filter((k) => !k.startsWith('_')).map((key) => (
                      <th key={key} className="text-left px-3 py-2 text-ap-cream-700 font-normal">{key}</th>
                    ))}
                    <th className="text-left px-3 py-2 text-ap-cream-700 font-normal">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, i) => (
                    <tr key={i} className={`border-b border-ap-cream-200 ${row._valid ? '' : 'bg-red-50'}`}>
                      <td className="text-center px-3 py-2 text-xs text-ap-cream-600">{i + 1}</td>
                      {Object.entries(row).filter(([k]) => !k.startsWith('_')).map(([key, val]) => (
                        <td key={key} className={`px-3 py-2 ${val == null ? 'text-amber-500' : 'text-ap-cream-800'}`}>
                          {val == null ? 'null' : String(val)}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        {row._valid ? (
                          <span className="text-xs text-ap-green-700 font-medium">OK</span>
                        ) : (
                          <span className="text-xs text-red-600 font-medium">{row._error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={() => setStep('confirm')}
            disabled={parsedRows.filter((r) => r._valid).length === 0}
            className="px-4 py-2 rounded-lg bg-ap-green-900 text-ap-green-100 text-sm font-medium hover:bg-ap-green-800 transition-colors disabled:opacity-50"
          >
            Continuer
          </button>
        </div>
      )}

      {/* Step 5: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-4 max-w-lg">
          <button onClick={() => setStep('preview')} className="flex items-center gap-1 text-sm text-ap-cream-700 hover:text-ap-green-900">
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>

          <div className="rounded-xl border border-ap-cream-200 bg-white p-5">
            <h3 className="text-sm font-medium text-ap-green-900 mb-3">Confirmation d&apos;import</h3>
            <p className="text-sm text-ap-cream-800">
              {parsedRows.filter((r) => r._valid).length} lignes seront importées.
              Les éléments existants (même nom) seront mis à jour.
            </p>
          </div>

          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-ap-green-900 text-ap-green-100 text-sm font-medium hover:bg-ap-green-800 transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Import en cours…
              </span>
            ) : (
              `Importer ${parsedRows.filter((r) => r._valid).length} lignes`
            )}
          </button>
        </div>
      )}

      {/* Step 6: Result */}
      {step === 'result' && result && (
        <div className="space-y-4 max-w-lg">
          <div className="rounded-xl border border-ap-cream-200 bg-white p-5">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-6 w-6 text-ap-green-700" />
              <h3 className="text-sm font-medium text-ap-green-900">Import terminé</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-ap-cream-800">{result.created} créés</p>
              <p className="text-ap-cream-800">{result.updated} mis à jour</p>
              {result.errored > 0 && <p className="text-red-600">{result.errored} erreurs</p>}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={reset} className="px-4 py-2 rounded-lg bg-ap-green-50 text-ap-green-900 text-sm font-medium border border-ap-green-200 hover:bg-ap-green-100 transition-colors">
              Nouvel import
            </button>
            <button onClick={() => router.push(`/${orgSlug}/marge-flash/referentiels`)} className="px-4 py-2 rounded-lg bg-ap-green-900 text-ap-green-100 text-sm font-medium hover:bg-ap-green-800 transition-colors">
              Voir les référentiels
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
