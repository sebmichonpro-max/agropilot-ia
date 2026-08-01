'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { key: 'plan', label: 'Plan du jour', href: '' },
  { key: 'import', label: 'Import', href: '/import' },
  { key: 'configuration', label: 'Configuration', href: '/configuration' },
] as const

interface PrevProdTabsProps {
  orgSlug: string
}

export function PrevProdTabs({ orgSlug }: PrevProdTabsProps) {
  const pathname = usePathname()
  const basePath = `/${orgSlug}/prev-prod`

  return (
    <div className="flex gap-2 mb-6 overflow-x-auto">
      {TABS.map((tab) => {
        const href = `${basePath}${tab.href}`
        const isActive =
          tab.href === ''
            ? pathname === basePath || pathname === `${basePath}/plan`
            : pathname.startsWith(href)

        return (
          <Link
            key={tab.key}
            href={href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-ap-green-900 text-ap-green-100'
                : 'bg-ap-cream-100 text-ap-cream-800 hover:bg-ap-cream-200'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
