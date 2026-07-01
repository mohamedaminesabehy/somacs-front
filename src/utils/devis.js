export const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const normalizeRate = (value) => Math.max(0, toNumber(value, 0))

export const extractTauxFromCode = (codeTva) => {
  if (!codeTva) return 0
  const match = String(codeTva).match(/(\d+(?:\.\d+)?)/)
  if (match) return parseFloat(match[1])
  return 0
}

export const resolveTVA = (line) => {
  const taux = normalizeRate(line?.TVA)
  if (taux > 0) return taux
  return extractTauxFromCode(line?.CodeTVA)
}

/**
 * Computes net HT for a single line item.
 * Prefers an API-provided Total_HT, falls back to calculation from Qte * PU_HT * (1 - Remise%).
 */
export const getLineNetHT = (line) => {
  const fromApi = toNumber(line?.Total_HT, NaN)
  if (Number.isFinite(fromApi) && fromApi >= 0) return fromApi
  const alt = toNumber(line?.TotalNetHT, NaN)
  if (Number.isFinite(alt) && alt >= 0) return alt
  const qte = Math.max(0, toNumber(line?.Qte))
  const pu = Math.max(0, toNumber(line?.PU_HT))
  const remise = normalizeRate(line?.Remise)
  return qte * pu * (1 - remise / 100)
}

/**
 * Computes totals from detail lines, optional footer TVA rows, and header timbre.
 * Used by both CreateDevis and DevisDetails.
 */
export const computeDevisTotals = (lines, footer = [], header = {}) => {
  const articleLines = (Array.isArray(lines) ? lines : [])
    .filter((d) => (d?.Code || d?.Designation) && toNumber(d?.Qte) > 0)

  const totalHTBrut = articleLines.reduce((acc, d) => acc + toNumber(d.Qte) * toNumber(d.PU_HT), 0)
  const totalRemise = articleLines.reduce(
    (acc, d) => acc + toNumber(d.Qte) * toNumber(d.PU_HT) * (normalizeRate(d.Remise) / 100),
    0,
  )
  const totalNetHT = articleLines.reduce((acc, d) => acc + getLineNetHT(d), 0)
  const computedTVA = articleLines.reduce(
    (acc, d) => acc + getLineNetHT(d) * (resolveTVA(d) / 100),
    0,
  )

  const footerRows = Array.isArray(footer) ? footer : []
  const footerTVA = footerRows.reduce((acc, f) => acc + toNumber(f?.Montant_TVA), 0)
  const totalTVA = footerRows.length > 0 ? footerTVA : computedTVA

  const timbreCandidates = [
    header?.TIMBRE, header?.Timbre, header?.DROITTIMBRE,
    header?.DroitTimbre, header?.DROIT_TIMBRE,
  ]
  const timbreParsed = timbreCandidates.map((v) => toNumber(v, NaN)).find((v) => Number.isFinite(v) && v >= 0)
  const timbre = Number.isFinite(timbreParsed) ? timbreParsed : 1.0

  const totalTTC = totalNetHT + totalTVA + timbre

  // Groupement TVA par taux (for CreateDevis summary display)
  const tvaMap = {}
  for (const d of articleLines) {
    const taux = resolveTVA(d)
    const key = String(taux)
    const base = getLineNetHT(d)
    const montant = base * (taux / 100)
    if (!tvaMap[key]) tvaMap[key] = { taux, base: 0, montant: 0 }
    tvaMap[key].base += base
    tvaMap[key].montant += montant
  }
  const tvaSummary = Object.values(tvaMap).sort((a, b) => a.taux - b.taux)

  return { totalHTBrut, totalRemise, totalNetHT, totalTVA, timbre, totalTTC, tvaSummary }
}
