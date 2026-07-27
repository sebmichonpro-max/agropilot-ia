import { z } from 'zod/v4'

const storageTypeEnum = z.enum(['ambient', 'fresh', 'frozen', 'deep_frozen'])
const movementTypeEnum = z.enum([
  'picking',
  'transfer',
  'loss',
  'return',
  'adjustment',
])
const unitEnum = z.enum(['kg', 'unites', 'litres'])

export const storageZoneSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  storage_type: storageTypeEnum,
  temperature_min: z.coerce.number().optional(),
  temperature_max: z.coerce.number().optional(),
  thermal_factor: z.coerce
    .number()
    .int()
    .min(100, 'Le facteur thermique minimum est 1.0 (100)')
    .max(300, 'Le facteur thermique maximum est 3.0 (300)'),
  daily_cost_cents: z.coerce
    .number()
    .int()
    .positive('Le coût journalier doit être supérieur à 0'),
  capacity_pallets: z.coerce.number().int().positive().optional(),
})

export const productReferenceSchema = z.object({
  code: z
    .string()
    .min(2, 'Le code doit contenir au moins 2 caractères')
    .max(50, 'Le code ne peut pas dépasser 50 caractères')
    .regex(
      /^[a-zA-Z0-9\-]+$/,
      'Le code ne peut contenir que des lettres, chiffres et tirets'
    ),
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),
  family: z.string().optional(),
  supplier: z.string().optional(),
  unit_price_cents: z.coerce
    .number()
    .int()
    .positive('Le prix unitaire doit être supérieur à 0'),
  unit: unitEnum.default('kg'),
  default_storage_type: storageTypeEnum.optional(),
})

export const palletSchema = z.object({
  product_reference_id: z.string().uuid('Référence produit invalide'),
  storage_zone_id: z.string().uuid('Zone de stockage invalide'),
  lot_number: z.string().optional(),
  entry_date: z.string().min(1, "La date d'entrée est requise"),
  initial_quantity: z.coerce
    .number()
    .int()
    .positive('La quantité doit être supérieure à 0'),
  unit_price_cents: z.coerce
    .number()
    .int()
    .positive('Le prix unitaire doit être supérieur à 0'),
  notes: z.string().optional(),
})

export const palletMovementSchema = z.object({
  pallet_id: z.string().uuid('Palette invalide'),
  movement_date: z.string().min(1, 'La date est requise'),
  quantity: z.coerce
    .number()
    .int()
    .positive('La quantité doit être supérieure à 0'),
  movement_type: movementTypeEnum.default('picking'),
  notes: z.string().optional(),
})

export const kmSettingsSchema = z
  .object({
    capital_cost_rate: z.coerce
      .number()
      .int()
      .min(1, 'Le taux doit être au moins 0,01 %')
      .max(5000, 'Le taux ne peut pas dépasser 50 %'),
    alert_threshold_excellent: z.coerce.number().int().positive(),
    alert_threshold_good: z.coerce.number().int().positive(),
    alert_threshold_warning: z.coerce.number().int().positive(),
    alert_threshold_critical: z.coerce.number().int().positive(),
  })
  .refine(
    (d) =>
      d.alert_threshold_excellent <
      d.alert_threshold_good &&
      d.alert_threshold_good <
      d.alert_threshold_warning &&
      d.alert_threshold_warning <
      d.alert_threshold_critical,
    { message: 'Les seuils doivent être dans l\'ordre croissant' }
  )
