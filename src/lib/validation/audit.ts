import { z } from 'zod'

export const auditSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  audit_type: z.enum(['internal', 'client', 'certification']),
  planned_date: z.string().min(1, 'La date est requise'),
  auditor_name: z.string().max(200).nullable().optional(),
  scope: z.string().max(2000).nullable().optional(),
})

export const auditCheckItemSchema = z.object({
  audit_id: z.string().uuid(),
  category: z.string().min(1, 'La catégorie est requise').max(100),
  question: z.string().min(1, 'La question est requise').max(500),
  check_status: z.enum(['conforming', 'minor_nc', 'major_nc', 'not_applicable']),
  comment: z.string().max(2000).nullable().optional(),
  evidence: z.string().max(2000).nullable().optional(),
  display_order: z.coerce.number().int().min(0).default(0),
})
