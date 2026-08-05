import { z } from 'zod'

export const haccpPlanSchema = z.object({
  name: z.string().min(1, 'Le nom du plan est requis').max(200),
  product_id: z.string().uuid().nullable().optional(),
  process_description: z.string().max(5000).nullable().optional(),
})

export const haccpCcpSchema = z.object({
  plan_id: z.string().uuid(),
  step_name: z.string().min(1, "Le nom de l'étape est requis").max(200),
  hazard_type: z.enum(['biological', 'chemical', 'physical']),
  hazard_description: z.string().min(1, 'La description du danger est requise').max(1000),
  critical_limit: z.string().min(1, 'La limite critique est requise').max(200),
  monitoring_method: z.string().min(1, 'La méthode de surveillance est requise').max(500),
  monitoring_frequency: z.string().min(1, 'La fréquence est requise').max(200),
  corrective_action: z.string().min(1, "L'action corrective est requise").max(1000),
  verification_method: z.string().max(500).nullable().optional(),
  display_order: z.coerce.number().int().min(0).default(0),
})

export const haccpControlSchema = z.object({
  ccp_id: z.string().uuid(),
  measured_value: z.string().min(1, 'La valeur mesurée est requise').max(100),
  is_within_limit: z.coerce.boolean(),
  corrective_action_taken: z.string().max(1000).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})
