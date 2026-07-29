'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { RhPosition, RhAgency, RhSettings } from '@/types/database'
import { PointageTabs } from '../components/pointage-tabs'
import {
  createPosition,
  deletePosition,
  seedDefaultPositions,
  createAgency,
  deleteAgency,
  updateSettings,
  updateAdminPin,
} from '../actions'

interface ParametresClientProps {
  positions: RhPosition[]
  agencies: RhAgency[]
  settings: RhSettings
  orgSlug: string
  isAdmin: boolean
}

export function ParametresClient({
  positions,
  agencies,
  settings,
  orgSlug,
  isAdmin,
}: ParametresClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Position form
  const [newPosition, setNewPosition] = useState('')

  // Agency form
  const [agencyName, setAgencyName] = useState('')
  const [agencyContact, setAgencyContact] = useState('')
  const [agencyEmail, setAgencyEmail] = useState('')
  const [agencyPhone, setAgencyPhone] = useState('')

  // Settings form
  const [dailyHours, setDailyHours] = useState(Math.round(settings.daily_hours_threshold / 60))
  const [weeklyHours, setWeeklyHours] = useState(Math.round(settings.weekly_hours_threshold / 60))
  const [absenceNotif, setAbsenceNotif] = useState(settings.absence_notification_hours)

  // PIN
  const [pin, setPin] = useState('')

  function handleAddPosition() {
    if (!newPosition.trim()) return
    const formData = new FormData()
    formData.set('name', newPosition.trim())
    formData.set('sort_order', String(positions.length + 1))
    startTransition(async () => {
      const res = await createPosition(formData)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Poste ajouté')
        setNewPosition('')
        router.refresh()
      }
    })
  }

  function handleDeletePosition(id: string) {
    startTransition(async () => {
      const res = await deletePosition(id)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Poste supprimé')
        router.refresh()
      }
    })
  }

  function handleSeedPositions() {
    startTransition(async () => {
      const res = await seedDefaultPositions()
      if (res.error) toast.error(res.error)
      else {
        toast.success('Postes par défaut créés')
        router.refresh()
      }
    })
  }

  function handleAddAgency() {
    if (!agencyName.trim()) return
    const formData = new FormData()
    formData.set('name', agencyName.trim())
    formData.set('contact_name', agencyContact)
    formData.set('contact_email', agencyEmail)
    formData.set('contact_phone', agencyPhone)
    startTransition(async () => {
      const res = await createAgency(formData)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Agence ajoutée')
        setAgencyName('')
        setAgencyContact('')
        setAgencyEmail('')
        setAgencyPhone('')
        router.refresh()
      }
    })
  }

  function handleDeleteAgency(id: string) {
    startTransition(async () => {
      const res = await deleteAgency(id)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Agence supprimée')
        router.refresh()
      }
    })
  }

  function handleSaveSettings() {
    const formData = new FormData()
    formData.set('daily_hours_threshold', String(dailyHours * 60))
    formData.set('weekly_hours_threshold', String(weeklyHours * 60))
    formData.set('absence_notification_hours', String(absenceNotif))
    startTransition(async () => {
      const res = await updateSettings(formData)
      if (res.error) toast.error(res.error)
      else toast.success('Paramètres sauvegardés')
    })
  }

  function handleUpdatePin() {
    if (pin.length < 4) {
      toast.error('Le PIN doit contenir au moins 4 chiffres')
      return
    }
    startTransition(async () => {
      const res = await updateAdminPin(pin)
      if (res.error) toast.error(res.error)
      else {
        toast.success('PIN mis à jour')
        setPin('')
      }
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ap-green-900 mb-4">Point&apos;age</h1>
      <PointageTabs orgSlug={orgSlug} isAdmin={isAdmin} />

      <div className="grid gap-8 max-w-2xl">
        {/* POSTES */}
        <section>
          <h2 className="text-lg font-medium text-ap-green-900 mb-3">Postes</h2>
          <div className="space-y-2 mb-3">
            {positions.map((pos) => (
              <div key={pos.id} className="flex items-center justify-between rounded-lg border border-ap-cream-200 bg-white px-4 py-2">
                <span className="text-sm text-ap-cream-800">{pos.name}</span>
                <button
                  onClick={() => handleDeletePosition(pos.id)}
                  disabled={isPending}
                  className="text-red-500 hover:text-red-700 p-1"
                  aria-label={`Supprimer ${pos.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              placeholder="Nouveau poste..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddPosition()}
            />
            <Button onClick={handleAddPosition} disabled={isPending} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {positions.length === 0 && (
            <Button variant="outline" onClick={handleSeedPositions} disabled={isPending} className="mt-2" size="sm">
              Créer les postes par défaut
            </Button>
          )}
        </section>

        {/* AGENCES */}
        <section>
          <h2 className="text-lg font-medium text-ap-green-900 mb-3">Agences intérim</h2>
          <div className="space-y-2 mb-3">
            {agencies.map((ag) => (
              <div key={ag.id} className="flex items-center justify-between rounded-lg border border-ap-cream-200 bg-white px-4 py-2">
                <div>
                  <span className="text-sm font-medium text-ap-cream-800">{ag.name}</span>
                  {ag.contact_name && (
                    <span className="text-xs text-ap-cream-600 ml-2">{ag.contact_name}</span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteAgency(ag.id)}
                  disabled={isPending}
                  className="text-red-500 hover:text-red-700 p-1"
                  aria-label={`Supprimer ${ag.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Nom de l'agence *" />
            <Input value={agencyContact} onChange={(e) => setAgencyContact(e.target.value)} placeholder="Contact" />
            <Input value={agencyEmail} onChange={(e) => setAgencyEmail(e.target.value)} placeholder="Email" type="email" />
            <Input value={agencyPhone} onChange={(e) => setAgencyPhone(e.target.value)} placeholder="Téléphone" />
          </div>
          <Button onClick={handleAddAgency} disabled={isPending} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Ajouter l&apos;agence
          </Button>
        </section>

        {/* SEUILS */}
        <section>
          <h2 className="text-lg font-medium text-ap-green-900 mb-3">Seuils heures supplémentaires</h2>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <Label htmlFor="dailyHours">Heures / jour</Label>
              <Input
                id="dailyHours"
                type="number"
                min={1}
                max={24}
                value={dailyHours}
                onChange={(e) => setDailyHours(parseInt(e.target.value) || 7)}
              />
            </div>
            <div>
              <Label htmlFor="weeklyHours">Heures / semaine</Label>
              <Input
                id="weeklyHours"
                type="number"
                min={1}
                max={168}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(parseInt(e.target.value) || 35)}
              />
            </div>
          </div>
          <div className="mb-3">
            <Label htmlFor="absenceNotif">Notification absence (heures avant)</Label>
            <Input
              id="absenceNotif"
              type="number"
              min={1}
              max={168}
              value={absenceNotif}
              onChange={(e) => setAbsenceNotif(parseInt(e.target.value) || 24)}
            />
          </div>
          <Button onClick={handleSaveSettings} disabled={isPending} size="sm">
            Sauvegarder
          </Button>
        </section>

        {/* PIN ADMIN */}
        <section>
          <h2 className="text-lg font-medium text-ap-green-900 mb-3">PIN Administrateur</h2>
          <div className="flex gap-2">
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Nouveau PIN (4+ chiffres)"
              maxLength={8}
            />
            <Button onClick={handleUpdatePin} disabled={isPending} size="sm">
              Mettre à jour
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
