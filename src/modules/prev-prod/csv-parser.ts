export interface CsvParseResult<T> {
  rows: T[]
  errors: CsvError[]
  totalRows: number
}

export interface CsvError {
  row: number
  column: string
  message: string
}

export interface RawOrderRow {
  code_produit: string
  libelle_produit: string
  quantite_pieces: number
  quantite_colis: number | null
  pu_brut: number | null
  pu_net: number | null
  poids_total_g: number
  probabilite_pct?: number
  statut?: string
}

export interface RawStockRow {
  code_produit: string
  libelle_produit: string
  stock_pieces: number
  poids_piece_g: number
  dlc: string | null
  lot: string | null
}

function parseCsvText(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  return lines.map((line) => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ';' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else if (char === ',' && !inQuotes && !line.includes(';')) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  })
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

const COLUMN_MAPPINGS: Record<string, string[]> = {
  code_produit: ['ref', 'code', 'code_produit', 'reference', 'code_article'],
  libelle_produit: ['designation_article', 'designation', 'libelle', 'libelle_produit', 'nom', 'article'],
  quantite_pieces: ['quantite_en_unites', 'quantite', 'qte', 'quantite_pieces', 'qty'],
  quantite_colis: ['quantite_colis', 'nb_colis', 'colis'],
  pu_brut: ['pu_brut', 'prix_brut', 'prix_unitaire_brut'],
  pu_net: ['pu_net', 'prix_net', 'prix_unitaire_net'],
  poids_total_g: ['poids', 'poids_total', 'poids_total_g', 'poids_g'],
  probabilite_pct: ['probabilite_pct', 'probabilite', 'proba'],
  statut: ['statut', 'status'],
  stock_pieces: ['stock_pieces', 'stock', 'quantite_stock', 'qte_stock'],
  poids_piece_g: ['poids_piece_g', 'poids_unitaire', 'poids_piece'],
  dlc: ['dlc', 'date_limite'],
  lot: ['lot', 'numero_lot', 'n_lot'],
}

function mapHeaders(rawHeaders: string[]): Map<string, number> {
  const normalized = rawHeaders.map(normalizeHeader)
  const mapping = new Map<string, number>()

  for (const [targetCol, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    const idx = normalized.findIndex((h) => aliases.includes(h))
    if (idx !== -1) {
      mapping.set(targetCol, idx)
    }
  }

  return mapping
}

function getCell(row: string[], colIndex: number | undefined): string {
  if (colIndex === undefined) return ''
  return row[colIndex]?.trim() ?? ''
}

function parseNumber(val: string): number | null {
  if (!val) return null
  const cleaned = val.replace(/\s/g, '').replace(',', '.')
  const num = Number(cleaned)
  return isNaN(num) ? null : num
}

export function parseOrdersCsv(text: string): CsvParseResult<RawOrderRow> {
  const parsed = parseCsvText(text)
  if (parsed.length < 2) return { rows: [], errors: [{ row: 0, column: '', message: 'Fichier vide ou sans données' }], totalRows: 0 }

  const headerMapping = mapHeaders(parsed[0])
  const rows: RawOrderRow[] = []
  const errors: CsvError[] = []

  if (!headerMapping.has('code_produit')) {
    errors.push({ row: 0, column: 'code_produit', message: 'Colonne "ref" ou "code_produit" introuvable' })
    return { rows, errors, totalRows: parsed.length - 1 }
  }

  for (let i = 1; i < parsed.length; i++) {
    const row = parsed[i]
    const code = getCell(row, headerMapping.get('code_produit'))
    const label = getCell(row, headerMapping.get('libelle_produit'))
    const qtyStr = getCell(row, headerMapping.get('quantite_pieces'))
    const poidsStr = getCell(row, headerMapping.get('poids_total_g'))

    if (!code) {
      errors.push({ row: i, column: 'code_produit', message: 'Code produit manquant' })
      continue
    }

    const qty = parseNumber(qtyStr)
    if (qty === null || qty <= 0) {
      errors.push({ row: i, column: 'quantite_pieces', message: `Quantité invalide: "${qtyStr}"` })
      continue
    }

    const poids = parseNumber(poidsStr)
    if (poids === null || poids <= 0) {
      errors.push({ row: i, column: 'poids_total_g', message: `Poids invalide: "${poidsStr}"` })
      continue
    }

    rows.push({
      code_produit: code,
      libelle_produit: label || code,
      quantite_pieces: Math.round(qty),
      quantite_colis: parseNumber(getCell(row, headerMapping.get('quantite_colis')))
        ? Math.round(parseNumber(getCell(row, headerMapping.get('quantite_colis')))!)
        : null,
      pu_brut: parseNumber(getCell(row, headerMapping.get('pu_brut'))),
      pu_net: parseNumber(getCell(row, headerMapping.get('pu_net'))),
      poids_total_g: Math.round(poids),
      probabilite_pct: parseNumber(getCell(row, headerMapping.get('probabilite_pct'))) ?? undefined,
      statut: getCell(row, headerMapping.get('statut')) || undefined,
    })
  }

  return { rows, errors, totalRows: parsed.length - 1 }
}

export function parseStocksCsv(text: string): CsvParseResult<RawStockRow> {
  const parsed = parseCsvText(text)
  if (parsed.length < 2) return { rows: [], errors: [{ row: 0, column: '', message: 'Fichier vide ou sans données' }], totalRows: 0 }

  const headerMapping = mapHeaders(parsed[0])
  const rows: RawStockRow[] = []
  const errors: CsvError[] = []

  if (!headerMapping.has('code_produit')) {
    errors.push({ row: 0, column: 'code_produit', message: 'Colonne "code_produit" introuvable' })
    return { rows, errors, totalRows: parsed.length - 1 }
  }

  for (let i = 1; i < parsed.length; i++) {
    const row = parsed[i]
    const code = getCell(row, headerMapping.get('code_produit'))
    const label = getCell(row, headerMapping.get('libelle_produit'))
    const stockStr = getCell(row, headerMapping.get('stock_pieces'))
    const poidsStr = getCell(row, headerMapping.get('poids_piece_g'))

    if (!code) {
      errors.push({ row: i, column: 'code_produit', message: 'Code produit manquant' })
      continue
    }

    const stock = parseNumber(stockStr)
    if (stock === null) {
      errors.push({ row: i, column: 'stock_pieces', message: `Stock invalide: "${stockStr}"` })
      continue
    }

    const poids = parseNumber(poidsStr)
    if (poids === null || poids <= 0) {
      errors.push({ row: i, column: 'poids_piece_g', message: `Poids pièce invalide: "${poidsStr}"` })
      continue
    }

    const dlcRaw = getCell(row, headerMapping.get('dlc'))
    const lot = getCell(row, headerMapping.get('lot'))

    rows.push({
      code_produit: code,
      libelle_produit: label || code,
      stock_pieces: Math.round(stock),
      poids_piece_g: Math.round(poids),
      dlc: dlcRaw || null,
      lot: lot || null,
    })
  }

  return { rows, errors, totalRows: parsed.length - 1 }
}

export function extractDateFromFilename(filename: string): string | null {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/)
  if (match) return match[1]
  const match2 = filename.match(/(\d{2})[-_](\d{2})[-_](\d{4})/)
  if (match2) return `${match2[3]}-${match2[2]}-${match2[1]}`
  return null
}
