'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calculator, History, Settings } from 'lucide-react'

const TABS = [
  { key: 'simulateur', label: 'Simulateur', href: '', icon: Calculator },
  { key: 'historique', label: 'Historique', href: '/historique', icon: History },
  { key: 'parametres', label: 'Paramètres', href: '/parametres', icon: Settings },
]

interface SimulTabsProps {
  orgSlug: string
}

export function SimulTabs({ orgSlug }: SimulTabsProps) {
  const pathname = usePathname()
  const basePath = `/${orgSlug}/simulateur-salaire`

  return (
    <div className="flex gap-1 border-b border-ap-cream-200 mb-6">
      {TABS.map((tab) => {
        const href = `${basePath}${tab.href}`
        const isActive =
          tab.href === ''
            ? pathname === basePath
            : pathname.startsWith(href)
        const Icon = tab.icon

        return (
          <Link
            key={tab.key}
            href={href}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              isActive
                ? 'border-ap-green-700 text-ap-green-900'
                : 'border-transparent text-ap-cream-700 hover:text-ap-green-800 hover:border-ap-cream-300'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
