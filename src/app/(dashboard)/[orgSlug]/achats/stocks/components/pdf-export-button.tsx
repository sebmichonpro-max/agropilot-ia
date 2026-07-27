'use client'

import { useState } from 'react'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PdfExportButtonProps {
  orgSlug: string
}

export function PdfExportButton({ orgSlug }: PdfExportButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(`/${orgSlug}/achats/stocks/rapport`)
      if (!res.ok) {
        toast.error("Erreur lors de la génération du rapport")
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rapport-km-${new Date().toISOString().split('T')[0]}.pdf`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Rapport téléchargé')
    } catch {
      toast.error("Erreur lors du téléchargement")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={loading}
    >
      <FileDown className="mr-2 h-4 w-4" />
      {loading ? 'Génération...' : 'Exporter PDF'}
    </Button>
  )
}
