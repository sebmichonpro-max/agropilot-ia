import { ModuleLayout } from '@/components/shared/module-layout'
import { LotList } from './components/lot-list'
import { getLots } from './actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Traçabilité — AgroPilot.IA',
}

export default async function TracabilitePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const lots = await getLots()

  return (
    <ModuleLayout
      title="Traçabilité"
      description="Suivi des lots, réceptions et expéditions"
    >
      <LotList lots={lots} orgSlug={orgSlug} />
    </ModuleLayout>
  )
}
