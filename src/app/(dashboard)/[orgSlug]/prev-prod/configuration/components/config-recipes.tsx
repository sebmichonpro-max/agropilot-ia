'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { PrevRecipe } from '@/types/database'
import { STOCK_TYPE_LABELS, PRIORITY_LABELS, FORECAST_METHOD_LABELS } from '@/modules/prev-prod'
import { createRecipe, updateRecipe, deleteRecipe, importRecipesCsv } from '../../actions'
import { CsvDropZone } from './csv-drop-zone'

interface ConfigRecipesProps {
  orgSlug: string
  recipes: PrevRecipe[]
}

export function ConfigRecipes({ orgSlug, recipes }: ConfigRecipesProps) {
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [stockType, setStockType] = useState<string>('sur_commande')
  const [priority, setPriority] = useState<string>('journee')
  const [method, setMethod] = useState<string>('dernier_jour')
  const [coverage, setCoverage] = useState('0')
  const [minBatch, setMinBatch] = useState('30')
  const [minBatchException, setMinBatchException] = useState(false)
  const [lossPct, setLossPct] = useState('3')

  function resetForm() {
    setCode('')
    setName('')
    setBrand('')
    setStockType('sur_commande')
    setPriority('journee')
    setMethod('dernier_jour')
    setCoverage('0')
    setMinBatch('30')
    setMinBatchException(false)
    setLossPct('3')
  }

  function openCreate() {
    setEditId(null)
    resetForm()
    setShowForm(true)
  }

  function openEdit(r: PrevRecipe) {
    setEditId(r.id)
    setCode(r.code)
    setName(r.name)
    setBrand(r.brand ?? '')
    setStockType(r.stock_type)
    setPriority(r.dispatch_priority)
    setMethod(r.forecast_method)
    setCoverage(String(r.coverage_j1_pct))
    setMinBatch(String(r.min_batch_grams / 1000))
    setMinBatchException(r.min_batch_exception)
    setLossPct(String(r.loss_pct))
    setShowForm(true)
  }

  function handleSubmit() {
    if (!code.trim() || !name.trim()) return

    const input = {
      code: code.trim(),
      name: name.trim(),
      brand: brand.trim() || null,
      stock_type: stockType as 'stock_permanent' | 'sur_commande' | 'mixte',
      dispatch_priority: priority as 'matin' | 'journee' | 'avance',
      forecast_method: method as 'dernier_jour' | 'moyenne_4sem' | 'moyenne_ponderee',
      coverage_j1_pct: parseInt(coverage) || 0,
      min_batch_grams: Math.round((parseFloat(minBatch) || 30) * 1000),
      min_batch_exception: minBatchException,
      loss_pct: parseFloat(lossPct) || 3,
    }

    startTransition(async () => {
      const result = editId
        ? await updateRecipe(orgSlug, editId, input)
        : await createRecipe(orgSlug, input)
      if ('error' in result) toast.error(result.error)
      else {
        toast.success(editId ? 'Recette mise à jour' : 'Recette créée')
        setShowForm(false)
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteRecipe(orgSlug, id)
      if ('error' in result) toast.error(result.error)
      else toast.success('Recette supprimée')
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ap-cream-700">{recipes.length} recette(s)</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setShowImport(true); setShowForm(false) }} className="gap-2">
            <FileUp className="h-4 w-4" /> Importer CSV
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>
      </div>

      {showImport && (
        <CsvDropZone
          hint="Fichier NOMENCLATURE.csv avec colonnes : code_recette;nom_recette;lot_kg. Extrait les recettes uniques avec code, nom et quantité lot. Les recettes existantes sont ignorées."
          isPending={isPending}
          onClose={() => setShowImport(false)}
          onImport={(text) => {
            startTransition(async () => {
              const result = await importRecipesCsv(orgSlug, text)
              if ('error' in result) toast.error(result.error)
              else {
                toast.success(`${result.created} recette(s) créée(s), ${result.skipped} ignorée(s)`)
                setShowImport(false)
              }
            })
          }}
        />
      )}

      {showForm && (
        <div className="rounded-xl border border-ap-cream-200 bg-white p-5 mb-4">
          <h3 className="text-lg font-medium text-ap-green-900 mb-4">
            {editId ? 'Modifier la recette' : 'Nouvelle recette'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="recCode">Code</Label>
              <Input id="recCode" value={code} onChange={(e) => setCode(e.target.value)} className="mt-1" placeholder="REC-TAB" />
            </div>
            <div>
              <Label htmlFor="recName">Nom</Label>
              <Input id="recName" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="Taboulé" />
            </div>
            <div>
              <Label htmlFor="recBrand">Marque</Label>
              <Input id="recBrand" value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1" placeholder="Fresh" />
            </div>
            <div>
              <Label htmlFor="recStockType">Type de stock</Label>
              <select id="recStockType" value={stockType} onChange={(e) => setStockType(e.target.value)} className="mt-1 w-full rounded-md border border-ap-cream-300 px-3 py-2 text-sm">
                {Object.entries(STOCK_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="recPriority">Priorité départ</Label>
              <select id="recPriority" value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 w-full rounded-md border border-ap-cream-300 px-3 py-2 text-sm">
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="recMethod">Méthode stock cible</Label>
              <select id="recMethod" value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1 w-full rounded-md border border-ap-cream-300 px-3 py-2 text-sm">
                {Object.entries(FORECAST_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="recCoverage">Couverture J+1 (%)</Label>
              <Input id="recCoverage" type="number" min="0" max="100" value={coverage} onChange={(e) => setCoverage(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="recMinBatch">Seuil minimum (kg)</Label>
              <Input id="recMinBatch" type="number" step="1" min="0" value={minBatch} onChange={(e) => setMinBatch(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="recLoss">Perte (%)</Label>
              <Input id="recLoss" type="number" step="0.5" min="0" max="100" value={lossPct} onChange={(e) => setLossPct(e.target.value)} className="mt-1" />
            </div>
          </div>
          <label className="flex items-center gap-2 mb-4 text-sm text-ap-cream-700">
            <input type="checkbox" checked={minBatchException} onChange={(e) => setMinBatchException(e.target.checked)} className="rounded" />
            Exception seuil minimum (autoriser les petites séries)
          </label>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isPending}>{editId ? 'Modifier' : 'Créer'}</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ap-cream-300">
                <th className="text-left px-4 py-3 text-ap-cream-700 font-normal">Code</th>
                <th className="text-left px-4 py-3 text-ap-cream-700 font-normal">Nom</th>
                <th className="text-left px-4 py-3 text-ap-cream-700 font-normal hidden md:table-cell">Marque</th>
                <th className="text-left px-4 py-3 text-ap-cream-700 font-normal hidden lg:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-ap-cream-700 font-normal hidden lg:table-cell">Priorité</th>
                <th className="text-right px-4 py-3 text-ap-cream-700 font-normal hidden md:table-cell">Seuil</th>
                <th className="text-right px-4 py-3 text-ap-cream-700 font-normal w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => (
                <tr key={r.id} className="border-b border-ap-cream-200 hover:bg-ap-cream-100">
                  <td className="px-4 py-3 text-ap-cream-600 font-mono text-xs">{r.code}</td>
                  <td className="px-4 py-3 text-ap-green-900 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-ap-cream-700 hidden md:table-cell">{r.brand ?? '—'}</td>
                  <td className="px-4 py-3 text-ap-cream-700 hidden lg:table-cell">{STOCK_TYPE_LABELS[r.stock_type]}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.dispatch_priority === 'matin' ? 'bg-red-100 text-red-700' : 'bg-ap-cream-200 text-ap-cream-700'}`}>
                      {PRIORITY_LABELS[r.dispatch_priority]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-ap-cream-700 hidden md:table-cell">
                    {(r.min_batch_grams / 1000).toFixed(0)} kg
                    {r.min_batch_exception && <span className="text-xs text-amber-600 ml-1">(exc.)</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-ap-cream-200 text-ap-cream-700" aria-label="Modifier"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {recipes.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-ap-cream-600">Aucune recette configurée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
