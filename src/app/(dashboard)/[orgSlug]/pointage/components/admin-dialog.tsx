'use client'

import { useState, useTransition } from 'react'
import { Shield, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { verifyAdminPin } from '../actions'

interface AdminDialogProps {
  isAdminMode: boolean
  onToggle: (enabled: boolean) => void
}

export function AdminDialog({ isAdminMode, onToggle }: AdminDialogProps) {
  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (pin.length < 4) {
      toast.error('PIN trop court')
      return
    }
    startTransition(async () => {
      const res = await verifyAdminPin(pin)
      if (res.valid) {
        onToggle(true)
        setOpen(false)
        setPin('')
        toast.success('Mode admin activé')
      } else {
        toast.error('PIN incorrect')
        setPin('')
      }
    })
  }

  if (isAdminMode) {
    return (
      <Button
        onClick={() => {
          onToggle(false)
          toast.success('Mode admin désactivé')
        }}
        size="sm"
        className="bg-red-500 hover:bg-red-600 text-white"
      >
        <ShieldOff className="h-4 w-4 mr-1" />
        Admin ON
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-ap-cream-700 border-ap-cream-300">
          <Shield className="h-4 w-4 mr-1" />
          Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mode administrateur</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Entrez le PIN admin"
            maxLength={8}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <Button onClick={handleSubmit} disabled={isPending} className="w-full">
            Déverrouiller
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
