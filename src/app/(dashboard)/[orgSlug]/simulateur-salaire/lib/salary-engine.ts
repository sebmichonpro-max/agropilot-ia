import type { SimulationInputs, SimulationResults, CotisationLine, SimSettings } from '@/types/database'

// ══════════════════════════════════════════════
// CONSTANTES 2026
// ══════════════════════════════════════════════

export const C2026 = {
  SMIC_HORAIRE: 12.31,
  SMIC_MENSUEL: 1867.02,
  HOURS_35H: 151.67,
  PMSS: 4005.0,
  PASS: 48060.0,

  HS_25: 1.25,
  HS_50: 1.50,
  HS_EXONERATION_IR: 7500,

  RGDU_COEFF_MAX: 0.3206,
  RGDU_SMIC_MULT: 3,
  RGDU_FACTEUR: 0.6,

  ANCIENNETE: [
    { min: 3, rate: 0.03 },
    { min: 6, rate: 0.06 },
    { min: 9, rate: 0.09 },
    { min: 12, rate: 0.12 },
    { min: 15, rate: 0.15 },
    { min: 18, rate: 0.18 },
    { min: 21, rate: 0.21 },
  ],

  RTT_37H30: 12,
  RTT_39H: 23,
} as const

// ══════════════════════════════════════════════
// TAUX DE COTISATIONS (vérifiés bulletin Soleane juin 2026)
// ══════════════════════════════════════════════

const COT = {
  MALADIE_PAT: 0.13,
  VIEILLESSE_DEPLAF_SAL: 0.004,
  VIEILLESSE_DEPLAF_PAT: 0.0211,
  ALLOC_FAMILIALES_PAT: 0.0525,
  CSA_PAT: 0.003,
  TAXE_APPRENTISSAGE_PAT: 0.0068,
  CHOMAGE_PAT: 0.043,
  AGS_PAT: 0.002,

  VIEILLESSE_PLAF_SAL: 0.069,
  VIEILLESSE_PLAF_PAT: 0.0855,
  ARRCO_T1_SAL: 0.0401,
  ARRCO_T1_PAT: 0.0601,
  CEG_T1_SAL: 0.0086,
  CEG_T1_PAT: 0.0129,

  ARRCO_T2_SAL: 0.0864,
  ARRCO_T2_PAT: 0.1295,
  CEG_T2_SAL: 0.0108,
  CEG_T2_PAT: 0.0162,
  CET_SAL: 0.0014,
  CET_PAT: 0.0021,
  PREVOYANCE_CADRES_PAT: 0.015,

  CSG_DEDUCTIBLE: 0.068,
  CSG_NON_DEDUCTIBLE: 0.024,
  CRDS: 0.005,
  ASSIETTE_CSG: 0.9825,
} as const

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

interface CompanyRates {
  atMpRate: number
  mutuellePatronale: number
  mutuelleSalariale: number
  prevoyancePatRate: number
  prevoyanceSalRate: number
  fnalRate: number
  formationRate: number
  transportRate: number
}

function getCompanyRates(settings?: SimSettings): CompanyRates {
  return {
    atMpRate: (settings?.at_mp_rate_bps ?? 306) / 10000,
    mutuellePatronale: (settings?.mutual_employer_cents ?? 3428) / 100,
    mutuelleSalariale: (settings?.mutual_employee_cents ?? 19095) / 100,
    prevoyancePatRate: (settings?.prevoyance_employer_rate_bps ?? 155) / 10000,
    prevoyanceSalRate: (settings?.prevoyance_employee_rate_bps ?? 25) / 10000,
    fnalRate: (settings?.fnal_rate_bps ?? 10) / 10000,
    formationRate: (settings?.formation_rate_bps ?? 100) / 10000,
    transportRate: (settings?.transport_rate_bps ?? 0) / 10000,
  }
}

// ══════════════════════════════════════════════
// RGDU (ex-Fillon)
// ══════════════════════════════════════════════

function calculateRGDU(brut: number): number {
  const seuil = C2026.SMIC_MENSUEL * C2026.RGDU_SMIC_MULT
  if (brut > seuil) return 0

  const ratio = (C2026.RGDU_SMIC_MULT * C2026.SMIC_MENSUEL * 1.6) / brut
  let T = (C2026.RGDU_COEFF_MAX / C2026.RGDU_FACTEUR) * (ratio - 1)
  T = Math.min(T, C2026.RGDU_COEFF_MAX)
  T = Math.max(T, 0)

  return round2(brut * T)
}

// ══════════════════════════════════════════════
// PRIME D'ANCIENNETÉ (IDCC 1396)
// ══════════════════════════════════════════════

