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
