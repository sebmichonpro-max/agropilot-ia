import { z } from 'zod'

export const supplierSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200),
  contact_name: z.string().max(200).nullable().optional(),
  email: z.string().email('Email invalide').max(200).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  postal_code: z.string().max(20).nullable().optional(),
  country: z.string().max(100).default('France'),
  siret: z.string().max(20).nullable().optional(),
  status: z.enum(['active', 'pending', 'suspended', 'inactive']).default('pending'),
  notes: z.string().max(2000).nullable().optional(),
})
