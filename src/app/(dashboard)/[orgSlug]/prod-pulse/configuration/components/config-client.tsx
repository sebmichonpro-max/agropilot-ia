'use client'

import { useState } from 'react'
import type { ProductionLine, PpProduct, StopCause, TrsThreshold } from '@/types/database'
import { ConfigLines } from './config-lines'
import { ConfigProducts } from './config-products'
import { ConfigCauses } from './config-causes'
import { ConfigThresholds } from './config-thresholds'

const CONFIG_TABS = [
  { key: 'lines', label: 'Lignes' },
  { key: 'products', label: 'Produits' },
  { key: 'causes', label: "Causes d'arrêt" },
  { key: 'thresholds', label: 'Seuils' },
] as const

type ConfigTab = (typeof CONFIG_TABS)[number]['key']

interface ConfigClientProps {
  orgSlug: string
  lines: ProductionLine[]
  products: PpProduct[]
  causes: StopCause[]
  thresholds: TrsThreshold | null
}

export function ConfigClient({ orgSlug, lines, products, causes, thresholds }: ConfigClientProps) {
  const [tab, setTab] = useState<ConfigTab>('lines')

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ap-green-900 mb-6">Configuration</h1>

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

      {tab === 'lines' && <ConfigLines orgSlug={orgSlug} lines={lines} />}
      {tab === 'products' && <ConfigProducts orgSlug={orgSlug} products={products} lines={lines} />}
      {tab === 'causes' && <ConfigCauses orgSlug={orgSlug} causes={causes} />}
      {tab === 'thresholds' && <ConfigThresholds orgSlug={orgSlug} thresholds={thresholds} />}
    </div>
  )
}
