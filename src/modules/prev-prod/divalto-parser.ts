export type DivaltoFormat = 'tiers' | 'article' | 'unknown'

export interface DivaltoTiersRecord {
  code_client: string
  nom_client: string
  code_produit: string
  designation: string
  colis: number
  quantite: number
  montant: number
  poids_kg: number
  pu_net: number
}

export interface DivaltoArticleRecord {
  code_produit: string
  designation: string
  code_client: string
  nom_client: string
  ville: string
  colis: number
  quantite: number
  pu_brut: number
  pu_net: number
  montant: number
  poids_kg: number
  date_livraison: string
  numero_piece: string
  operation: string
  etat: string
}

export interface ProductClientMapping {
  code_produit: string
  clients: Array<{ code: string; name: string }>
  nb_clients: number
  type_stock: 'sur_commande' | 'mixte'
}

export interface AggregatedNeed {
  code_produit: string
  designation: string
  total_pieces: number
  total_colis: number
  total_poids_kg: number
  poids_avec_perte_kg: number
  total_montant: number
  nb_clients: number
  clients: string
  nb_lignes: number
  seuil_ok: boolean
}

export interface DivaltoParseResult {
  format: DivaltoFormat
  period_start: string | null
  period_end: string | null
  records: DivaltoTiersRecord[] | DivaltoArticleRecord[]
  product_clients?: Map<string, Set<string>>
  errors: string[]
}

export function detectFormat(lines: string[]): DivaltoFormat {
  for (const line of lines.slice(0, 10)) {
    if (line.includes('Tri par')) {
      if (line.includes('Tiers')) return 'tiers'
      if (line.includes('Article')) return 'article'
    }
  }
  return 'unknown'
}

export function extractPeriod(lines: string[]): [string | null, string | null] {
  for (const line of lines.slice(0, 10)) {
    const matches = line.match(/(\d{2}\/\d{2}\/\d{4})/g)
    if (matches && matches.length >= 2) return [matches[0], matches[1]]
    if (matches && matches.length === 1) return [matches[0], matches[0]]
  }
  return [null, null]
}

function isHeaderLine(fields: string[]): boolean {
  if (!fields.length || !fields[0].trim()) return true
  const first = fields[0].trim()
  const skipStarts = ['Etat ', 'Dossier', 'Article', 'Tiers', 'Interlogiciel']
  return skipStarts.some((s) => first.startsWith(s))
}

