import { z } from 'zod'

export const lotSchema = z.object({
  lot_number: z.string().min(1, 'Le numéro de lot est requis').max(50),
  product_id: z.string().uuid().nullable().optional(),
  supplier_id: z.string().uuid().nullable().optional(),
  status: z.enum(['received', 'in_production', 'finished', 'shipped', 'recalled']).default('received'),
  quantity: z.coerce.number().positive().nullable().optional(),
  unit: z.string().max(20).nullable().optional(),
  reception_date: z.string().nullable().optional(),
  production_date: z.string().nullable().optional(),
  dlc: z.string().nullable().optional(),
  ddm: z.string().nullable().optional(),
  temperature_reception: z.coerce.number().nullable().optional(),
  visual_check_ok: z.coerce.boolean().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})

export const shipmentSchema = z.object({
  shipment_number: z.string().min(1, "Le numéro d'expédition est requis").max(50),
  customer_name: z.string().min(1, 'Le client est requis').max(200),
  shipped_at: z.string().min(1, "La date d'expédition est requise"),
  lot_ids: z.array(z.string().uuid()).min(1, 'Au moins un lot est requis'),
  notes: z.string().max(2000).nullable().optional(),
})
