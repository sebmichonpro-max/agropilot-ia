'use client'

import { useState, useTransition, useRef } from 'react'
import { Upload, FileText, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { PrevImportBatch } from '@/types/database'
import { importOrdersCsv, importStocksCsv } from '../../actions'

const IMPORT_TYPES = [
  { key: 'commande' as const, label: 'Commandes fermes', icon: '📦' },
  { key: 'devis' as const, label: 'Devis en cours', icon: '📋' },
  { key: 'stocks' as const, label: 'Stocks produits finis', icon: '📊' },
] as const

type ImportType = (typeof IMPORT_TYPES)[number]['key']

interface ImportClientProps {
  orgSlug: string
  recentBatches: PrevImportBatch[]
}

export function ImportClient({ orgSlug, recentBatches }: ImportClientProps) {
  const [importType, setImportType] = useState<ImportType>('commande')
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0])
  const [isPending, startTransition] = useTransition()
  const [lastResult, setLastResult] = useState<{
    totalRows: number
    matchedCount: number
    unmatchedCount: number
    parseErrors: Array<{ row: number; column: string; message: string }>
  } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      toast.error('Sélectionnez un fichier CSV')
      return
    }

    startTransition(async () => {
      const text = await file.text()

      let result: Awaited<ReturnType<typeof importOrdersCsv>>
      if (importType === 'stocks') {
        result = await importStocksCsv(orgSlug, text, deliveryDate, file.name)
      } else {
        result = await importOrdersCsv(orgSlug, text, importType, deliveryDate, file.name)
      }

      if ('error' in result) {
        toast.error(result.error)
      } else if ('success' in result) {
        toast.success(`Import réussi : ${result.matchedCount} lignes matchées`)
        setLastResult({
          totalRows: result.totalRows!,
          matchedCount: result.matchedCount!,
          unmatchedCount: result.unmatchedCount!,
          parseErrors: result.parseErrors ?? [],
        })
        if (fileRef.current) fileRef.current.value = ''
      }
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-ap-green-900">Import de données</h2>

      {/* Import type selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {IMPORT_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setImportType(t.key)}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-colors text-left ${
              importType === t.key
                ? 'border-ap-green-900 bg-ap-green-900/5'
                : 'border-ap-cream-200 bg-white hover:border-ap-cream-400'
            }`}
          >
            <span className="text-2xl">{t.icon}</span>
            <span className={`text-sm font-medium ${importType === t.key ? 'text-ap-green-900' : 'text-ap-cream-800'}`}>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Upload form */}
      <div className="rounded-xl border border-ap-cream-200 bg-white p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="csvFile">Fichier CSV</Label>
            <Input
              id="csvFile"
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              className="mt-1"
            />
            <p className="text-xs text-ap-cream-500 mt-1">
              Séparateur : point-virgule ou virgule. Encodage : UTF-8.
            </p>
          </div>
          <div>
            <Label htmlFor="deliveryDate">
              {importType === 'stocks' ? 'Date du stock' : 'Date de livraison'}
            </Label>
            <Input
              id="deliveryDate"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-ap-cream-500 mt-1">
              Auto-détectée si le nom du fichier contient une date (ex: CMD_2026-08-05.csv).
            </p>
          </div>
        </div>

        <Button onClick={handleUpload} disabled={isPending} className="gap-2">
          <Upload className="h-4 w-4" />
          {isPending ? 'Import en cours...' : 'Importer'}
        </Button>
      </div>

      {/* Last result */}
      {lastResult && (
        <div className="rounded-xl border border-ap-cream-200 bg-white p-6">
          <h3 className="font-medium text-ap-green-900 mb-3">Résultat du dernier import</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-semibold text-ap-green-900">{lastResult.totalRows}</p>
              <p className="text-xs text-ap-cream-600">Lignes totales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-green-600">{lastResult.matchedCount}</p>
              <p className="text-xs text-ap-cream-600">Matchées</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-semibold ${lastResult.unmatchedCount > 0 ? 'text-amber-600' : 'text-ap-cream-500'}`}>
                {lastResult.unmatchedCount}
              </p>
              <p className="text-xs text-ap-cream-600">Non matchées</p>
            </div>
          </div>

          {lastResult.parseErrors.length > 0 && (
            <div className="border-t border-ap-cream-200 pt-3">
              <p className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                {lastResult.parseErrors.length} erreur(s) de parsing
              </p>
              <div className="max-h-40 overflow-y-auto text-xs text-ap-cream-600 space-y-1">
                {lastResult.parseErrors.map((err, i) => (
                  <p key={i}>Ligne {err.row} [{err.column}] : {err.message}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent imports */}
      <div className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
        <div className="px-4 py-3 bg-ap-cream-50 border-b border-ap-cream-200">
          <h3 className="font-medium text-ap-green-900">Imports récents</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ap-cream-200">
              <th className="text-left px-4 py-2 text-ap-cream-600 font-normal text-xs">Date</th>
              <th className="text-left px-4 py-2 text-ap-cream-600 font-normal text-xs">Type</th>
              <th className="text-left px-4 py-2 text-ap-cream-600 font-normal text-xs hidden sm:table-cell">Fichier</th>
              <th className="text-right px-4 py-2 text-ap-cream-600 font-normal text-xs">Lignes</th>
              <th className="text-right px-4 py-2 text-ap-cream-600 font-normal text-xs">Matchées</th>
            </tr>
          </thead>
          <tbody>
            {recentBatches.length > 0 ? recentBatches.map((batch) => (
              <tr key={batch.id} className="border-b border-ap-cream-100 hover:bg-ap-cream-50">
                <td className="px-4 py-2 text-ap-cream-700">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(batch.imported_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="px-4 py-2 text-ap-cream-800 capitalize">{batch.import_type}</td>
                <td className="px-4 py-2 text-ap-cream-600 hidden sm:table-cell">{batch.filename ?? '—'}</td>
                <td className="px-4 py-2 text-right text-ap-cream-800">{batch.row_count ?? '—'}</td>
                <td className="px-4 py-2 text-right">
                  {batch.matched_count !== null ? (
                    <span className={batch.unmatched_count && batch.unmatched_count > 0 ? 'text-amber-600' : 'text-green-600'}>
                      {batch.matched_count}/{batch.row_count}
                    </span>
                  ) : '—'}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ap-cream-500">
                  Aucun import effectué
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
