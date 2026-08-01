'use client'

import { useState, useRef, useCallback } from 'react'
import { Search, FileText, Clock, Play, Loader2, Trash2, Download, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { VeilleReport, VeilleSearch } from '@/types/database'
import { SCANNERS } from '@/modules/veille-qualite'
import { saveReport, saveSearch, deleteReport, deleteSearch } from '../actions'

interface VeilleClientProps {
  orgSlug: string
  reports: VeilleReport[]
  searches: VeilleSearch[]
}

type TabId = 'scanners' | 'recherche' | 'historique'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function latestReport(reports: VeilleReport[], scannerId: string) {
  return reports.find(r => r.scanner_id === scannerId)
}

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />
    if (line.match(/^#{1,3}\s/))
      return <h3 key={i} className="text-base font-bold text-ap-green-900 mt-4 mb-2">{line.replace(/^#+\s*/, '')}</h3>
    if (line.startsWith('- ') || line.startsWith('• '))
      return <p key={i} className="pl-3 text-sm text-ap-cream-800 my-0.5">{line}</p>
    if (line.includes('**'))
      return <p key={i} className="text-sm font-semibold text-ap-green-900 my-1">{line.replace(/\*\*/g, '')}</p>
    return <p key={i} className="text-sm text-ap-cream-700 my-0.5 leading-relaxed">{line}</p>
  })
}

function buildExportHTML(title: string, content: string) {
  const formatted = content.split('\n').map(line => {
    if (!line.trim()) return '<br>'
    if (line.match(/^#{1,3}\s/)) return `<h2 style="color:#1a5c3a;font-size:17px;margin:24px 0 8px;border-bottom:1px solid #e0e0e0;padding-bottom:4px">${line.replace(/^#+\s*/, '')}</h2>`
    if (line.startsWith('- ') || line.startsWith('• ')) return `<li style="margin:2px 0;font-size:14px">${line.replace(/^[-•]\s*/, '')}</li>`
    if (line.includes('**')) return `<p style="font-weight:600;font-size:14px;margin:4px 0">${line.replace(/\*\*/g, '')}</p>`
    return `<p style="margin:4px 0;font-size:14px;line-height:1.6">${line}</p>`
  }).join('\n')

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>AgroPilot.IA — ${title}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;max-width:860px;margin:0 auto;padding:40px 24px;color:#1a2a3a;line-height:1.7;background:#fff}
.header{border-bottom:3px solid #1a5c3a;padding-bottom:16px;margin-bottom:24px}.header h1{font-size:22px;color:#1a5c3a}.header .sub{font-size:13px;color:#888;margin-top:4px}
.meta{background:#f0f7f4;border-radius:8px;padding:12px 16px;margin-bottom:24px;font-size:13px;color:#555}
h2{color:#1a5c3a} .footer{margin-top:40px;padding-top:14px;border-top:2px solid #eee;font-size:11px;color:#bbb;text-align:center}
@media print{.no-print{display:none}}</style></head><body>
<div class="header"><h1>🔬 Veille Qualité — ${title}</h1><div class="sub">AgroPilot.IA · Rapport de veille</div></div>
<div class="meta">📅 ${new Date().toLocaleString('fr-FR')}</div>
${formatted}
<div class="footer">AgroPilot.IA · Veille Qualité propulsée par l'IA<br>Les informations sont à titre indicatif. Consultez un professionnel qualifié pour validation.</div>
<div class="no-print" style="text-align:center;margin-top:20px"><button onclick="window.print()" style="padding:10px 24px;background:#1a5c3a;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer">🖨️ Imprimer / PDF</button></div>
</body></html>`
}

function downloadHTML(filename: string, html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export function VeilleClient({ orgSlug, reports, searches }: VeilleClientProps) {
  const [tab, setTab] = useState<TabId>('scanners')
  const [runningScanner, setRunningScanner] = useState<string | null>(null)
  const [runningAll, setRunningAll] = useState(false)
  const [streamingText, setStreamingText] = useState<Record<string, string>>({})
  const [openScanners, setOpenScanners] = useState<Set<string>>(new Set())
  const [customQuery, setCustomQuery] = useState('')
  const [customStreaming, setCustomStreaming] = useState(false)
  const [customResult, setCustomResult] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const reportCount = SCANNERS.filter(s => latestReport(reports, s.id) || streamingText[s.id]).length

  const toggleScanner = useCallback((id: string) => {
    setOpenScanners(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  async function streamScan(scannerId: string, isCustom = false, query?: string): Promise<string> {
    const controller = new AbortController()
    abortRef.current = controller

    const body = isCustom
      ? { customQuery: query }
      : { scannerId }

    const res = await fetch('/api/ai/veille', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) throw new Error(`Erreur ${res.status}`)
    if (!res.body) throw new Error('Pas de stream')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const data = JSON.parse(line.slice(6))
          if (data.error) throw new Error(data.error)
          if (data.text) {
            fullText += data.text
            if (isCustom) {
              setCustomResult(fullText)
            } else {
              setStreamingText(prev => ({ ...prev, [scannerId]: fullText }))
            }
          }
        } catch (e) {
          if (e instanceof Error && e.message !== 'Unexpected end of JSON input') throw e
        }
      }
    }

    return fullText
  }

  async function runScanner(scannerId: string) {
    setRunningScanner(scannerId)
    setOpenScanners(prev => new Set(prev).add(scannerId))
    setStreamingText(prev => ({ ...prev, [scannerId]: '' }))

    try {
      const content = await streamScan(scannerId)
      if (content) {
        const result = await saveReport(orgSlug, scannerId, content)
        if ('error' in result) toast.error(result.error)
        else toast.success(`${SCANNERS.find(s => s.id === scannerId)?.name} — Rapport sauvegardé`)
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        toast.error(`Erreur : ${e.message}`)
      }
    } finally {
      setRunningScanner(null)
    }
  }

  async function runAll() {
    setRunningAll(true)
    for (const scanner of SCANNERS) {
      await runScanner(scanner.id)
    }
    setRunningAll(false)
    toast.success('Veille complète terminée')
  }

  async function runCustom() {
    const q = customQuery.trim()
    if (!q) return

    setCustomStreaming(true)
    setCustomResult('')

    try {
      const content = await streamScan('custom', true, q)
      if (content) {
        const result = await saveSearch(orgSlug, q, content)
        if ('error' in result) toast.error(result.error)
        else toast.success('Recherche sauvegardée')
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        toast.error(`Erreur : ${e.message}`)
      }
    } finally {
      setCustomStreaming(false)
    }
  }

  async function handleDeleteReport(id: string) {
    const result = await deleteReport(orgSlug, id)
    if ('error' in result) toast.error(result.error)
    else toast.success('Rapport supprimé')
  }

  async function handleDeleteSearch(id: string) {
    const result = await deleteSearch(orgSlug, id)
    if ('error' in result) toast.error(result.error)
    else toast.success('Recherche supprimée')
  }

  function exportReport(title: string, content: string) {
    const filename = `AgroPilot_Veille_${title.replace(/[^a-zA-Z0-9àâéèêëïôùûç]/g, '_')}_${new Date().toISOString().slice(0, 10)}.html`
    downloadHTML(filename, buildExportHTML(title, content))
  }

  function exportAll() {
    let allContent = ''
    for (const scanner of SCANNERS) {
      const report = latestReport(reports, scanner.id)
      if (report) {
        allContent += `\n\n## ${scanner.icon} ${scanner.name}\nDernier scan : ${formatDate(report.created_at)}\n\n${report.content}`
      }
    }
    if (!allContent) {
      toast.error('Aucun rapport à exporter. Lancez une veille d\'abord.')
      return
    }
    downloadHTML(
      `AgroPilot_Veille_Complete_${new Date().toISOString().slice(0, 10)}.html`,
      buildExportHTML('Rapport complet', allContent)
    )
  }

  const tabs: { id: TabId; icon: typeof Search; label: string }[] = [
    { id: 'scanners', icon: Search, label: 'Scanners' },
    { id: 'recherche', icon: FileText, label: 'Recherche libre' },
    { id: 'historique', icon: Clock, label: 'Historique' },
  ]

  return (
    <div>
      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          onClick={runAll}
          disabled={runningAll || !!runningScanner}
          className="gap-2"
        >
          {runningAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          Veille complète
        </Button>
        <Button variant="outline" onClick={exportAll} className="gap-2">
          <Download className="h-4 w-4" /> Export HTML
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl border border-ap-cream-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-ap-green-900">{SCANNERS.length}</div>
          <div className="text-xs text-ap-cream-600 uppercase tracking-wide">Scanners</div>
        </div>
        <div className="rounded-xl border border-ap-cream-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-ap-green-900">{reportCount}/{SCANNERS.length}</div>
          <div className="text-xs text-ap-cream-600 uppercase tracking-wide">Rapports</div>
        </div>
        <div className="rounded-xl border border-ap-cream-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-ap-green-900">{reports.length}</div>
          <div className="text-xs text-ap-cream-600 uppercase tracking-wide">Total scans</div>
        </div>
        <div className="rounded-xl border border-ap-cream-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-ap-green-900">{searches.length}</div>
          <div className="text-xs text-ap-cream-600 uppercase tracking-wide">Recherches</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-ap-cream-100 rounded-lg p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white text-ap-green-900 shadow-sm'
                : 'text-ap-cream-600 hover:text-ap-green-800'
            }`}
          >
            <t.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Scanners tab */}
      {tab === 'scanners' && (
        <div className="space-y-3">
          {SCANNERS.map(scanner => {
            const report = latestReport(reports, scanner.id)
            const streaming = streamingText[scanner.id]
            const isRunning = runningScanner === scanner.id
            const isOpen = openScanners.has(scanner.id)
            const content = streaming || report?.content

            return (
              <div
                key={scanner.id}
                className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden"
                style={{ borderLeftColor: scanner.color, borderLeftWidth: 3 }}
              >
                {/* Header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-ap-cream-50 transition-colors"
                  onClick={() => toggleScanner(scanner.id)}
                >
                  <span className="text-2xl flex-shrink-0">{scanner.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ap-green-900 text-sm">{scanner.name}</div>
                    <div className="text-xs text-ap-cream-600">{scanner.description}</div>
                    {report && (
                      <div className="text-xs text-ap-cream-500 mt-1">
                        Dernier scan : {formatDate(report.created_at)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {content && (
                      <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      disabled={isRunning || runningAll}
                      onClick={(e) => { e.stopPropagation(); runScanner(scanner.id) }}
                    >
                      {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    </Button>
                    {content && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={(e) => { e.stopPropagation(); exportReport(scanner.name, content) }}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <span className={`text-ap-cream-400 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Content */}
                {isOpen && content && (
                  <div className="border-t border-ap-cream-200 bg-ap-cream-50 p-4 max-h-[500px] overflow-y-auto">
                    {isRunning && (
                      <div className="flex items-center gap-2 text-sm text-ap-cream-600 mb-3">
                        <Loader2 className="h-4 w-4 animate-spin" /> Scan en cours...
                      </div>
                    )}
                    {renderMarkdown(content)}
                  </div>
                )}

                {isOpen && !content && !isRunning && (
                  <div className="border-t border-ap-cream-200 p-6 text-center text-sm text-ap-cream-500">
                    Aucun rapport. Cliquez sur ▶ pour lancer le scan.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Recherche libre tab */}
      {tab === 'recherche' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-ap-cream-200 bg-white p-5">
            <h3 className="font-semibold text-ap-green-900 mb-1">Recherche libre</h3>
            <p className="text-xs text-ap-cream-600 mb-3">
              Posez n&apos;importe quelle question sur la qualité, la réglementation ou la sécurité alimentaire.
            </p>
            <textarea
              className="w-full rounded-lg border border-ap-cream-300 bg-white px-3 py-2.5 text-sm text-ap-green-900 placeholder:text-ap-cream-400 focus:outline-none focus:ring-2 focus:ring-ap-green-500 resize-y min-h-[80px]"
              placeholder="Ex : Quelles sont les nouvelles obligations HACCP pour la boulangerie artisanale en 2026 ?"
              value={customQuery}
              onChange={e => setCustomQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runCustom() } }}
            />
            <Button
              onClick={runCustom}
              disabled={customStreaming || !customQuery.trim()}
              className="w-full mt-2 gap-2"
            >
              {customStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Rechercher
            </Button>
          </div>

          {/* Streaming result */}
          {customResult && (
            <div className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-ap-cream-200">
                <span className="font-semibold text-sm text-ap-green-900">Résultat</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs"
                  onClick={() => exportReport(`Recherche_${customQuery.slice(0, 30)}`, customResult)}
                >
                  <Download className="h-3 w-3" /> HTML
                </Button>
              </div>
              <div className="p-4 max-h-[500px] overflow-y-auto">
                {customStreaming && (
                  <div className="flex items-center gap-2 text-sm text-ap-cream-600 mb-3">
                    <Loader2 className="h-4 w-4 animate-spin" /> Recherche en cours...
                  </div>
                )}
                {renderMarkdown(customResult)}
              </div>
            </div>
          )}

          {/* Recent searches */}
          {searches.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-ap-cream-600 mb-2">Recherches récentes</h3>
              <div className="space-y-2">
                {searches.slice(0, 10).map(s => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-ap-cream-200 bg-white p-3 cursor-pointer hover:bg-ap-cream-50 transition-colors group"
                    onClick={() => { setCustomQuery(s.query); setCustomResult(s.content) }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ap-green-900 truncate">{s.query}</div>
                        <div className="text-xs text-ap-cream-500">{formatDate(s.created_at)}</div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); exportReport(`Recherche_${s.query.slice(0, 30)}`, s.content) }}
                          className="p-1 rounded hover:bg-ap-cream-200 text-ap-cream-600"
                          aria-label="Exporter"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSearch(s.id) }}
                          className="p-1 rounded hover:bg-red-50 text-red-500"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historique tab */}
      {tab === 'historique' && (
        <div className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ap-cream-200">
            <h3 className="font-semibold text-sm text-ap-green-900">Historique des rapports</h3>
            <Button size="sm" variant="outline" onClick={exportAll} className="h-7 gap-1 text-xs">
              <Download className="h-3 w-3" /> Export complet
            </Button>
          </div>
          <div className="divide-y divide-ap-cream-200">
            {SCANNERS.map(scanner => {
              const scannerReports = reports.filter(r => r.scanner_id === scanner.id)
              return (
                <div key={scanner.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{scanner.icon}</span>
                      <span className="text-sm font-medium text-ap-green-900">{scanner.name}</span>
                      <span className="text-xs text-ap-cream-500">({scannerReports.length} rapport{scannerReports.length > 1 ? 's' : ''})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ap-cream-500">
                        {scannerReports[0] ? formatDate(scannerReports[0].created_at) : 'Jamais'}
                      </span>
                      {scannerReports[0] && (
                        <>
                          <button
                            onClick={() => exportReport(scanner.name, scannerReports[0].content)}
                            className="p-1 rounded hover:bg-ap-cream-200 text-ap-cream-600"
                            aria-label="Exporter"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteReport(scannerReports[0].id)}
                            className="p-1 rounded hover:bg-red-50 text-red-500"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {reports.length === 0 && searches.length === 0 && (
              <div className="p-8 text-center text-sm text-ap-cream-500">
                Aucun rapport. Lancez une veille complète pour commencer.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
