'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { CotisationLine } from '@/types/database'

interface ResultBreakdownProps {
  lines: CotisationLine[]
  totalSalarial: number
  totalPatronal: number
  rgdu: number
}

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatRate(r: number): string {
  if (r === 0) return '—'
  return (r * 100).toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + '%'
}

export function ResultBreakdown({ lines, totalSalarial, totalPatronal, rgdu }: ResultBreakdownProps) {
  const categories = Array.from(new Set(lines.map((l) => l.category)))
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(categories))

  function toggleCat(cat: string) {
    setOpenCats((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  return (
    <div className="rounded-lg border border-ap-cream-200 bg-white overflow-hidden">
      <h3 className="text-sm font-medium text-ap-green-900 px-4 py-3 border-b border-ap-cream-200">
        Détail des cotisations
      </h3>

      {/* Header */}
      <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px_80px_80px] gap-1 px-4 py-2 text-xs text-ap-cream-700 border-b border-ap-cream-300 bg-ap-cream-100">
        <span>Libellé</span>
        <span className="text-right">Base</span>
        <span className="text-right">Taux sal.</span>
        <span className="text-right">Mt sal.</span>
        <span className="text-right">Taux pat.</span>
        <span className="text-right">Mt pat.</span>
      </div>

      {/* Body */}
      <div className="divide-y divide-ap-cream-200">
        {categories.map((cat) => {
          const catLines = lines.filter((l) => l.category === cat)
          const isOpen = openCats.has(cat)
          return (
            <div key={cat}>
              <button
                type="button"
                onClick={() => toggleCat(cat)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-ap-green-900 hover:bg-ap-cream-100 transition-colors"
              >
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                {cat}
              </button>
              {isOpen && (
                <div className="divide-y divide-ap-cream-100">
                  {catLines.map((line) => (
                    <div
                      key={line.label}
                      className="grid grid-cols-2 sm:grid-cols-[1fr_80px_80px_80px_80px_80px] gap-1 px-4 py-2 text-sm hover:bg-ap-cream-50"
                    >
                      <span className="text-ap-cream-800 col-span-2 sm:col-span-1 pl-6">{line.label}</span>
                      <span className="text-right text-ap-cream-700 hidden sm:block">
                        {line.base > 0 ? formatCurrency(line.base) : '—'}
                      </span>
                      <span className="text-right text-ap-cream-700 hidden sm:block">{formatRate(line.rateSal)}</span>
                      <span className={`text-right font-medium ${line.montantSal < 0 ? 'text-ap-green-700' : 'text-ap-cream-800'}`}>
                        {line.montantSal !== 0 ? formatCurrency(line.montantSal) : '—'}
                      </span>
                      <span className="text-right text-ap-cream-700 hidden sm:block">{formatRate(line.ratePat)}</span>
                      <span className={`text-right font-medium ${line.montantPat < 0 ? 'text-ap-green-700' : 'text-ap-cream-800'}`}>
                        {line.montantPat !== 0 ? formatCurrency(line.montantPat) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Total */}
      <div className="grid grid-cols-2 sm:grid-cols-[1fr_80px_80px_80px_80px_80px] gap-1 px-4 py-3 text-sm font-medium text-ap-green-900 border-t-2 border-ap-cream-300 bg-ap-cream-100">
        <span className="col-span-2 sm:col-span-1">TOTAL</span>
        <span className="hidden sm:block" />
        <span className="hidden sm:block" />
        <span className="text-right">{formatCurrency(totalSalarial)}</span>
        <span className="hidden sm:block" />
        <span className="text-right">{formatCurrency(totalPatronal - rgdu)}</span>
      </div>
    </div>
  )
}
