'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createProductSheet, updateProductSheet } from '../../actions'

interface ProductSheetFormProps {
  orgSlug: string
  categories: Array<{ id: string; name: string }>
  customers: Array<{ id: string; name: string }>
  initial?: {
    id: string
    name: string
    category_id: string | null
    customer_id: string | null
    selling_price_cents: number | null
    theoretical_output_per_hour: number | null
  }
}

export function ProductSheetForm({ orgSlug, categories, customers, initial }: ProductSheetFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(initial?.name ?? '')
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '')
  const [customerId, setCustomerId] = useState(initial?.customer_id ?? '')
  const [sellingPrice, setSellingPrice] = useState(initial?.selling_price_cents != null ? (initial.selling_price_cents / 100).toFixed(2) : '')
  const [cadence, setCadence] = useState(initial?.theoretical_output_per_hour?.toString() ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Le nom est requis'); return }

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        category_id: categoryId || null,
        customer_id: customerId || null,
        selling_price_cents: sellingPrice ? Math.round(parseFloat(sellingPrice) * 100) : null,
        theoretical_output_per_hour: cadence ? parseInt(cadence) : null,
      }

      if (initial) {
        const res = await updateProductSheet(orgSlug, initial.id, payload)
        if (res.error) { toast.error(res.error); return }
        toast.success('Fiche mise à jour')
        router.refresh()
      } else {
        const res = await createProductSheet(orgSlug, payload)
        if (res.error) { toast.error(res.error); return }
        toast.success('Fiche créée')
        if (res.id) router.push(`/${orgSlug}/marge-flash/produits/${res.id}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-ap-cream-200 bg-white p-5 max-w-lg space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ap-green-900 mb-1">Nom du produit</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Salade César 250g — Leclerc"
          className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ap-green-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-ap-green-900 mb-1">Catégorie</label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">— Aucune —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="customer" className="block text-sm font-medium text-ap-green-900 mb-1">Client</label>
          <select
            id="customer"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">— Aucun —</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-ap-green-900 mb-1">Prix de vente HT (€)</label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            placeholder="2.90"
            className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ap-green-500"
          />
        </div>
        <div>
          <label htmlFor="cadence" className="block text-sm font-medium text-ap-green-900 mb-1">Cadence (pièces/h)</label>
          <input
            id="cadence"
            type="number"
            min="1"
            value={cadence}
            onChange={(e) => setCadence(e.target.value)}
            placeholder="500"
            className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ap-green-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 rounded-lg bg-ap-green-900 text-ap-green-100 text-sm font-medium hover:bg-ap-green-800 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Enregistrement…' : initial ? 'Mettre à jour' : 'Créer la fiche'}
      </button>
    </form>
  )
}