function primeAnciennete(baseSalary: number, hsAmount: number, years: number): number {
  const base = baseSalary + hsAmount
  const palier = C2026.ANCIENNETE.filter(p => years >= p.min).pop()
  return palier ? round2(base * palier.rate) : 0
}

// ══════════════════════════════════════════════
// DÉTAIL DES COTISATIONS
// ══════════════════════════════════════════════

function calculateAllLines(
  brut: number,
  statut: 'non_cadre' | 'cadre',
  rates: CompanyRates
): { lines: CotisationLine[]; totalSalarial: number; totalPatronal: number } {
  const lines: CotisationLine[] = []
  const t1 = Math.min(brut, C2026.PMSS)
  const assietteCsg = round2(brut * COT.ASSIETTE_CSG)

  function addLine(
    label: string,
    category: string,
    base: number,
    rateSal: number,
    ratePat: number
  ) {
    lines.push({
      label,
      category,
      base: round2(base),
      rateSal,
      montantSal: round2(base * rateSal),
      ratePat,
      montantPat: round2(base * ratePat),
    })
  }

  // SANTÉ
  addLine('Maladie-Maternité-Invalidité-Décès', 'SANTÉ', brut, 0, COT.MALADIE_PAT)

  lines.push({
    label: 'Complémentaire santé',
    category: 'SANTÉ',
    base: 0,
    rateSal: 0,
    montantSal: rates.mutuelleSalariale,
    ratePat: 0,
    montantPat: rates.mutuellePatronale,
  })

  addLine('Prévoyance Incapacité-Invalidité', 'SANTÉ', brut, rates.prevoyanceSalRate, rates.prevoyancePatRate)

  // AT/MP
  addLine('AT/MP', 'ACCIDENTS DU TRAVAIL', brut, 0, rates.atMpRate)

  // RETRAITE
  addLine('Vieillesse plafonnée', 'RETRAITE', t1, COT.VIEILLESSE_PLAF_SAL, COT.VIEILLESSE_PLAF_PAT)
  addLine('Vieillesse déplafonnée', 'RETRAITE', brut, COT.VIEILLESSE_DEPLAF_SAL, COT.VIEILLESSE_DEPLAF_PAT)
  addLine('Complémentaire T1 AGIRC-ARRCO', 'RETRAITE', t1, COT.ARRCO_T1_SAL, COT.ARRCO_T1_PAT)
  addLine('CEG T1', 'RETRAITE', t1, COT.CEG_T1_SAL, COT.CEG_T1_PAT)

  if (statut === 'cadre') {
    const t2 = Math.max(0, brut - C2026.PMSS)
    if (t2 > 0) {
      addLine('Complémentaire T2 AGIRC-ARRCO', 'RETRAITE', t2, COT.ARRCO_T2_SAL, COT.ARRCO_T2_PAT)
      addLine('CEG T2', 'RETRAITE', t2, COT.CEG_T2_SAL, COT.CEG_T2_PAT)
      addLine('CET', 'RETRAITE', t2, COT.CET_SAL, COT.CET_PAT)
    }
    addLine('Prévoyance cadres', 'RETRAITE', t1, 0, COT.PREVOYANCE_CADRES_PAT)
  }

  // FAMILLE
  addLine('Allocations familiales', 'FAMILLE', brut, 0, COT.ALLOC_FAMILIALES_PAT)

  // CHÔMAGE
  addLine('Assurance chômage', 'CHÔMAGE', brut, 0, COT.CHOMAGE_PAT)
  addLine('AGS', 'CHÔMAGE', brut, 0, COT.AGS_PAT)

  // CSG / CRDS
  addLine('CSG déductible (98,25% du brut)', 'CSG / CRDS', assietteCsg, COT.CSG_DEDUCTIBLE, 0)
  addLine('CSG non déductible + CRDS', 'CSG / CRDS', assietteCsg, COT.CSG_NON_DEDUCTIBLE + COT.CRDS, 0)

  // AUTRES CONTRIBUTIONS PATRONALES
  addLine('Formation professionnelle', 'AUTRES CONTRIBUTIONS', brut, 0, rates.formationRate)
  addLine("Taxe d'apprentissage", 'AUTRES CONTRIBUTIONS', brut, 0, COT.TAXE_APPRENTISSAGE_PAT)
  addLine('FNAL', 'AUTRES CONTRIBUTIONS', brut, 0, rates.fnalRate)
  addLine('CSA', 'AUTRES CONTRIBUTIONS', brut, 0, COT.CSA_PAT)

  if (rates.transportRate > 0) {
    addLine('Versement mobilité', 'AUTRES CONTRIBUTIONS', brut, 0, rates.transportRate)
  }

  const totalSalarial = round2(lines.reduce((sum, l) => sum + l.montantSal, 0))
  const totalPatronal = round2(lines.reduce((sum, l) => sum + l.montantPat, 0))

  return { lines, totalSalarial, totalPatronal }
}

