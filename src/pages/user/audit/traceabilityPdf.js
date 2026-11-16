import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  ACTION_LABELS,
  MODULE_SHORT_LABELS,
  OPERATIONS,
  buildModuleInsights,
  dayKey,
  formatDateForDisplay,
  formatDateTime,
  formatDayHeading,
  formatTime,
  getDescriptionLabel,
  moduleFromLog,
  operationFromAction,
  operationTotals,
} from './auditConfig'

// Rapport A4 « Bleu Premium » — journal de traçabilité métier d'un utilisateur.
// Module pur (aucune dépendance au DOM) : testable en Node avec des données fictives.

const PAGE = { width: 210, height: 297, margin: 14 }
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2
const TOP_CONTINUATION = 26
const BOTTOM_LIMIT = PAGE.height - 22

const COLORS = {
  navy: [11, 21, 48],
  navyGrid: [26, 42, 85],
  brand: [37, 99, 235],
  brandDark: [30, 64, 175],
  brandSoft: [239, 246, 255],
  brandLine: [191, 219, 254],
  ink: [15, 23, 42],
  inkSoft: [30, 41, 59],
  muted: [100, 116, 139],
  faint: [148, 163, 184],
  line: [227, 232, 240],
  zebra: [248, 250, 252],
  white: [255, 255, 255],
}

/** Les polices standard PDF ne couvrent que le Latin-1 : on normalise la ponctuation typographique. */
export function pdfSafe(value) {
  return String(value ?? '')
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\u203A\u2192]/g, '>')
    .replace(/[\u2039\u2190]/g, '<')
    .replace(/\u2022/g, '-')
    .replace(/[\u00A0\u202F]/g, ' ')
    // eslint-disable-next-line no-control-regex -- keeps \n and \r while stripping chars jsPDF fonts cannot encode
    .replace(/[^\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '')
}

function initials(name) {
  const parts = String(name || 'U').trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || 'U') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

function reportReference(user, generatedAt) {
  const stamp = `${generatedAt.getFullYear()}${String(generatedAt.getMonth() + 1).padStart(2, '0')}${String(generatedAt.getDate()).padStart(2, '0')}`
  return `TR-${stamp}-${String(user?.id ?? '0').padStart(4, '0')}`
}

export function traceabilityPdfFileName(user, periodStart, periodEnd) {
  const slug = String(user?.name || 'utilisateur')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return `rapport-tracabilite-${slug}-${periodStart || 'debut'}-au-${periodEnd || 'fin'}.pdf`
}

/**
 * @param {object} options
 * @param {object} options.user          { id, name, email, role, lastLogin, isActive }
 * @param {string} options.periodStart   AAAA-MM-JJ
 * @param {string} options.periodEnd     AAAA-MM-JJ
 * @param {object} options.counts        compteurs serveur (countsFromStats)
 * @param {number} options.totalActions
 * @param {boolean} options.isTechnicien
 * @param {Array}  options.logs          événements d'audit déjà filtrés
 * @param {string} [options.filtersLabel] description des filtres actifs
 * @param {string} [options.logoDataUrl] logo en data URL (PNG)
 * @param {Date}   [options.generatedAt]
 * @returns {jsPDF}
 */
