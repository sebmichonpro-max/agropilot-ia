import type {
  PrevRecipe,
  PrevProduct,
  PrevOrder,
  PrevStockSnapshot,
  PrevSalesHistory,
  PrevHoliday,
  PrevForecastMethod,
} from '@/types/database'
import { WEIGHTED_AVERAGE_WEIGHTS } from './constants'

export interface RequirementInput {
  recipe: PrevRecipe
  products: PrevProduct[]
  orders: PrevOrder[]
  stockSnapshots: PrevStockSnapshot[]
  salesHistory: PrevSalesHistory[]
  holidays: PrevHoliday[]
  planDate: string
}

export interface RequirementResult {
  recipeId: string
  stockTargetPieces: number
  coverageJ1Pieces: number
  ordersPieces: number
  quotesWeightedPieces: number
  currentStockPieces: number
  grossRequirementPieces: number
  netRequirementPieces: number
  totalWeightGrams: number
  totalWeightWithLossGrams: number
  belowThreshold: boolean
  forecastMethodUsed: PrevForecastMethod
  productBreakdown: ProductBreakdown[]
}

export interface ProductBreakdown {
  productId: string
  code: string
  label: string
  weightGrams: number
  formatLabel: string
  pieces: number
  weightTotal: number
}

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay()
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function isHoliday(dateStr: string, holidays: PrevHoliday[]): boolean {
  return holidays.some((h) => h.date === dateStr)
}

function getSameDayWeeksAgo(planDate: string, weeksAgo: number): string {
  return addDays(planDate, -7 * weeksAgo)
}

function getSalesForDate(
  productIds: string[],
  date: string,
  salesHistory: PrevSalesHistory[],
): number {
  return salesHistory
    .filter((s) => productIds.includes(s.product_id) && s.sale_date === date)
    .reduce((sum, s) => sum + s.quantity_pieces, 0)
}

export function calculateStockTarget(
  method: PrevForecastMethod,
  productIds: string[],
  planDate: string,
  salesHistory: PrevSalesHistory[],
  holidays: PrevHoliday[],
): number {
  if (method === 'dernier_jour') {
    const refDate = getSameDayWeeksAgo(planDate, 1)
    if (isHoliday(refDate, holidays)) {
      return calculateStockTarget('moyenne_4sem', productIds, planDate, salesHistory, holidays)
    }
    return getSalesForDate(productIds, refDate, salesHistory)
  }

  const refDates: string[] = []
  for (let w = 1; w <= 4; w++) {
    const d = getSameDayWeeksAgo(planDate, w)
    if (!isHoliday(d, holidays)) {
      refDates.push(d)
    }
  }

  if (refDates.length === 0) return 0

  const salesByDate = refDates.map((d) => getSalesForDate(productIds, d, salesHistory))

  if (method === 'moyenne_4sem') {
    const total = salesByDate.reduce((s, v) => s + v, 0)
    return Math.round(total / salesByDate.length)
  }

  // moyenne_ponderee — redistribute weights when holidays excluded
  const activeWeights: number[] = []
  for (let w = 1; w <= 4; w++) {
    const d = getSameDayWeeksAgo(planDate, w)
    if (!isHoliday(d, holidays)) {
      activeWeights.push(WEIGHTED_AVERAGE_WEIGHTS[w - 1])
    }
  }

  const weightSum = activeWeights.reduce((s, w) => s + w, 0)
  const normalizedWeights = activeWeights.map((w) => w / weightSum)

  let weighted = 0
  for (let i = 0; i < salesByDate.length; i++) {
    weighted += salesByDate[i] * normalizedWeights[i]
  }
  return Math.round(weighted)
}