// ══════════════════════════════════════════════
// SIMULATION PRINCIPALE
// ══════════════════════════════════════════════

export function simulate(inputs: SimulationInputs, settings?: SimSettings): SimulationResults {
  const rates = getCompanyRates(settings)
  const isForfaitJour = inputs.duration === 'forfait_jour'

  let baseSalary: number
  let hsMonthly = 0
  let hsAmount = 0
  let rtt = 0
  let tauxJournalier = 0

  if (isForfaitJour) {
    // FORFAIT JOUR — pas de taux horaire, pas d'HS
    const annuel = inputs.salaryAnnual || 0
    baseSalary = round2(annuel / 12)
    tauxJournalier = round2(annuel / (inputs.forfaitJours || 218))
    rtt = 365 - 104 - 25 - 8 - (inputs.forfaitJours || 218)
  } else {
    // MODE HORAIRE (35h / 37h30 / 39h)
    baseSalary = round2(inputs.hourlyRate * C2026.HOURS_35H)

    let hsWeekly = inputs.extraHS || 0
    if (inputs.duration === '37h30') { hsWeekly += 2.5; rtt = C2026.RTT_37H30 }
    if (inputs.duration === '39h') { hsWeekly += 4.0; rtt = C2026.RTT_39H }
    hsMonthly = round2(hsWeekly * 52 / 12)
    hsAmount = round2(hsMonthly * inputs.hourlyRate * C2026.HS_25)
  }

  // Prime d'ancienneté — en forfait jour, pas d'HS dans la base
  const anciennete = isForfaitJour
    ? primeAnciennete(baseSalary, 0, inputs.seniority)
    : primeAnciennete(baseSalary, hsAmount, inputs.seniority)

  // 13ème mois mensualisé
  const treizieme = inputs.treizieme ? round2(baseSalary / 12) : 0

  // Brut total
  const primeExc = inputs.primeExceptionnelle || 0
  const brut = round2(baseSalary + hsAmount + anciennete + treizieme + primeExc)

  // Cotisations (identiques forfait jour / horaire — même assiette brut)
  const detail = calculateAllLines(brut, inputs.statut, rates)

  // RGDU (en forfait jour, le salaire est souvent > 3 SMIC → pas de RGDU)
  const rgdu = calculateRGDU(brut)

  // Allègement dans le détail
  const rgduLine: CotisationLine = {
    label: 'RGDU (ex-Fillon)',
    category: 'ALLÈGEMENTS',
    base: 0,
    rateSal: 0,
    montantSal: 0,
    ratePat: 0,
    montantPat: round2(-rgdu),
  }

  const allLines = [...detail.lines, rgduLine]

  const netAvantImpot = round2(brut - detail.totalSalarial)
  const coutEmployeurMensuel = round2(brut + detail.totalPatronal - rgdu + rates.mutuellePatronale)
  const coutAnnuel = round2(coutEmployeurMensuel * 12 + (inputs.treizieme ? baseSalary : 0))

  return {
    brut,
    baseSalary,
    hsAmount,
    hsMonthly,
    anciennete,
    treizieme,
    primeExceptionnelle: primeExc,
    cotisationsSalariales: detail.totalSalarial,
    cotisationsPatronales: detail.totalPatronal,
    rgdu,
    netAvantImpot,
    coutEmployeur: coutEmployeurMensuel,
    coutAnnuel,
    detail: allLines,
    rtt,
    mutuellePatronale: rates.mutuellePatronale,
    mutuelleSalariale: rates.mutuelleSalariale,
    isForfaitJour,
    tauxJournalier,
  }
}

export function buildDefaultLabel(inputs: SimulationInputs): string {
  if (inputs.duration === 'forfait_jour') {
    const statut = inputs.statut === 'cadre' ? 'Cadre' : 'Non cadre'
    return `${statut} Forfait jour ${inputs.forfaitJours || 218}j — ${(inputs.salaryAnnual || 0).toLocaleString('fr-FR')}€/an`
  }
  const dur = inputs.duration
  const statut = inputs.statut === 'cadre' ? 'Cadre' : 'Non cadre'
  return `${statut} ${dur} coef ${inputs.coefficient} — ${inputs.hourlyRate.toFixed(2)}€/h`
}
