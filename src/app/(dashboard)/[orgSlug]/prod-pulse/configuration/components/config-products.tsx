'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { PpProduct, ProductionLine } from '@/types/database'
import { createProduct, updateProduct, deleteProduct, linkProduct, unlinkProduct, getLineProducts } from '../../actions'

interface ConfigProductsProps {
  orgSlug: string
  products: PpProduct[]
  lines: ProductionLine[]
}

export function ConfigProducts({ orgSlug, products, lines }: ConfigProductsProps) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [cycleTimeSec, setCycleTimeSec] = useState('12')
  const [unitLabel, setUnitLabel] = useState('pièce')
  const [isPending, startTransition] = useTransition()

  // Line association
  const [linkingProductId, setLinkingProductId] = useState<string | null>(null)
  const [linkedLines, setLinkedLines] = useState<Array<{ id: string; line_id: string; pp_products: unknown }>>([])
  const [selectedLineId, setSelectedLineId] = useState('')

  function openCreate() {
    setEditId(null)
    setName('')
    setCycleTimeSec('12')
    setUnitLabel('pièce')
    setShowForm(true)
  }

  function openEdit(p: PpProduct) {
    setEditId(p.id)
    setName(p.name)
    setCycleTimeSec((p.cycle_time_ms / 1000).toString())
    setUnitLabel(p.unit_label)
    setShowForm(true)
  }

  function handleSubmit() {
    if (!name.trim()) return
    const ms = Math.round(parseFloat(cycleTimeSec || '12') * 1000)
    if (ms < 100) { toast.error('Temps de cycle minimum : 0.1s'); return }

    startTransition(async () => {
      const result = editId
        ? await updateProduct(orgSlug, editId, { name: name.trim(), cycle_time_ms: ms, unit_label: unitLabel })
        : await createProduct(orgSlug, { name: name.trim(), cycle_time_ms: ms, unit_label: unitLabel })

      if ('error' in result) toast.error(result.error)
      else {
        toast.success(editId ? 'Produit mis à jour' : 'Produit créé')
        setShowForm(false)
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteProduct(orgSlug, id)
      if ('error' in result) toast.error(result.error)
      else toast.success('Produit supprimé')
    })
  }

  function openLinking(productId: string) {
    setLinkingProductId(productId)
    startTransition(async () => {
      const links: Array<{ id: string; line_id: string; pp_products: unknown }> = []
      for (const line of lines) {
        const lp = await getLineProducts(line.id)
        for (const l of lp) {
          if (l.product_id === productId) {
            links.push({ id: l.id, line_id: l.line_id, pp_products: l.pp_products })
          }
        }
      }
      setLinkedLines(links)
    })
  }

  function handleLink() {
    if (!selectedLineId || !linkingProductId) return
    startTransition(async () => {
      const result = await linkProduct(orgSlug, selectedLineId, linkingProductId, null)
      if ('error' in result) toast.error(result.error)
      else {
        toast.success('Association créée')
        openLinking(linkingProductId)
        setSelectedLineId('')
      }
    })
  }

  function handleUnlink(linkId: string) {
    startTransition(async () => {
      const result = await unlinkProduct(orgSlug, linkId)
      if ('error' in result) toast.error(result.error)
      else {
        toast.success('Association supprimée')
        if (linkingProductId) openLinking(linkingProductId)
      }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ap-cream-700">{products.length} produit(s)</p>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-ap-cream-200 bg-white p-5 mb-4">
          <h3 className="text-lg font-medium text-ap-green-900 mb-4">
            {editId ? 'Modifier le produit' : 'Nouveau produit'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="prodName">Nom</Label>
              <Input id="prodName" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="Salade César" />
            </div>
            <div>
              <Label htmlFor="cycleTime">Temps de cycle (s)</Label>
              <Input id="cycleTime" type="number" step="0.1" min="0.1" value={cycleTimeSec} onChange={(e) => setCycleTimeSec(e.target.value)} className="mt-1" />
              <p className="text-xs text-ap-cream-600 mt-1">
                = {Math.round(3600 / parseFloat(cycleTimeSec || '12'))} {unitLabel}s/h
              </p>
            </div>
            <div>
              <Label htmlFor="unitLabel">Unité</Label>
              <select
                id="unitLabel"
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                className="w-full mt-1 rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-ap-green-500"
              >
                <option value="pièce">pièce</option>
                <option value="barquette">barquette</option>
                <option value="sachet">sachet</option>
                <option value="carton">carton</option>
                <option value="kg">kg</option>
                <option value="litre">litre</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isPending}>{editId ? 'Modifier' : 'Créer'}</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </div>
      )}

      {/* Line association modal */}
      {linkingProductId && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 mb-4">
          <h3 className="text-lg font-medium text-ap-green-900 mb-3">
            Lignes associées — {products.find((p) => p.id === linkingProductId)?.name}
          </h3>
          {linkedLines.length > 0 && (
            <ul className="space-y-2 mb-3">
              {linkedLines.map((ll) => (
                <li key={ll.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                  <span className="text-sm text-ap-green-900">{lines.find((l) => l.id === ll.line_id)?.name}</span>
                  <button onClick={() => handleUnlink(ll.id)} className="text-red-600 text-xs hover:underline">Retirer</button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <select
              value={selectedLineId}
              onChange={(e) => setSelectedLineId(e.target.value)}
              className="flex-1 rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Sélectionner une ligne…</option>
              {lines.filter((l) => !linkedLines.some((ll) => ll.line_id === l.id)).map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <Button onClick={handleLink} disabled={!selectedLineId || isPending}>Associer</Button>
            <Button variant="outline" onClick={() => setLinkingProductId(null)}>Fermer</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ap-cream-300">
              <th className="text-left px-4 py-3 text-ap-cream-700 font-normal">Nom</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">Cadence</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal">Unité</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-ap-cream-200 hover:bg-ap-cream-100">
                <td className="px-4 py-3 text-ap-green-900 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-right text-ap-cream-800">{(p.cycle_time_ms / 1000).toFixed(1)}s</td>
                <td className="px-4 py-3 text-right text-ap-cream-800">{p.unit_label}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openLinking(p.id)} className="px-2 py-1 text-xs rounded bg-ap-green-50 text-ap-green-700 hover:bg-ap-green-100">Lignes</button>
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-ap-cream-200 text-ap-cream-700" aria-label="Modifier">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" aria-label="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ap-cream-600">
                  Aucun produit configuré.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
