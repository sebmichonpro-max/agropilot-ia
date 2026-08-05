'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { PrevClient } from '@/types/database'
import { PRIORITY_LABELS } from '@/modules/prev-prod'
import { createClient, updateClient, deleteClient, importClientsCsv } from '../../actions'
import { CsvDropZone } from './csv-drop-zone'

interface ConfigClientsProps {
  orgSlug: string
  clients: PrevClient[]
}

export function ConfigClients({ orgSlug, clients }: ConfigClientsProps) {
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [clientType, setClientType] = useState<string>('custom_order')
  const [brand, setBrand] = useState('')
  const [priority, setPriority] = useState<string>('journee')

  function openCreate() {
    setEditId(null)
    setCode('')
    setName('')
    setClientType('custom_order')
    setBrand('')
    setPriority('journee')
    setShowForm(true)
  }

  function openEdit(c: PrevClient) {
    setEditId(c.id)
    setCode(c.code)
    setName(c.name)
    setClientType(c.client_type)
    setBrand(c.brand ?? '')
    setPriority(c.dispatch_priority)
    setShowForm(true)
  }

  function handleSubmit() {
    if (!code.trim() || !name.trim()) return

    const input = {
      code: code.trim(),
      name: name.trim(),
      client_type: clientType as 'stock_brand' | 'custom_order',
      brand: brand.trim() || null,
      dispatch_priority: priority as 'matin' | 'journee' | 'avance',
    }

    startTransition(async () => {
      const result = editId
        ? await updateClient(orgSlug, editId, input)
        : await createClient(orgSlug, input)
      if ('error' in result) toast.error(result.error)
      else {
        toast.success(editId ? 'Client mis à jour' : 'Client créé')
        setShowForm(false)
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteClient(orgSlug, id)
      if ('error' in result) toast.error(result.error)
      else toast.success('Client supprimé')
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ap-cream-700">{clients.length} client(s)</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setShowImport(true); setShowForm(false) }} className="gap-2">
            <FileUp className="h-4 w-4" /> Importer CSV
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>
      </div>

      {showImport && (
        <CsvDropZone
          hint="Export Divalto « Tri par Tiers » (COMMANDES.csv). Extrait les clients uniques (code 7-8 chiffres + nom). Les clients existants sont ignorés."
          encodingHint="Encodage CP1252 auto-détecté"
          useCp1252
          isPending={isPending}
          onClose={() => setShowImport(false)}
          onImport={(text) => {
            startTransition(async () => {
              const result = await importClientsCsv(orgSlug, text)
              if ('error' in result) toast.error(result.error)
              else {
                toast.success(`${result.created} client(s) créé(s), ${result.skipped} ignoré(s)`)
                setShowImport(false)
              }
            })
          }}
        />
      )}

      {showForm && (
        <div className="rounded-xl border border-ap-cream-200 bg-white p-5 mb-4">
          <h3 className="text-lg font-medium text-ap-green-900 mb-4">
            {editId ? 'Modifier le client' : 'Nouveau client'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="cliCode">Code</Label>
              <Input id="cliCode" value={code} onChange={(e) => setCode(e.target.value)} className="mt-1" placeholder="NEWREST" />
            </div>
            <div>
              <Label htmlFor="cliName">Nom</Label>
              <Input id="cliName" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="Newrest" />
            </div>
            <div>
              <Label htmlFor="cliType">Type</Label>
              <select id="cliType" value={clientType} onChange={(e) => setClientType(e.target.value)} className="mt-1 w-full rounded-md border border-ap-cream-300 px-3 py-2 text-sm">
                <option value="custom_order">Sur commande</option>
                <option value="stock_brand">Marque (stock permanent)</option>
              </select>
            </div>
            {clientType === 'stock_brand' && (
              <div>
                <Label htmlFor="cliBrand">Marque</Label>
                <Input id="cliBrand" value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1" placeholder="Soleane" />
              </div>
            )}
            <div>
              <Label htmlFor="cliPriority">Priorité départ</Label>
              <select id="cliPriority" value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 w-full rounded-md border border-ap-cream-300 px-3 py-2 text-sm">
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isPending}>{editId ? 'Modifier' : 'Créer'}</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-ap-cream-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ap-cream-300">
              <th className="text-left px-4 py-3 text-ap-cream-700 font-normal">Code</th>
              <th className="text-left px-4 py-3 text-ap-cream-700 font-normal">Nom</th>
              <th className="text-left px-4 py-3 text-ap-cream-700 font-normal hidden md:table-cell">Type</th>
              <th className="text-left px-4 py-3 text-ap-cream-700 font-normal hidden md:table-cell">Priorité</th>
              <th className="text-right px-4 py-3 text-ap-cream-700 font-normal w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-ap-cream-200 hover:bg-ap-cream-100">
                <td className="px-4 py-3 text-ap-cream-600 font-mono text-xs">{c.code}</td>
                <td className="px-4 py-3 text-ap-green-900 font-medium">{c.name}{c.brand ? ` (${c.brand})` : ''}</td>
                <td className="px-4 py-3 text-ap-cream-700 hidden md:table-cell">
                  {c.client_type === 'stock_brand' ? 'Marque' : 'Sur commande'}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.dispatch_priority === 'matin' ? 'bg-red-100 text-red-700' : 'bg-ap-cream-200 text-ap-cream-700'}`}>
                    {PRIORITY_LABELS[c.dispatch_priority]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-ap-cream-200 text-ap-cream-700" aria-label="Modifier"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ap-cream-600">Aucun client configuré.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
