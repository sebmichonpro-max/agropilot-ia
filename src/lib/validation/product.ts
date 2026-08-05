import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200),
  reference: z.string().max(50).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  unit: z.string().min(1, "L'unité est requise").max(20).default('kg'),
  weight_grams: z.coerce.number().int().positive().nullable().optional(),
  barcode: z.string().max(50).nullable().optional(),
  shelf_life_days: z.coerce.number().int().positive().nullable().optional(),
  storage_conditions: z.string().max(500).nullable().optional(),
})

export const productIngredientSchema = z.object({
  name: z.string().min(1, "Le nom de l'ingrédient est requis").max(200),
  percentage: z.coerce.number().min(0).max(100).nullable().optional(),
  allergens: z.array(z.string()).default([]),
  display_order: z.coerce.number().int().min(0).default(0),
})

export const nutritionalValuesSchema = z.object({
  energy_kj: z.coerce.number().int().min(0).nullable().optional(),
  energy_kcal: z.coerce.number().int().min(0).nullable().optional(),
  fat_g: z.coerce.number().min(0).nullable().optional(),
  saturated_fat_g: z.coerce.number().min(0).nullable().optional(),
  carbohydrates_g: z.coerce.number().min(0).nullable().optional(),
  sugars_g: z.coerce.number().min(0).nullable().optional(),
  fiber_g: z.coerce.number().min(0).nullable().optional(),
  protein_g: z.coerce.number().min(0).nullable().optional(),
  salt_g: z.coerce.number().min(0).nullable().optional(),
})
