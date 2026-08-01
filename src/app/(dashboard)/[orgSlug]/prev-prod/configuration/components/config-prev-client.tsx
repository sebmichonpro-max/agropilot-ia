'use client'

import { useState } from 'react'
import type { PrevLine, PrevMixer, PrevRecipe, PrevProduct, PrevClient, PrevHoliday } from '@/types/database'
import { ConfigPrevLines } from './config-prev-lines'
import { ConfigMixers } from './config-mixers'
import { ConfigRecipes } from './config-recipes'
import { ConfigPrevProducts } from './config-prev-products'
import { ConfigClients } from './config-clients'
import { ConfigHolidays } from './config-holidays'

const CONFIG_TABS = [
  { key: 'lines', label: 'Lignes' },
  { key: 'mixers', label: 'Mélangeurs' },
  { key: 'recipes', label: 'Recettes' },
  { key: 'products', label: 'Produits / SKU' },
  { key: 'clients', label: 'Clients' },
  { key: 'holidays', label: 'Jours fériés' },
] as const

type ConfigTab = (typeof CONFIG_TABS)[number]['key']

interface ConfigPrevClientProps {
  orgSlug: string
  lines: PrevLine[]
  mixers: PrevMixer[]
  recipes: PrevRecipe[]
  products: PrevProduct[]
  clients: PrevClient[]
  holidays: PrevHoliday[]
}

export function ConfigPrevClient({ orgSlug, lines, mixers, recipes, products, clients, holidays }: ConfigPrevClientProps) {
  const [tab, setTab] = useState<ConfigTab>('lines')

  return (
    <div>
      <h2 className="text-xl font-medium text-ap-green-900 mb-6">Configuration</h2>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {CONFIG_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.key
                ? 'bg-ap-green-900 text-ap-green-100'
                : 'bg-ap-cream-100 text-ap-cream-800 hover:bg-ap-cream-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'lines' && <ConfigPrevLines orgSlug={orgSlug} lines={lines} />}
      {tab === 'mixers' && <ConfigMixers orgSlug={orgSlug} mixers={mixers} />}
      {tab === 'recipes' && <ConfigRecipes orgSlug={orgSlug} recipes={recipes} />}
      {tab === 'products' && <ConfigPrevProducts orgSlug={orgSlug} products={products} recipes={recipes} lines={lines} />}
      {tab === 'clients' && <ConfigClients orgSlug={orgSlug} clients={clients} />}
      {tab === 'holidays' && <ConfigHolidays orgSlug={orgSlug} holidays={holidays} />}
    </div>
  )
}
