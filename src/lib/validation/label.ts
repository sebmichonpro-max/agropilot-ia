import { z } from 'zod'

export const labelSchema = z.object({
  product_id: z.string().uuid(),
  label_name: z.string().min(1, "Le nom de l'étiquette est requis").max(200),
  denomination: z.string().min(1, 'La dénomination est requise').max(500),
  ingredients_text: z.string().min(1, 'La liste des ingrédients est requise').max(5000),
  allergens_highlighted: z.string().max(2000).default(''),
  net_quantity: z.string().min(1, 'La quantité nette est requise').max(100),
  dlc_ddm: z.string().max(100).nullable().optional(),
  storage_conditions: z.string().max(500).nullable().optional(),
  origin_country: z.string().max(100).nullable().optional(),
  operator_name: z.string().max(200).nullable().optional(),
  operator_address: z.string().max(500).nullable().optional(),
  lot_number: z.string().max(50).nullable().optional(),
  nutritional_declaration: z.string().max(2000).nullable().optional(),
})