function parseDecimalFr(val: string): number {
  if (!val?.trim()) return 0
  const cleaned = val.trim().replace(/\s/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function isClientCode(val: string): boolean {
  return /^\d{7,8}$/.test(val)
}

function isProductCode(val: string): boolean {
  return /^\d+$/.test(val)
}

export function parseTiersFormat(lines: string[]): {
  records: DivaltoTiersRecord[]
  productClients: Map<string, Set<string>>
} {
  const records: DivaltoTiersRecord[] = []
  const productClients = new Map<string, Set<string>>()
  let currentClientCode: string | null = null
  let currentClientName: string | null = null

  for (const line of lines) {
    const fields = line.split(';').map((f) => f.trim())
    if (isHeaderLine(fields)) continue
    if (fields.length < 9) continue
    if (fields.length > 2 && fields[2] === 'Total') continue

    // Client header: col0=code client (7-8 digits), col1=name, col2=non-empty
    if (isClientCode(fields[0]) && fields[1]?.trim() && fields[2]?.trim()) {
      currentClientCode = fields[0]
      currentClientName = fields[1].trim()
      continue
    }

    // Product line: col0=product code (digits), col1 & col2 empty
    if (
      fields[0] &&
      isProductCode(fields[0]) &&
      !fields[1]?.trim() &&
      !fields[2]?.trim() &&
      currentClientCode
    ) {
      const designation = fields[3]?.trim() ?? ''
      if (!designation) continue

      const colis = parseDecimalFr(fields[4])
      const quantite = parseDecimalFr(fields[5])
      const montant = parseDecimalFr(fields[6])
      const poidsKg = parseDecimalFr(fields[7])
      const puNet = parseDecimalFr(fields[8])

      records.push({
        code_client: currentClientCode,
        nom_client: currentClientName ?? '',
        code_produit: fields[0],
        designation,
        colis: Math.round(colis),
        quantite,
        montant,
        poids_kg: poidsKg,
        pu_net: puNet,
      })

      const clientKey = `${currentClientCode}|${currentClientName}`
      if (!productClients.has(fields[0])) {
        productClients.set(fields[0], new Set())
      }
      productClients.get(fields[0])!.add(clientKey)
    }
  }

  return { records, productClients }
}

export function parseArticleFormat(lines: string[]): DivaltoArticleRecord[] {
  const records: DivaltoArticleRecord[] = []
  let currentProductCode: string | null = null
  let currentProductName: string | null = null

  for (const line of lines) {
    const fields = line.split(';').map((f) => f.trim())
    if (isHeaderLine(fields)) continue
    if (fields.length < 6) continue
    if (fields.length > 1 && fields[1] === 'Total') continue

    // Article header: col0=code, col1=designation, few non-empty fields
    if (fields[0] && isProductCode(fields[0]) && fields[1]?.trim() && fields.length > 5) {
      const nonEmpty = fields.slice(0, 15).filter((f) => f.trim()).length
      if (nonEmpty <= 3) {
        currentProductCode = fields[0]
        currentProductName = fields[1].trim()
        continue
      }
    }

    // Data line: col0=client code (7-8 digits), col1=name
    if (
      fields[0] &&
      isClientCode(fields[0]) &&
      fields[1]?.trim() &&
      currentProductCode
    ) {
      records.push({
        code_produit: currentProductCode,
        designation: currentProductName ?? '',
        code_client: fields[0],
        nom_client: fields[1].trim(),
        ville: fields[2]?.trim() ?? '',
        colis: Math.round(parseDecimalFr(fields[5])),
        quantite: parseDecimalFr(fields[6]),
        pu_brut: parseDecimalFr(fields[7]),
        pu_net: parseDecimalFr(fields[8]),
        montant: parseDecimalFr(fields[9]),
        poids_kg: parseDecimalFr(fields[10]),
        date_livraison: fields[11]?.trim() ?? '',
        numero_piece: fields[12]?.trim() ?? '',
        operation: fields[13]?.trim() ?? '',
        etat: fields[14]?.trim() ?? '',
      })
    }
  }

  return records
}

export function parseDivaltoExport(text: string): DivaltoParseResult {
  const lines = text.split(/\r?\n/)
  const format = detectFormat(lines)
  const [periodStart, periodEnd] = extractPeriod(lines)
  const errors: string[] = []

  if (format === 'unknown') {
    errors.push('Format non reconnu. L\'export doit contenir "Tri par Tiers" ou "Tri par Article" dans les premières lignes.')
    return { format, period_start: null, period_end: null, records: [], errors }
  }

  if (format === 'tiers') {
    const { records, productClients } = parseTiersFormat(lines)
    if (records.length === 0) {
      errors.push('Aucune ligne de données trouvée dans l\'export Tiers.')
    }
    return {
      format,
      period_start: periodStart,
      period_end: periodEnd,
      records,
      product_clients: productClients,
      errors,
    }
  }

  const records = parseArticleFormat(lines)
  if (records.length === 0) {
    errors.push('Aucune ligne de données trouvée dans l\'export Article.')
  }
  return {
    format,
    period_start: periodStart,
    period_end: periodEnd,
    records,
    errors,
  }
}

export function computeNeeds(
  records: DivaltoTiersRecord[] | DivaltoArticleRecord[],
  lossPct = 3,
  thresholdKg = 30,
): AggregatedNeed[] {
  const products = new Map<
    string,
    {
      designation: string
      totalPieces: number
      totalColis: number
      totalPoidsKg: number
      totalMontant: number
      clients: Set<string>
      nbLignes: number
    }
  >()

  for (const r of records) {
    const code = r.code_produit
    if (!products.has(code)) {
      products.set(code, {
        designation: r.designation,
        totalPieces: 0,
        totalColis: 0,
        totalPoidsKg: 0,
        totalMontant: 0,
        clients: new Set(),
        nbLignes: 0,
      })
    }
    const p = products.get(code)!
    p.totalPieces += 'quantite' in r ? r.quantite : 0
    p.totalColis += r.colis
    p.totalPoidsKg += r.poids_kg
    p.totalMontant += r.montant
    p.clients.add('nom_client' in r ? r.nom_client : '')
    p.nbLignes++
  }

  const needs: AggregatedNeed[] = []
  for (const [code, p] of products) {
    const poidsAvecPerte = p.totalPoidsKg * (1 + lossPct / 100)
    needs.push({
      code_produit: code,
      designation: p.designation,
      total_pieces: p.totalPieces,
      total_colis: p.totalColis,
      total_poids_kg: p.totalPoidsKg,
      poids_avec_perte_kg: poidsAvecPerte,
      total_montant: p.totalMontant,
      nb_clients: p.clients.size,
      clients: Array.from(p.clients).sort().join(', '),
      nb_lignes: p.nbLignes,
      seuil_ok: poidsAvecPerte >= thresholdKg,
    })
  }

  needs.sort((a, b) => b.total_poids_kg - a.total_poids_kg)
  return needs
}

export function buildProductClientMappings(
  productClients: Map<string, Set<string>>,
): ProductClientMapping[] {
  const mappings: ProductClientMapping[] = []

  for (const [code, clientKeys] of productClients) {
    const clients = Array.from(clientKeys).map((key) => {
      const [codeClient, name] = key.split('|')
      return { code: codeClient, name: name ?? '' }
    })
    mappings.push({
      code_produit: code,
      clients: clients.sort((a, b) => a.name.localeCompare(b.name)),
      nb_clients: clients.length,
      type_stock: clients.length === 1 ? 'sur_commande' : 'mixte',
    })
  }

  return mappings.sort((a, b) => a.code_produit.localeCompare(b.code_produit))
}
