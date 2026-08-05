'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { HaccpPlan } from '@/types/database'

interface HaccpPlanListProps {
  plans: HaccpPlan[]
  orgSlug: string
}

export function HaccpPlanList({ plans, orgSlug }: HaccpPlanListProps) {
  const [search, setSearch] = useState('')

  const filtered = plans.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ap-cream-500" />
          <Input
            placeholder="Rechercher un plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-ap-cream-300"
          />
        </div>
        <Link href={`/${orgSlug}/haccp/nouveau`}>
          <Button className="bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau plan HACCP
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-ap-cream-200 rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="h-12 w-12 text-ap-cream-400 mb-4" />
            <p className="text-ap-cream-700">
              {search ? 'Aucun plan trouvé' : 'Aucun plan HACCP pour le moment'}
            </p>
            {!search && (
              <p className="mt-2 text-sm text-ap-cream-600 max-w-md">
                Créez votre premier plan HACCP pour documenter vos points critiques de maîtrise.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((plan) => (
            <Link key={plan.id} href={`/${orgSlug}/haccp/${plan.id}`}>
              <Card className="border-ap-cream-200 rounded-xl hover:border-ap-green-300 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-ap-green-900">{plan.name}</h3>
                    <Badge className={plan.is_active ? 'bg-ap-green-100 text-ap-green-800 border-0' : 'bg-ap-cream-200 text-ap-cream-600 border-0'}>
                      {plan.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  {plan.process_description && (
                    <p className="mt-2 text-sm text-ap-cream-700 line-clamp-2">
                      {plan.process_description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-ap-cream-600">
                    Créé le {new Date(plan.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
