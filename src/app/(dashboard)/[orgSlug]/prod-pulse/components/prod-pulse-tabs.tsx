'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, PenTool, History, Settings } from 'lucide-react'

interface TabItem {
  key: string
  label: string
  href: string
  icon: typeof Activity
}

const TABS: TabItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '', icon: Activity },
  { key: 'saisie', label: 'Saisie atelier', href: '/saisie', icon: PenTool },
  { key: 'historique', label: 'Historique', href: '/historique', icon: History },
  { key: 'configuration', label: 'Configuration', href: '/configuration', icon: Settings },
]

interface ProdPulseTabsProps {
  orgSlug: string
}

export function ProdPulseTabs({ orgSlug }: ProdPulseTabsProps) {
  const pathname = usePathname()
  const basePath = `/${orgSlug}/prod-pulse`

  return (
    <div className="flex gap-1 border-b border-ap-cream-200 mb-6 overflow-x-auto">
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
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
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
