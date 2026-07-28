'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const LABEL_MAP: Record<string, string> = {
  dashboard: 'Tableau de bord',
  settings: 'Paramètres',
  produits: 'Produits',
  tracabilite: 'Traçabilité',
  haccp: 'HACCP',
  etiquetage: 'Étiquetage',
  production: 'Production',
  achats: 'Achats',
  stocks: 'Stocks',
  fournisseurs: 'Fournisseurs',
  'non-conformites': 'Non-conformités',
  audits: 'Audits',
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  const crumbs = segments.slice(1).map((segment, i) => {
    const href = '/' + segments.slice(0, i + 2).join('/')
    const label = LABEL_MAP[segment] ?? segment.replace(/-/g, ' ')
    const isLast = i === segments.length - 2

    return { href, label, isLast }
  })

  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 text-sm text-muted-foreground">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
