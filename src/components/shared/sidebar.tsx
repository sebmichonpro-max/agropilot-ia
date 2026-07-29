'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, Lock, LogOut, Menu, Settings, X } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { getDepartmentAccess } from '@/lib/permissions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import type { Organization, Profile, PlanType } from '@/types/database'

interface SidebarProps {
  org: Organization
  profile: Profile
}

function SidebarContent({ org, profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({
    direction: true,
  })

  const departments = getDepartmentAccess(org.plan as PlanType)

  function toggleDept(key: string) {
    setOpenDepts((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleLogout() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-full flex-col bg-ap-green-900">
      <div className="p-4">
        <h2 className="text-lg font-medium text-ap-green-100 truncate">
          {org.name}
        </h2>
        <Badge className="mt-1 text-xs capitalize bg-white/10 text-ap-green-300 border-0">
          {org.plan}
        </Badge>
      </div>

      <div className="border-t border-white/12" />

      <nav className="flex-1 overflow-y-auto p-2">
        {departments.map(({ department, modules }) => {
          const Icon = department.icon
          const isOpen = openDepts[department.key] ?? false

          return (
            <div key={department.key} className="mb-1">
              <button
                onClick={() => toggleDept(department.key)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ap-green-300 hover:bg-white/5 transition-colors"
              >
                <Icon className="h-[18px] w-[18px] text-ap-green-400" />
                <span className="flex-1 text-left">{department.label}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-ap-green-400 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="ml-4 border-l border-white/12 pl-2">
                  {modules.map((mod) => {
                    const href = `/${org.slug}/${mod.href}`
                    const isActive = pathname === href

                    if (mod.locked) {
                      return (
                        <span
                          key={mod.key}
                          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-ap-green-400/50 cursor-not-allowed"
                        >
                          <span className="flex-1">{mod.label}</span>
                          <Lock className="h-3 w-3" />
                        </span>
                      )
                    }

                    return (
                      <Link
                        key={mod.key}
                        href={href}
                        className={`flex items-center rounded-lg px-3 py-1.5 text-sm transition-colors ${
                          isActive
                            ? 'bg-white/10 text-ap-green-100 font-medium'
                            : 'text-ap-green-300 hover:bg-white/5 hover:text-ap-green-100'
                        }`}
                      >
                        {mod.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-white/12" />

      <div className="p-3">
        <p className="mb-2 truncate px-3 text-xs text-ap-green-400">
          {profile.full_name}
        </p>
        <Link
          href={`/${org.slug}/settings`}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ap-green-300 hover:bg-white/5 hover:text-ap-green-100 transition-colors"
        >
          <Settings className="h-4 w-4" />
          Paramètres
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ap-green-300 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </div>
  )
}

export function Sidebar(props: SidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile trigger */}
      <div className="fixed top-3 left-3 z-50 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 bg-ap-green-900 text-ap-green-100 border-ap-green-700 hover:bg-ap-green-800">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 border-0">
            <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
            <SidebarContent {...props} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col">
        <SidebarContent {...props} />
      </aside>
    </>
  )
}