export function buildTraceabilityPdf({
  user,
  periodStart,
  periodEnd,
  counts,
  totalActions,
  isTechnicien,
  logs = [],
  filtersLabel = '',
  logoDataUrl = '',
  generatedAt = new Date(),
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  const reference = reportReference(user, generatedAt)
  const periodLabel = `${formatDateForDisplay(periodStart)} au ${formatDateForDisplay(periodEnd)}`
  const text = (value, x, y, opts) => doc.text(pdfSafe(value), x, y, opts)

  doc.setProperties({
    title: pdfSafe(`Rapport de traçabilité - ${user?.name || ''}`),
    subject: 'Journal des activités métier',
    author: 'SOMACS',
    creator: 'SOMACS ERP',
  })

  /* ── Bandeau de couverture ───────────────────────────────────────────── */
  const drawCover = () => {
    doc.setFillColor(...COLORS.navy)
    doc.rect(0, 0, PAGE.width, 46, 'F')
    doc.setDrawColor(...COLORS.navyGrid)
    doc.setLineWidth(0.15)
    for (let x = 7; x < PAGE.width; x += 7) doc.line(x, 0, x, 46)
    for (let y = 7; y < 46; y += 7) doc.line(0, y, PAGE.width, y)
    doc.setFillColor(...COLORS.brand)
    doc.rect(0, 46, PAGE.width, 1.4, 'F')

    doc.setFillColor(...COLORS.white)
    doc.roundedRect(PAGE.margin, 10, 26, 26, 3, 3, 'F')
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', PAGE.margin + 2, 12, 22, 22)
      } catch {
        // Logo facultatif : le rapport reste valide sans visuel.
      }
    } else {
      doc.setTextColor(...COLORS.navy)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      text('SOMACS', PAGE.margin + 13, 24.5, { align: 'center' })
    }

    doc.setTextColor(...COLORS.brandLine)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    text('SOMACS  ·  TRAÇABILITÉ MÉTIER', 46, 16)
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(19)
    text('Rapport de traçabilité', 46, 25)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(203, 213, 225)
    text(`Journal des activités de ${user?.name || 'l’utilisateur'}`, 46, 31.5)

    const rightX = PAGE.width - PAGE.margin
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.brandLine)
    doc.setFont('helvetica', 'bold')
    text('RÉFÉRENCE', rightX, 15, { align: 'right' })
    text('ÉMIS LE', rightX, 26, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.white)
    text(reference, rightX, 19.5, { align: 'right' })
    text(formatDateTime(generatedAt), rightX, 30.5, { align: 'right' })
  }

  /* ── Bandeau réduit des pages suivantes ─────────────────────────────── */
  const drawContinuationHeader = () => {
    doc.setFillColor(...COLORS.navy)
    doc.rect(0, 0, PAGE.width, 14, 'F')
    doc.setFillColor(...COLORS.brand)
    doc.rect(0, 14, PAGE.width, 0.8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.white)
    text('Rapport de traçabilité', PAGE.margin, 8.8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(203, 213, 225)
    text(`${user?.name || '-'}  ·  ${periodLabel}`, PAGE.width - PAGE.margin, 8.8, { align: 'right' })
  }

  let y = 0
  const ensureSpace = (height) => {
    if (y + height <= BOTTOM_LIMIT) return
    doc.addPage()
    y = TOP_CONTINUATION
  }

  // keepWith : hauteur minimale du contenu qui suit, pour ne jamais laisser un titre orphelin.
  const sectionTitle = (eyebrow, title, subtitle, keepWith = 30) => {
    ensureSpace(14 + keepWith)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.brand)
    text(eyebrow.toUpperCase(), PAGE.margin, y)
    doc.setFontSize(12.5)
    doc.setTextColor(...COLORS.ink)
    text(title, PAGE.margin, y + 6)
    if (subtitle) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...COLORS.muted)
      text(subtitle, PAGE.width - PAGE.margin, y + 6, { align: 'right' })
    }
    doc.setDrawColor(...COLORS.line)
    doc.setLineWidth(0.3)
    doc.line(PAGE.margin, y + 9, PAGE.width - PAGE.margin, y + 9)
    y += 14
  }

  drawCover()
  y = 56

  /* ── Identité utilisateur ───────────────────────────────────────────── */
  const identityHeight = 38
  doc.setFillColor(...COLORS.white)
  doc.setDrawColor(...COLORS.line)
  doc.setLineWidth(0.3)
  doc.roundedRect(PAGE.margin, y, CONTENT_WIDTH, identityHeight, 2.5, 2.5, 'FD')

  doc.setFillColor(...COLORS.brand)
  doc.circle(PAGE.margin + 11, y + 11, 6.2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.white)
  text(initials(user?.name), PAGE.margin + 11, y + 12.6, { align: 'center' })

  doc.setTextColor(...COLORS.ink)
  doc.setFontSize(13)
  text(user?.name || '-', PAGE.margin + 21, y + 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...COLORS.muted)
  text(user?.email || '-', PAGE.margin + 21, y + 15)

  const isActive = user?.isActive !== false
  const badgeLabel = isActive ? 'Compte actif' : 'Compte inactif'
  doc.setFontSize(7.5)
  const badgeWidth = doc.getTextWidth(badgeLabel) + 8
  const badgeX = PAGE.width - PAGE.margin - 6 - badgeWidth
  doc.setFillColor(...(isActive ? [240, 253, 250] : [241, 245, 249]))
  doc.setDrawColor(...(isActive ? [153, 246, 228] : COLORS.line))
  doc.roundedRect(badgeX, y + 6.5, badgeWidth, 6, 3, 3, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...(isActive ? [17, 94, 89] : COLORS.muted))
  text(badgeLabel, badgeX + badgeWidth / 2, y + 10.6, { align: 'center' })

  doc.setDrawColor(...COLORS.line)
  doc.line(PAGE.margin + 6, y + 21, PAGE.width - PAGE.margin - 6, y + 21)

  const identityCells = [
    ['Rôle', user?.role || '-'],
    ['Période analysée', periodLabel],
    ['Dernière connexion', formatDateTime(user?.lastLogin)],
    ['Identifiant', user?.username || `#${user?.id ?? '-'}`],
  ]
  const cellWidth = (CONTENT_WIDTH - 12) / identityCells.length
  identityCells.forEach(([label, value], index) => {
    const x = PAGE.margin + 6 + index * cellWidth
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.faint)
    text(label.toUpperCase(), x, y + 27)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.8)
    doc.setTextColor(...COLORS.inkSoft)
    const wrapped = doc.splitTextToSize(pdfSafe(value), cellWidth - 4)
    doc.text(wrapped.slice(0, 2), x, y + 32)
  })
  y += identityHeight + 12

  /* ── Synthèse chiffrée ──────────────────────────────────────────────── */
  sectionTitle('Synthèse', 'Activité sur la période', `${totalActions} action(s) enregistrée(s)`)

  const ops = operationTotals(counts, isTechnicien)
  const tiles = [
    { label: 'Total des actions', value: totalActions, highlight: true },
    !isTechnicien && { label: OPERATIONS.create.label + 's', value: ops.create, rgb: OPERATIONS.create.rgb },
    { label: OPERATIONS.update.label + 's', value: ops.update, rgb: OPERATIONS.update.rgb },
    !isTechnicien && { label: OPERATIONS.delete.label + 's', value: ops.delete, rgb: OPERATIONS.delete.rgb },
    { label: OPERATIONS.assign.label + 's', value: ops.assign, rgb: OPERATIONS.assign.rgb },
    { label: 'Assistant IA', value: ops.ai, rgb: OPERATIONS.ai.rgb },
  ].filter(Boolean)
  const tileGap = 3.5
  const tileWidth = (CONTENT_WIDTH - tileGap * (tiles.length - 1)) / tiles.length
  const tileHeight = 22
  ensureSpace(tileHeight + 4)
  tiles.forEach((tile, index) => {
    const x = PAGE.margin + index * (tileWidth + tileGap)
    if (tile.highlight) {
      doc.setFillColor(...COLORS.navy)
      doc.roundedRect(x, y, tileWidth, tileHeight, 2, 2, 'F')
    } else {
      doc.setFillColor(...COLORS.white)
      doc.setDrawColor(...COLORS.line)
      doc.roundedRect(x, y, tileWidth, tileHeight, 2, 2, 'FD')
      doc.setFillColor(...tile.rgb)
      doc.circle(x + 4.2, y + 5.6, 1.1, 'F')
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(...(tile.highlight ? COLORS.brandLine : COLORS.muted))
    text(tile.label, tile.highlight ? x + 3.5 : x + 6.6, y + 6.4)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(17)
    doc.setTextColor(...(tile.highlight ? COLORS.white : COLORS.ink))
    text(String(tile.value), x + 3.5, y + 17)
  })
  y += tileHeight + 10

  /* ── Répartition par module ─────────────────────────────────────────── */
  const insights = buildModuleInsights(counts, isTechnicien)
  const moduleMax = Math.max(1, ...insights.map((item) => item.value))
  ensureSpace(insights.length * 8 + 12)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.inkSoft)
  text('Répartition par module', PAGE.margin, y)
  y += 5
  const labelWidth = 34
  const barX = PAGE.margin + labelWidth
  const barWidth = CONTENT_WIDTH - labelWidth - 26
  insights.forEach((item) => {
    const share = totalActions > 0 ? Math.round((item.value / totalActions) * 100) : 0
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.2)
    doc.setTextColor(...COLORS.inkSoft)
    text(item.title, PAGE.margin, y + 3.4)
    doc.setFillColor(241, 245, 249)
    doc.roundedRect(barX, y, barWidth, 4.4, 2.2, 2.2, 'F')
    if (item.value > 0) {
      doc.setFillColor(...COLORS.brand)
      doc.roundedRect(barX, y, Math.max(4.4, (item.value / moduleMax) * barWidth), 4.4, 2.2, 2.2, 'F')
    }
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.ink)
    text(String(item.value), PAGE.width - PAGE.margin - 12, y + 3.4, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.muted)
    text(`${share}%`, PAGE.width - PAGE.margin, y + 3.4, { align: 'right' })
    y += 8
  })
  y += 6

  /* ── Analyse rédigée ────────────────────────────────────────────────── */
  sectionTitle('Analyse', 'Constats par module')
  autoTable(doc, {
    startY: y,
    margin: { left: PAGE.margin, right: PAGE.margin, top: TOP_CONTINUATION, bottom: 22 },
    head: [['Module', 'Actions', 'Constats']],
    body: insights.map((item) => [
      pdfSafe(item.title),
      String(item.value),
      pdfSafe([...item.lines.map((line) => `- ${line}`), item.note ? item.note : null].filter(Boolean).join('\n')),
    ]),
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 3, right: 3 }, textColor: COLORS.inkSoft, lineColor: COLORS.line, lineWidth: { bottom: 0.2 }, valign: 'top' },
    headStyles: { fillColor: COLORS.brandSoft, textColor: COLORS.brandDark, fontStyle: 'bold', fontSize: 7.5, lineWidth: 0 },
    columnStyles: {
      0: { cellWidth: 34, fontStyle: 'bold', textColor: COLORS.ink },
      1: { cellWidth: 18, halign: 'center', fontStyle: 'bold', textColor: COLORS.brand },
      2: { cellWidth: 'auto', textColor: COLORS.muted },
    },
    rowPageBreak: 'avoid',
  })
  y = doc.lastAutoTable.finalY + 12

  /* ── Journal chronologique ──────────────────────────────────────────── */
  const chronological = [...logs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  sectionTitle('Journal', 'Journal chronologique des opérations', filtersLabel ? `Filtres : ${filtersLabel}` : `${chronological.length} événement(s)`, 36)

  if (chronological.length === 0) {
    ensureSpace(22)
    doc.setFillColor(...COLORS.zebra)
    doc.setDrawColor(...COLORS.line)
    doc.roundedRect(PAGE.margin, y, CONTENT_WIDTH, 18, 2, 2, 'FD')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.muted)
    text("Aucune activité n'a été enregistrée pour la période et les filtres sélectionnés.", PAGE.width / 2, y + 10.5, { align: 'center' })
    y += 26
  } else {
    const groups = new Map()
    chronological.forEach((log) => {
      const key = dayKey(log.createdAt)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(log)
    })

    // Largeurs fixes : chaque journée est un tableau distinct, les colonnes restent alignées.
    const journalColumns = {
      0: { cellWidth: 10, textColor: COLORS.faint, halign: 'center' },
      1: { cellWidth: 14, fontStyle: 'bold', textColor: COLORS.ink },
      2: { cellWidth: 26 },
      3: { cellWidth: 38 },
      4: { cellWidth: CONTENT_WIDTH - 104, textColor: COLORS.muted },
      5: { cellWidth: 16, halign: 'right', textColor: COLORS.faint },
    }
    const journalStyles = { font: 'helvetica', fontSize: 7.8, cellPadding: { top: 2.6, bottom: 2.6, left: 2.6, right: 2.6 }, textColor: COLORS.inkSoft, lineColor: COLORS.line, lineWidth: { bottom: 0.15 }, valign: 'middle', overflow: 'linebreak' }
    const margin = { left: PAGE.margin, right: PAGE.margin, top: TOP_CONTINUATION, bottom: 22 }

    autoTable(doc, {
      startY: y,
      margin,
      head: [['N°', 'Heure', 'Module', 'Opération', 'Description', 'Réf.']],
      body: [],
      theme: 'plain',
      styles: journalStyles,
      headStyles: { fillColor: COLORS.navy, textColor: COLORS.white, fontStyle: 'bold', fontSize: 7.4, lineWidth: 0 },
      columnStyles: journalColumns,
    })
    y = doc.lastAutoTable.finalY

    let counter = 0
    groups.forEach((items, key) => {
      // L'en-tête de journée reste toujours accompagné d'au moins un événement.
      ensureSpace(24)
      const dayTitle = pdfSafe(`${formatDayHeading(key)}  ·  ${items.length} événement${items.length > 1 ? 's' : ''}`)
      const body = items.map((log) => {
        counter += 1
        const operation = OPERATIONS[operationFromAction(log.action)]
        return [
          String(counter).padStart(2, '0'),
          formatTime(log.createdAt),
          pdfSafe(MODULE_SHORT_LABELS[moduleFromLog(log)] || moduleFromLog(log)),
          { content: pdfSafe(ACTION_LABELS[log.action] || log.action), styles: { textColor: operation.rgb, fontStyle: 'bold' } },
          pdfSafe(getDescriptionLabel(log.action, log.description)),
          pdfSafe(log.entityId ? `#${log.entityId}` : '-'),
        ]
      })
      autoTable(doc, {
        startY: y,
        margin,
        head: [[{ content: dayTitle, colSpan: 6 }]],
        body,
        theme: 'plain',
        showHead: 'everyPage',
        styles: journalStyles,
        headStyles: { fillColor: COLORS.brandSoft, textColor: COLORS.brandDark, fontStyle: 'bold', fontSize: 7.8, lineWidth: 0, cellPadding: { top: 2.4, bottom: 2.4, left: 3, right: 3 } },
        columnStyles: journalColumns,
        rowPageBreak: 'avoid',
        didParseCell: (data) => {
          if (data.section === 'body' && data.row.index % 2 === 1) data.cell.styles.fillColor = COLORS.zebra
        },
      })
      y = doc.lastAutoTable.finalY
    })
    y += 10
  }

  /* ── Clôture du rapport ─────────────────────────────────────────────── */
  ensureSpace(24)
  doc.setDrawColor(...COLORS.brandLine)
  doc.setFillColor(...COLORS.brandSoft)
  doc.roundedRect(PAGE.margin, y, CONTENT_WIDTH, 18, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...COLORS.brandDark)
  text('Certification du document', PAGE.margin + 5, y + 7)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.8)
  doc.setTextColor(...COLORS.muted)
  text(`Rapport généré automatiquement à partir du journal d'audit SOMACS (réf. ${reference}).`, PAGE.margin + 5, y + 12.5)

  /* ── En-têtes de continuation et pieds de page (après pagination) ──── */
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    if (page > 1) drawContinuationHeader()
    doc.setDrawColor(...COLORS.line)
    doc.setLineWidth(0.3)
    doc.line(PAGE.margin, PAGE.height - 15, PAGE.width - PAGE.margin, PAGE.height - 15)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...COLORS.inkSoft)
    text('SOMACS', PAGE.margin, PAGE.height - 10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.muted)
    text('Rapport de traçabilité  ·  Document confidentiel', PAGE.margin + 14, PAGE.height - 10)
    doc.setFontSize(6.8)
    doc.setTextColor(...COLORS.faint)
    text(`Réf. ${reference}  ·  Émis le ${formatDateTime(generatedAt)}`, PAGE.margin, PAGE.height - 6)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.brand)
    text(`Page ${page} / ${pageCount}`, PAGE.width - PAGE.margin, PAGE.height - 10, { align: 'right' })
  }

  return doc
}

/** Charge une image (URL Vite) en data URL pour jsPDF ; retourne '' en cas d'échec. */
export async function loadImageAsDataUrl(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) return ''
    const blob = await response.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => resolve('')
      reader.readAsDataURL(blob)
    })
  } catch {
    return ''
  }
}
