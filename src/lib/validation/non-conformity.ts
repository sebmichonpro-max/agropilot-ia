import { z } from 'zod'

export const nonConformitySchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  description: z.string().min(1, 'La description est requise').max(5000),
  source: z.enum(['internal', 'supplier', 'customer']),
  severity: z.enum(['minor', 'major', 'critical']),
  product_id: z.string().uuid().nullable().optional(),
  lot_id: z.string().uuid().nullable().optional(),
  supplier_id: z.string().uuid().nullable().optional(),
  root_cause: z.string().max(2000).nullable().optional(),
  corrective_action: z.string().max(2000).nullable().optional(),
  preventive_action: z.string().max(2000).nullable().optional(),
  deadline: z.string().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
})
