import { notFound } from 'next/navigation'
import { ModuleLayout } from '@/components/shared/module-layout'
import { LotForm } from '../components/lot-form'
import { getLot } from '../actions'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const lot = await getLot(id)
  return { title: `Lot ${lot?.lot_number ?? ''} — AgroPilot.IA` }
}

export default async function LotDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}) {
  const { orgSlug, id } = await params
  const lot = await getLot(id)

  if (!lot) notFound()

  return (
    <ModuleLayout
      title={`Lot ${lot.lot_number}`}
      breadcrumbs={[
        { label: 'Traçabilité', href: `/${orgSlug}/tracabilite` },
        { label: lot.lot_number },
      ]}
    >
      <LotForm orgSlug={orgSlug} lot={lot} />
    </ModuleLayout>
  )
}
