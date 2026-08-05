'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileSpreadsheet, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface CsvDropZoneProps {
  hint: string
  encodingHint?: string
  isPending: boolean
  onImport: (text: string) => void
  onClose: () => void
  useCp1252?: boolean
}

async function readFileWithEncoding(file: File, useCp1252: boolean): Promise<string> {
  if (!useCp1252) return file.text()
  const buffer = await file.arrayBuffer()
  try {
    const decoder = new TextDecoder('windows-1252')
    return decoder.decode(buffer)
  } catch {
    return new TextDecoder('utf-8').decode(buffer)
  }
}

export function CsvDropZone({ hint, encodingHint, isPending, onImport, onClose, useCp1252 = false }: CsvDropZoneProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.txt'))) {
      setFile(f)
    } else {
      toast.error('Format non supporté. Utilisez un fichier .csv ou .txt')
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }, [])

  async function handleUpload() {
    if (!file) return
    const text = await readFileWithEncoding(file, useCp1252)
    onImport(text)
  }

  return (
    <div className="rounded-xl border border-ap-cream-200 bg-white p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-ap-green-900">Importer depuis un CSV</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-ap-cream-200 text-ap-cream-500">
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-xs text-ap-cream-600 mb-3">{hint}</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer mb-3 ${
          isDragOver
            ? 'border-ap-green-900 bg-ap-green-900/5'
            : file
              ? 'border-green-400 bg-green-50'
              : 'border-ap-cream-300 hover:border-ap-cream-400 bg-ap-cream-50/50'
        }`}
      >
        <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileSelect} className="hidden" />
        {file ? (
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-sm font-medium text-ap-green-900">{file.name}</p>
              <p className="text-xs text-ap-cream-500">{(file.size / 1024).toFixed(1)} Ko</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setFile(null) }} className="ml-2 p-1 rounded-full hover:bg-ap-cream-200">
              <X className="h-4 w-4 text-ap-cream-500" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-ap-cream-400 mb-2" />
            <p className="text-sm font-medium text-ap-cream-700">Glissez votre fichier ici</p>
            <p className="text-xs text-ap-cream-500 mt-1">
              .csv ou .txt{encodingHint ? ` — ${encodingHint}` : ''}
            </p>
          </>
        )}
      </div>

      <Button onClick={handleUpload} disabled={isPending || !file} className="gap-2">
        <Upload className="h-4 w-4" />
        {isPending ? 'Import en cours...' : 'Importer'}
      </Button>
    </div>
  )
}
