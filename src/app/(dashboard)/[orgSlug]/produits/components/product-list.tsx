'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { deleteProduct } from '../actions'
import type { Product } from '@/types/database'

interface ProductListProps {
  products: Product[]
  orgSlug: string
}

export function ProductList({ products, orgSlug }: ProductListProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    const result = await deleteProduct(orgSlug, id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Produit supprimé')
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ap-cream-500" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-ap-cream-300"
          />
        </div>
        <Link href={`/${orgSlug}/produits/nouveau`}>
          <Button className="bg-ap-green-900 text-ap-green-100 hover:bg-ap-green-800">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau produit
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-ap-cream-200 rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-ap-cream-400 mb-4" />
            <p className="text-ap-cream-700">
              {search ? 'Aucun produit trouvé' : 'Aucun produit pour le moment'}
            </p>
            {!search && (
              <Link href={`/${orgSlug}/produits/nouveau`}>
                <Button variant="outline" className="mt-4 border-ap-green-200 text-ap-green-700">
                  Créer votre premier produit
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <Link key={product.id} href={`/${orgSlug}/produits/${product.id}`}>
              <Card className="border-ap-cream-200 rounded-xl hover:border-ap-green-300 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-ap-green-900 truncate">
                        {product.name}
                      </h3>
                      {product.reference && (
                        <p className="text-sm text-ap-cream-600 mt-0.5">
                          Réf: {product.reference}
                        </p>
                      )}
                    </div>
                    <Badge
                      className={
                        product.is_active
                          ? 'bg-ap-green-100 text-ap-green-800 border-0'
                          : 'bg-ap-cream-200 text-ap-cream-600 border-0'
                      }
                    >
                      {product.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  {product.description && (
                    <p className="mt-2 text-sm text-ap-cream-700 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs text-ap-cream-600">
                    {product.weight_grams && (
                      <span>{product.weight_grams}g</span>
                    )}
                    {product.shelf_life_days && (
                      <span>{product.shelf_life_days}j DLC</span>
                    )}
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
