'use client'

import { useState } from 'react'
import { IngredientsTable } from './ingredients-table'
import { PackagingTable } from './packaging-table'
import { LaborPolesTable } from './labor-poles-table'
import { CategoriesTable } from './categories-table'
import { CustomersTable } from './customers-table'

type RefTab = 'ingredients' | 'packaging' | 'labor' | 'categories' | 'customers'

const TABS: Array<{ key: RefTab; label: string }> = [
  { key: 'ingredients', label: 'Ingrédients' },
  { key: 'packaging', label: 'Packaging' },
  { key: 'labor', label: 'Pôles MO' },
  { key: 'categories', label: 'Catégories' },
  { key: 'customers', label: 'Clients' },
]

interface ReferentielsClientProps {
  orgSlug: string
  ingredients: Array<{
    id: string; name: string; category: string | null; unit: string
    price_cents: number; supplier: string | null; price_updated_at: string
  }>
  packagingItems: Array<{
    id: string; name: string; packaging_type: string | null; unit: string
    unit_price_cents: number; supplier: string | null; price_updated_at: string
  }>
  laborPoles: Array<{
    id: string; name: string; default_headcount: number
    hourly_rate_cents: number; display_order: number
  }>
  categories: Array<{ id: string; name: string }>
  customers: Array<{ id: string; name: string }>
}

export function ReferentielsClient({
  orgSlug, ingredients, packagingItems, laborPoles, categories, customers,
}: ReferentielsClientProps) {
  const [tab, setTab] = useState<RefTab>('ingredients')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-ap-cream-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key
                ? 'border-ap-green-700 text-ap-green-900'
                : 'border-transparent text-ap-cream-700 hover:text-ap-green-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ingredients' && <IngredientsTable orgSlug={orgSlug} items={ingredients} />}
      {tab === 'packaging' && <PackagingTable orgSlug={orgSlug} items={packagingItems} />}
      {tab === 'labor' && <LaborPolesTable orgSlug={orgSlug} items={laborPoles} />}
      {tab === 'categories' && <CategoriesTable orgSlug={orgSlug} items={categories} />}
      {tab === 'customers' && <CustomersTable orgSlug={orgSlug} items={customers} />}
    </div>
  )
}
