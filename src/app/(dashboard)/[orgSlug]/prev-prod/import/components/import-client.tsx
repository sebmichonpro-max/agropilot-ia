'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import {
  Upload,
  FileText,
  AlertTriangle,
  Clock,
  X,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { PrevImportBatch } from '@/types/database'
import { importOrdersCsv, importStocksCsv, importDivaltoTiers, importDivaltoArticle } from '../../actions'

const IMPORT_TYPES = [
  { key: 'commande' as const, label: 'Commandes fermes', icon: '📦', group: 'csv' as const },
  { key: 'devis' as const, label: 'Devis en cours', icon: '📋', group: 'csv' as const },
  { key: 'stocks' as const, label: 'Stocks produits finis', icon: '📊', group: 'csv' as const },
  { key: 'divalto_tiers' as const, label: 'Divalto — Tri par Tiers', icon: '🏭', group: 'divalto' as const },
  { key: 'divalto_article' as const, label: 'Divalto — Tri par Article', icon: '📑', group: 'divalto' as const },
] as const

type ImportType = (typeof IMPORT_TYPES)[number]['key']

interface DivaltoResult {
  format: 'tiers' | 'article'
  period: string | null
  totalRecords: number
  uniqueProducts?: number
  uniqueClients?: number
  clientsCreated?: number
  productsUpdated?: number
  matchedCount?: number
  unmatchedCount?: number
  deliveryDate?: string
  needs: Array<{
    code_produit: string
    designation: string
    total_poids_kg: number
    poids_avec_perte_kg: number
    nb_clients: number
    seuil_ok: boolean
  }>
  errors: string[]
}

interface CsvResult {
  totalRows: number
  matchedCount: number
  unmatchedCount: number
  parseErrors: Array<{ row: number; column: string; message: string }>
}

interface ImportClientProps {
  orgSlug: string
  recentBatches: PrevImportBatch[]
}

async function readFileWithEncoding(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  try {
    const decoder = new TextDecoder('windows-1252')
    const text = decoder.decode(buffer)
    if (text.includes('Tri par') || text.includes(';')) return text
  } catch {
    // fallback to UTF-8
  }
  return new TextDecoder('utf-8').decode(buffer)
}

