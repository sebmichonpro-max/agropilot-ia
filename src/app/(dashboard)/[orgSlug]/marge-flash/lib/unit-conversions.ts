// Convert quantity to base unit (g for weight, ml for volume, piece stays piece)
export function convertToBaseUnit(quantity: number, unit: string): number {
  switch (unit) {
    case 'kg': return quantity * 1000
    case 'g': return quantity
    case 'L': return quantity * 1000
    case 'ml': return quantity
    case 'pièce': return quantity
    case 'dose': return quantity
    default: return quantity
  }
}

// Price per base unit (centimes/g or centimes/ml) from price per unit (centimes/kg or centimes/L)
export function pricePerBaseUnit(priceCents: number, unit: string): number {
  switch (unit) {
    case 'kg': return priceCents / 1000
    case 'g': return priceCents
    case 'L': return priceCents / 1000
    case 'ml': return priceCents
    case 'pièce': return priceCents
    case 'dose': return priceCents
    default: return priceCents
  }
}

export function formatUnit(unit: string): string {
  switch (unit) {
    case 'kg': return 'kg'
    case 'g': return 'g'
    case 'L': return 'L'
    case 'ml': return 'ml'
    case 'pièce': return 'pce'
    case 'dose': return 'dose'
    default: return unit
  }
}

export const INGREDIENT_UNITS = ['kg', 'L', 'pièce'] as const
export const RECIPE_UNITS = ['g', 'ml', 'pièce'] as const
export const PACKAGING_UNITS = ['pièce', 'mètre', 'dose', 'm²'] as const
