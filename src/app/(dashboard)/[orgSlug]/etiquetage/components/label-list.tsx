'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProductLabel } from '@/types/database'

interface LabelListProps {
  labels: ProductLabel[]
  orgSlug: string
}

export function LabelList({ labels, orgSlug }: LabelListProps) {
  const [search, setSearch] = useState('')

  const filtered = labels.filter((l) =>
    l.label_name.toLowerCase().includes(search.toLowerCase()) ||
    l.denomination.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ap-cream-500" />
          <Input
            placeholder="Rechercher une étiquette..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-ap-cream-300"
          />
        </div>
        <Link href={`/${orgSlug}/etiquetage/nouveau`}>
          <Button className="bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle étiquette
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-ap-cream-200 rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Tag className="h-12 w-12 text-ap-cream-400 mb-4" />
            <p className="text-ap-cream-700">
              {search ? 'Aucune étiquette trouvée' : 'Aucune étiquette pour le moment'}
            </p>
            {!search && (
              <p className="mt-2 text-sm text-ap-cream-600 max-w-md">
                Générez des étiquettes conformes INCO à partir de vos fiches produits.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((label) => (
            <Link key={label.id} href={`/${orgSlug}/etiquetage/${label.id}`}>
              <Card className="border-ap-cream-200 rounded-xl hover:border-ap-green-300 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-ap-green-900 truncate flex-1">
                      {label.label_name}
                    </h3>
                    {label.is_compliant !== null && (
                      <Badge className={label.is_compliant ? 'bg-ap-green-100 text-ap-green-800 border-0' : 'bg-red-100 text-red-800 border-0'}>
                        {label.is_compliant ? 'Conforme' : 'Non conforme'}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ap-cream-700 truncate">{label.denomination}</p>
                  <p className="mt-2 text-xs text-ap-cream-600">{label.net_quantity}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
