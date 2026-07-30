'use client'

import { useState } from 'react'
import type { MarginLevel } from '@/types/database'
import { MarginBadge } from '../../components/margin-badge'
import { formatCents, formatBps } from '../../lib/cost-calculations'
import { ProductSheetForm } from './product-sheet-form'
import { RecipeEditor } from './recipe-editor'
import { PackagingEditor } from './packaging-editor'
import { LaborEditor } from './labor-editor'
import { CostSummary } from './cost-summary'

type Tab = 'recette' | 'packaging' | 'mo' | 'synthese' | 'infos'

interface ProductDetailProps {
  orgSlug: string
  sheet: {
    id: string
    name: string
    category_id: string | null
    customer_id: string | null
    selling_price_cents: number | null
    theoretical_output_per_hour: number | null
    mp_cost_cents: number | null
    packaging_cost_cents: number | null
    labor_cost_cents: number | null
    total_cost_cents: number | null
    margin_cents: number | null
    margin_rate_bps: number | null
    margin_level: string | null
    product_categories: { name: string } | null
    customers: { name: string } | null
  }
  recipeLines: Array<{
    id: string
    ingredient_id: string
    quantity: number
    unit: string
    line_cost_cents: number | null
    display_order: number
    ingredients: { name: string; price_cents: number; unit: string } | null
  }>
  packagingLines: Array<{
    id: string
    packaging_item_id: string
    quantity_per_product: number
    line_cost_cents: number | null
    display_order: number
    packaging_items: { name: string; unit_price_cents: number; unit: string } | null
  }>
  productLabor: Array<{
    id: string
    pole_id: string
    headcount_override: number | null
    rate_override_cents: number | null
    labor_poles: { name: string; default_headcount: number; hourly_rate_cents: number } | null
  }>
  ingredients: Array<{ id: string; name: string; price_cents: number; unit: string }>
  packagingItems: Array<{ id: string; name: string; unit_price_cents: number; unit: string }>
  laborPoles: Array<{ id: string; name: string; default_headcount: number; hourly_rate_cents: number }>
  categories: Array<{ id: string; name: string }>
  customers: Array<{ id: string; name: string }>
}

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'recette', label: 'Recette (MP)' },
  { key: 'packaging', label: 'Packaging' },
  { key: 'mo', label: "Main-d'œuvre" },
  { key: 'synthese', label: 'Synthèse' },
  { key: 'infos', label: 'Infos' },
]

export function ProductDetail({
  orgSlug, sheet, recipeLines, packagingLines, productLabor,
  ingredients, packagingItems, laborPoles, categories, customers,
}: ProductDetailProps) {
  const [tab, setTab] = useState<Tab>('recette')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-medium text-ap-green-900">{sheet.name}</h2>
          <div className="flex gap-2 text-sm text-ap-cream-700 mt-0.5">
            {sheet.product_categories?.name && <span>{sheet.product_categories.name}</span>}
            {sheet.customers?.name && <span>• {sheet.customers.name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {sheet.margin_rate_bps != null && (
            <span className="text-lg font-medium text-ap-green-900">{formatBps(sheet.margin_rate_bps)}</span>
          )}
          <MarginBadge level={sheet.margin_level as MarginLevel | null} />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-ap-cream-100 p-3">
          <span className="text-xs text-ap-cream-700">Coût MP</span>
          <p className="text-lg font-medium text-ap-green-900">{sheet.mp_cost_cents != null ? formatCents(sheet.mp_cost_cents) : '—'}</p>
        </div>
        <div className="rounded-lg bg-ap-cream-100 p-3">
          <span className="text-xs text-ap-cream-700">Coût Packaging</span>
          <p className="text-lg font-medium text-ap-green-900">{sheet.packaging_cost_cents != null ? formatCents(sheet.packaging_cost_cents) : '—'}</p>
        </div>
        <div className="rounded-lg bg-ap-cream-100 p-3">
          <span className="text-xs text-ap-cream-700">Coût MO</span>
          <p className="text-lg font-medium text-ap-green-900">{sheet.labor_cost_cents != null ? formatCents(sheet.labor_cost_cents) : '—'}</p>
        </div>
        <div className="rounded-lg bg-ap-green-100 p-3">
          <span className="text-xs text-ap-cream-700">Coût total</span>
          <p className="text-lg font-medium text-ap-green-900">{sheet.total_cost_cents != null ? formatCents(sheet.total_cost_cents) : '—'}</p>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Tab content */}
      {tab === 'recette' && (
        <RecipeEditor
          orgSlug={orgSlug}
          sheetId={sheet.id}
          lines={recipeLines}
          ingredients={ingredients}
        />
      )}
      {tab === 'packaging' && (
        <PackagingEditor
          orgSlug={orgSlug}
          sheetId={sheet.id}
          lines={packagingLines}
          packagingItems={packagingItems}
        />
      )}
      {tab === 'mo' && (
        <LaborEditor
          orgSlug={orgSlug}
          sheetId={sheet.id}
          assignments={productLabor}
          poles={laborPoles}
          cadence={sheet.theoretical_output_per_hour}
        />
      )}
      {tab === 'synthese' && (
        <CostSummary sheet={sheet} />
      )}
      {tab === 'infos' && (
        <ProductSheetForm
          orgSlug={orgSlug}
          categories={categories}
          customers={customers}
          initial={{
            id: sheet.id,
            name: sheet.name,
            category_id: sheet.category_id,
            customer_id: sheet.customer_id,
            selling_price_cents: sheet.selling_price_cents,
            theoretical_output_per_hour: sheet.theoretical_output_per_hour,
          }}
        />
      )}
    </div>
  )
}
