'use client'

import Link from 'next/link'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  orgSlug: string
  userName: string | null
}

export function Header({ orgSlug, userName }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="text-sm text-muted-foreground">
        {userName && <span>Bonjour, {userName}</span>}
      </div>
      <div className="flex items-center gap-2">
        <Link href={`/${orgSlug}/settings`}>
          <Button variant="ghost" size="icon" aria-label="Paramètres">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </header>
  )
}