export function calculateRequirement(input: RequirementInput): RequirementResult {
  const { recipe, products, orders, stockSnapshots, salesHistory, holidays, planDate } = input
  const productIds = products.map((p) => p.id)

  const confirmedOrders = orders.filter(
    (o) => o.order_type === 'commande' && productIds.includes(o.product_id ?? ''),
  )
  const quotes = orders.filter(
    (o) => o.order_type === 'devis' && productIds.includes(o.product_id ?? ''),
  )

  const ordersPieces = confirmedOrders.reduce((s, o) => s + o.quantity_pieces, 0)
  const quotesWeightedPieces = Math.round(
    quotes.reduce((s, o) => s + (o.quantity_pieces * o.probability_pct) / 100, 0),
  )

  const currentStockPieces = stockSnapshots
    .filter((s) => productIds.includes(s.product_id))
    .reduce((sum, s) => sum + s.stock_pieces, 0)

  let stockTargetPieces = 0
  let coverageJ1Pieces = 0
  let grossRequirementPieces = 0

  if (recipe.stock_type === 'sur_commande') {
    grossRequirementPieces = ordersPieces + quotesWeightedPieces
  } else {
    stockTargetPieces = calculateStockTarget(
      recipe.forecast_method,
      productIds,
      planDate,
      salesHistory,
      holidays,
    )

    if (recipe.coverage_j1_pct > 0) {
      const nextDay = addDays(planDate, 1)
      const nextDayTarget = calculateStockTarget(
        recipe.forecast_method,
        productIds,
        nextDay,
        salesHistory,
        holidays,
      )
      coverageJ1Pieces = Math.round((nextDayTarget * recipe.coverage_j1_pct) / 100)
    }

    if (recipe.stock_type === 'stock_permanent') {
      grossRequirementPieces = stockTargetPieces + coverageJ1Pieces
    } else {
      // mixte
      grossRequirementPieces = stockTargetPieces + coverageJ1Pieces + ordersPieces
    }
  }

  const netRequirementPieces = Math.max(0, grossRequirementPieces - currentStockPieces)

  // Breakdown by product — distribute proportionally based on orders/stock targets
  const productBreakdown: ProductBreakdown[] = []
  let totalWeightGrams = 0

  if (netRequirementPieces > 0) {
    const ordersByProduct = new Map<string, number>()
    for (const o of [...confirmedOrders, ...quotes]) {
      if (o.product_id) {
        const prev = ordersByProduct.get(o.product_id) ?? 0
        ordersByProduct.set(o.product_id, prev + o.quantity_pieces)
      }
    }

    let distributed = 0
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const isLast = i === products.length - 1

      let pieces: number
      if (ordersByProduct.size > 0) {
        const productOrders = ordersByProduct.get(product.id) ?? 0
        const totalOrders = Array.from(ordersByProduct.values()).reduce((s, v) => s + v, 0)
        const ratio = totalOrders > 0 ? productOrders / totalOrders : 1 / products.length
        pieces = isLast ? netRequirementPieces - distributed : Math.round(netRequirementPieces * ratio)
      } else {
        pieces = isLast
          ? netRequirementPieces - distributed
          : Math.round(netRequirementPieces / products.length)
      }

      pieces = Math.max(0, pieces)
      distributed += pieces

      const weightTotal = pieces * product.weight_grams
      totalWeightGrams += weightTotal

      productBreakdown.push({
        productId: product.id,
        code: product.code,
        label: product.label,
        weightGrams: product.weight_grams,
        formatLabel: product.format_label,
        pieces,
        weightTotal,
      })
    }
  }

  const lossFactor = 1 + Number(recipe.loss_pct) / 100
  const totalWeightWithLossGrams = Math.round(totalWeightGrams * lossFactor)
  const belowThreshold =
    totalWeightWithLossGrams > 0 &&
    totalWeightWithLossGrams < recipe.min_batch_grams &&
    !recipe.min_batch_exception

  return {
    recipeId: recipe.id,
    stockTargetPieces,
    coverageJ1Pieces,
    ordersPieces,
    quotesWeightedPieces,
    currentStockPieces,
    grossRequirementPieces,
    netRequirementPieces,
    totalWeightGrams,
    totalWeightWithLossGrams,
    belowThreshold,
    forecastMethodUsed: recipe.forecast_method,
    productBreakdown,
  }
}
