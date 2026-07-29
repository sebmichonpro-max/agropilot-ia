'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Clock, CalendarOff, FileSpreadsheet, Settings } from 'lucide-react'

interface TabItem {
  key: string
  label: string
  href: string
  icon: typeof Clock
  adminOnly?: boolean
}

const TABS: TabItem[] = [
  { key: 'pointage', label: 'Pointage', href: '', icon: Clock },
  { key: 'conges', label: 'Congés & Absences', href: '/conges', icon: CalendarOff },
  { key: 'recap', label: 'Récapitulatif', href: '/recap', icon: FileSpreadsheet },
  { key: 'parametres', label: 'Paramètres', href: '/parametres', icon: Settings, adminOnly: true },
]

interface PointageTabsProps {
  orgSlug: string
  isAdmin: boolean
}

export function PointageTabs({ orgSlug, isAdmin }: PointageTabsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isKiosk = searchParams.get('mode') === 'kiosk'

  if (isKiosk) return null

  const basePath = `/${orgSlug}/pointage`

  return (
    <div className="flex gap-1 border-b border-ap-cream-200 mb-6">
      {TABS.map((tab) => {
        if (tab.adminOnly && !isAdmin) return null
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