export function ImportClient({ orgSlug, recentBatches }: ImportClientProps) {
  const [importType, setImportType] = useState<ImportType>('commande')
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0])
  const [isPending, startTransition] = useTransition()
  const [divaltoResult, setDivaltoResult] = useState<DivaltoResult | null>(null)
  const [csvResult, setCsvResult] = useState<CsvResult | null>(null)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const isDivalto = importType === 'divalto_tiers' || importType === 'divalto_article'

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) {
      setDroppedFile(file)
      setDivaltoResult(null)
      setCsvResult(null)
    } else {
      toast.error('Format non supporté. Utilisez un fichier .csv ou .txt')
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setDroppedFile(file)
      setDivaltoResult(null)
      setCsvResult(null)
    }
  }, [])

  const clearFile = useCallback(() => {
    setDroppedFile(null)
    setDivaltoResult(null)
    setCsvResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  function handleUpload() {
    const file = droppedFile
    if (!file) {
      toast.error('Sélectionnez un fichier')
      return
    }

    startTransition(async () => {
      const text = isDivalto
        ? await readFileWithEncoding(file)
        : await file.text()

      if (importType === 'divalto_tiers') {
        const result = await importDivaltoTiers(orgSlug, text, file.name)
        if ('error' in result) {
          toast.error(result.error)
        } else {
          toast.success(`Import Divalto Tiers réussi : ${result.totalRecords} lignes, ${result.uniqueClients} clients`)
          setDivaltoResult({
            format: 'tiers',
            period: result.period,
            totalRecords: result.totalRecords,
            uniqueProducts: result.uniqueProducts,
            uniqueClients: result.uniqueClients,
            clientsCreated: result.clientsCreated,
            productsUpdated: result.productsUpdated,
            needs: result.needs,
            errors: result.errors,
          })
          setCsvResult(null)
        }
      } else if (importType === 'divalto_article') {
        const result = await importDivaltoArticle(orgSlug, text, deliveryDate, file.name)
        if ('error' in result) {
          toast.error(result.error)
        } else {
          toast.success(`Import Divalto Article réussi : ${result.matchedCount} produits matchés`)
          setDivaltoResult({
            format: 'article',
            period: result.period,
            totalRecords: result.totalRecords,
            matchedCount: result.matchedCount,
            unmatchedCount: result.unmatchedCount,
            deliveryDate: result.deliveryDate,
            needs: result.needs,
            errors: result.errors,
          })
          setCsvResult(null)
        }
      } else if (importType === 'stocks') {
        const result = await importStocksCsv(orgSlug, text, deliveryDate, file.name)
        if ('error' in result) {
          toast.error(result.error)
        } else if ('success' in result) {
          toast.success(`Import réussi : ${result.matchedCount} lignes matchées`)
          setCsvResult({
            totalRows: result.totalRows!,
            matchedCount: result.matchedCount!,
            unmatchedCount: result.unmatchedCount!,
            parseErrors: result.parseErrors ?? [],
          })
          setDivaltoResult(null)
        }
      } else {
        const result = await importOrdersCsv(orgSlug, text, importType, deliveryDate, file.name)
        if ('error' in result) {
          toast.error(result.error)
        } else if ('success' in result) {
          toast.success(`Import réussi : ${result.matchedCount} lignes matchées`)
          setCsvResult({
            totalRows: result.totalRows!,
            matchedCount: result.matchedCount!,
            unmatchedCount: result.unmatchedCount!,
            parseErrors: result.parseErrors ?? [],
          })
          setDivaltoResult(null)
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-ap-green-900">Import de données</h2>

      {/* CSV standard */}
      <div>
        <p className="text-xs font-medium text-ap-cream-500 uppercase tracking-wide mb-2">CSV standard</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {IMPORT_TYPES.filter((t) => t.group === 'csv').map((t) => (
            <button
              key={t.key}
              onClick={() => { setImportType(t.key); clearFile() }}
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
      </div>

      {/* Divalto ERP */}
      <div>
        <p className="text-xs font-medium text-ap-cream-500 uppercase tracking-wide mb-2">Export Divalto ERP</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {IMPORT_TYPES.filter((t) => t.group === 'divalto').map((t) => (
            <button
              key={t.key}
              onClick={() => { setImportType(t.key); clearFile() }}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-colors text-left ${
                importType === t.key
                  ? 'border-ap-green-900 bg-ap-green-900/5'
                  : 'border-ap-cream-200 bg-white hover:border-ap-cream-400'
              }`}
            >
              <span className="text-2xl">{t.icon}</span>
              <div>
                <span className={`text-sm font-medium block ${importType === t.key ? 'text-ap-green-900' : 'text-ap-cream-800'}`}>
                  {t.label}
                </span>
                <span className="text-xs text-ap-cream-500">
                  {t.key === 'divalto_tiers' ? 'Référentiel mensuel (clients → produits)' : 'Commandes du jour (produits → clients)'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Drag & drop zone + date */}
      <div className="rounded-xl border border-ap-cream-200 bg-white p-6 space-y-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer ${
            isDragOver
              ? 'border-ap-green-900 bg-ap-green-900/5'
              : droppedFile
                ? 'border-green-400 bg-green-50'
                : 'border-ap-cream-300 hover:border-ap-cream-400 bg-ap-cream-50/50'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />

          {droppedFile ? (
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-ap-green-900">{droppedFile.name}</p>
                <p className="text-xs text-ap-cream-500">
                  {(droppedFile.size / 1024).toFixed(1)} Ko
                  {isDivalto && ' — Décodage CP1252 automatique'}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); clearFile() }}
                className="ml-2 p-1 rounded-full hover:bg-ap-cream-200"
              >
                <X className="h-4 w-4 text-ap-cream-500" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-ap-cream-400 mb-3" />
              <p className="text-sm font-medium text-ap-cream-700">
                Glissez votre fichier ici
              </p>
              <p className="text-xs text-ap-cream-500 mt-1">
                ou cliquez pour sélectionner — .csv ou .txt
                {isDivalto && ' (encodage CP1252 auto-détecté)'}
              </p>
            </>
          )}
        </div>

        {(importType === 'divalto_article' || importType === 'commande' || importType === 'devis' || importType === 'stocks') && (
          <div className="max-w-xs">
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
              {isDivalto
                ? 'Utilisée si le fichier ne contient pas de dates de livraison.'
                : 'Auto-détectée si le nom du fichier contient une date.'}
            </p>
          </div>
        )}

        <Button onClick={handleUpload} disabled={isPending || !droppedFile} className="gap-2">
          <Upload className="h-4 w-4" />
          {isPending ? 'Import en cours...' : 'Importer'}
        </Button>
      </div>

      {/* Divalto result */}
      {divaltoResult && (
        <DivaltoResultCard result={divaltoResult} />
      )}

      {/* CSV result */}
      {csvResult && (
        <div className="rounded-xl border border-ap-cream-200 bg-white p-6">
          <h3 className="font-medium text-ap-green-900 mb-3">Résultat de l&apos;import</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <StatBox value={csvResult.totalRows} label="Lignes totales" color="default" />
            <StatBox value={csvResult.matchedCount} label="Matchées" color="green" />
            <StatBox value={csvResult.unmatchedCount} label="Non matchées" color={csvResult.unmatchedCount > 0 ? 'amber' : 'default'} />
          </div>
          {csvResult.parseErrors.length > 0 && (
            <div className="border-t border-ap-cream-200 pt-3">
              <p className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                {csvResult.parseErrors.length} erreur(s) de parsing
              </p>
              <div className="max-h-40 overflow-y-auto text-xs text-ap-cream-600 space-y-1">
                {csvResult.parseErrors.map((err, i) => (
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ap-cream-200">
                <th className="text-left px-4 py-2 text-ap-cream-600 font-normal text-xs">Date</th>
                <th className="text-left px-4 py-2 text-ap-cream-600 font-normal text-xs">Type</th>
                <th className="text-left px-4 py-2 text-ap-cream-600 font-normal text-xs">Source</th>
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
                  <td className="px-4 py-2 text-ap-cream-600">
                    <SourceBadge source={batch.source} />
                  </td>
                  <td className="px-4 py-2 text-ap-cream-600 hidden sm:table-cell truncate max-w-[200px]">{batch.filename ?? '—'}</td>
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
                  <td colSpan={6} className="px-4 py-8 text-center text-ap-cream-500">
                    Aucun import effectué
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatBox({ value, label, color }: { value: number; label: string; color: 'default' | 'green' | 'amber' }) {
  const colorClass = color === 'green' ? 'text-green-600' : color === 'amber' ? 'text-amber-600' : 'text-ap-green-900'
  return (
    <div className="text-center">
      <p className={`text-2xl font-semibold ${colorClass}`}>{value}</p>
      <p className="text-xs text-ap-cream-600">{label}</p>
    </div>
  )
}

function SourceBadge({ source }: { source: string }) {
  if (source.startsWith('divalto')) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Divalto</span>
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-ap-cream-100 text-ap-cream-700">CSV</span>
}

function DivaltoResultCard({ result }: { result: DivaltoResult }) {
  const [showNeeds, setShowNeeds] = useState(false)

  return (
    <div className="rounded-xl border border-ap-cream-200 bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-ap-green-900">
          Résultat — Divalto {result.format === 'tiers' ? 'Tri par Tiers' : 'Tri par Article'}
        </h3>
        {result.period && (
          <span className="text-xs text-ap-cream-500 bg-ap-cream-100 px-2 py-1 rounded">
            Période : {result.period}
          </span>
        )}
      </div>

      {result.format === 'tiers' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBox value={result.totalRecords} label="Lignes parsées" color="default" />
          <StatBox value={result.uniqueProducts ?? 0} label="Produits uniques" color="default" />
          <StatBox value={result.uniqueClients ?? 0} label="Clients uniques" color="default" />
          <StatBox value={result.productsUpdated ?? 0} label="Produits mis à jour" color="green" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBox value={result.totalRecords} label="Lignes parsées" color="default" />
          <StatBox value={result.matchedCount ?? 0} label="Produits matchés" color="green" />
          <StatBox value={result.unmatchedCount ?? 0} label="Non matchés" color={result.unmatchedCount && result.unmatchedCount > 0 ? 'amber' : 'default'} />
          {result.deliveryDate && (
            <div className="text-center">
              <p className="text-sm font-semibold text-ap-green-900">{result.deliveryDate}</p>
              <p className="text-xs text-ap-cream-600">Date livraison</p>
            </div>
          )}
        </div>
      )}

      {result.errors.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-sm font-medium text-amber-700 mb-1 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Avertissements
          </p>
          <ul className="text-xs text-amber-600 space-y-0.5">
            {result.errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      {result.needs.length > 0 && (
        <div>
          <button
            onClick={() => setShowNeeds(!showNeeds)}
            className="flex items-center gap-2 text-sm font-medium text-ap-green-900 hover:text-ap-green-700"
          >
            <ArrowRight className={`h-4 w-4 transition-transform ${showNeeds ? 'rotate-90' : ''}`} />
            Besoins agrégés ({result.needs.length} produits)
          </button>

          {showNeeds && (
            <div className="mt-3 overflow-x-auto rounded-lg border border-ap-cream-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-ap-cream-50 border-b border-ap-cream-200">
                    <th className="text-left px-3 py-2 font-medium text-ap-cream-600">Code</th>
                    <th className="text-left px-3 py-2 font-medium text-ap-cream-600">Désignation</th>
                    <th className="text-right px-3 py-2 font-medium text-ap-cream-600">Poids (kg)</th>
                    <th className="text-right px-3 py-2 font-medium text-ap-cream-600">+perte</th>
                    <th className="text-right px-3 py-2 font-medium text-ap-cream-600">Clients</th>
                    <th className="text-center px-3 py-2 font-medium text-ap-cream-600">Seuil</th>
                  </tr>
                </thead>
                <tbody>
                  {result.needs.map((n) => (
                    <tr key={n.code_produit} className="border-b border-ap-cream-100 hover:bg-ap-cream-50">
                      <td className="px-3 py-1.5 font-mono text-ap-cream-700">{n.code_produit}</td>
                      <td className="px-3 py-1.5 text-ap-cream-800 truncate max-w-[200px]">{n.designation}</td>
                      <td className="px-3 py-1.5 text-right text-ap-cream-800">{n.total_poids_kg.toFixed(1)}</td>
                      <td className="px-3 py-1.5 text-right text-ap-cream-600">{n.poids_avec_perte_kg.toFixed(1)}</td>
                      <td className="px-3 py-1.5 text-right text-ap-cream-800">{n.nb_clients}</td>
                      <td className="px-3 py-1.5 text-center">
                        {n.seuil_ok ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
