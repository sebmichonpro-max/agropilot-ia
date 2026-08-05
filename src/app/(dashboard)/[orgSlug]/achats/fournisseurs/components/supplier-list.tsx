'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { deleteSupplier } from '../actions'
import type { Supplier, SupplierStatus } from '@/types/database'

const STATUS_LABELS: Record<SupplierStatus, string> = {
  active: 'Agréé',
  pending: 'En attente',
  suspended: 'Suspendu',
  inactive: 'Inactif',
}

const STATUS_COLORS: Record<SupplierStatus, string> = {
  active: 'bg-ap-green-100 text-ap-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-red-100 text-red-800',
  inactive: 'bg-ap-cream-200 text-ap-cream-600',
}

interface SupplierListProps {
  suppliers: Supplier[]
  orgSlug: string
}

export function SupplierList({ suppliers, orgSlug }: SupplierListProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ap-cream-500" />
          <Input
            placeholder="Rechercher un fournisseur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-ap-cream-300"
          />
        </div>
        <Link href={`/${orgSlug}/achats/fournisseurs/nouveau`}>
          <Button className="bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau fournisseur
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-ap-cream-200 rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Truck className="h-12 w-12 text-ap-cream-400 mb-4" />
            <p className="text-ap-cream-700">
              {search ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur pour le moment'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((supplier) => (
            <Link key={supplier.id} href={`/${orgSlug}/achats/fournisseurs/${supplier.id}`}>
              <Card className="border-ap-cream-200 rounded-xl hover:border-ap-green-300 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-ap-green-900 truncate flex-1">
                      {supplier.name}
                    </h3>
                    <Badge className={`${STATUS_COLORS[supplier.status]} border-0 ml-2`}>
                      {STATUS_LABELS[supplier.status]}
                    </Badge>
                  </div>
                  {supplier.contact_name && (
                    <p className="mt-1 text-sm text-ap-cream-700">{supplier.contact_name}</p>
                  )}
                  <div className="mt-2 text-xs text-ap-cream-600 space-y-0.5">
                    {supplier.email && <p>{supplier.email}</p>}
                    {supplier.city && <p>{supplier.city}, {supplier.country}</p>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
