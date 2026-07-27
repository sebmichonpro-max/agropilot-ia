import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModuleLayout } from '@/components/shared/module-layout'
import { PalletTable } from '../components/pallet-table'
import { getKmDashboardData } from '../actions'

export default async function PalettesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const data = await getKmDashboardData(orgSlug)

  if (!data) return null

  const tableData = data.palletsWithMovements
    .map((pw) => ({
      pallet: pw.pallet,
      reference: pw.reference,
      zone: pw.zone,
      result: data.batchResult.results.get(pw.pallet.id)!,
    }))
    .filter((x) => x.result)

  return (
    <ModuleLayout
      title="Toutes les palettes"
      breadcrumbs={[
        { label: 'Stocks', href: `/${orgSlug}/achats/stocks` },
        { label: 'Palettes' },
      ]}
    >
      <Link href={`/${orgSlug}/achats/stocks/palettes/nouveau`}>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> Entrée palette
        </Button>
      </Link>

      <PalletTable orgSlug={orgSlug} pallets={tableData} />
    </ModuleLayout>
  )
}
