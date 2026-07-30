'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, FileText, Database, Upload, Settings } from 'lucide-react'

interface MargeTabsProps {
  orgSlug: string
}

const tabs = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3, href: '' },
  { key: 'produits', label: 'Fiches produit', icon: FileText, href: '/produits' },
  { key: 'referentiels', label: 'Référentiels', icon: Database, href: '/referentiels' },
  { key: 'import', label: 'Import', icon: Upload, href: '/import' },
  { key: 'configuration', label: 'Configuration', icon: Settings, href: '/configuration' },
]

export function MargeTabs({ orgSlug }: MargeTabsProps) {
  const pathname = usePathname()
  const base = `/${orgSlug}/marge-flash`

  function isActive(href: string) {
    if (href === '') return pathname === base || pathname === base + '/'
    return pathname.startsWith(base + href)
  }

  return (
    <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const active = isActive(tab.href)
        const Icon = tab.icon
        return (
          <Link
            key={tab.key}
            href={base + tab.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              active
                ? 'bg-ap-green-900 text-ap-green-100'
                : 'text-ap-cream-700 hover:bg-ap-cream-100'
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
