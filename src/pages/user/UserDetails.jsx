import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Shield,
  Clock,
  Calendar,
  RotateCcw,
  Zap,
  Cog,
  CheckCircle,
  AlertCircle,
  Activity,
  Eye,
  BarChart3,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { apiFetch } from '../../api/apiClient'
import logoImage from '../../assets/logo-removebg-preview.PNG'

const BUSINESS_ACTIONS = [
  'CREATE_MACHINE',
  'UPDATE_MACHINE',
  'DELETE_MACHINE',
  'CREATE_MISSION',
  'UPDATE_MISSION',
  'DELETE_MISSION',
  'CREATE_INTERVENTION',
  'UPDATE_INTERVENTION',
  'ASSIGN_USER_INTERVENTION',
  'USE_AI_ASSISTANT',
]

const actionBadgeColors = {
  CREATE_MACHINE: 'bg-emerald-100 text-emerald-700',
  UPDATE_MACHINE: 'bg-blue-100 text-blue-700',
  DELETE_MACHINE: 'bg-red-100 text-red-700',
  CREATE_MISSION: 'bg-cyan-100 text-cyan-700',
  UPDATE_MISSION: 'bg-sky-100 text-sky-700',
  DELETE_MISSION: 'bg-rose-100 text-rose-700',
  CREATE_INTERVENTION: 'bg-violet-100 text-violet-700',
  UPDATE_INTERVENTION: 'bg-indigo-100 text-indigo-700',
  ASSIGN_USER_INTERVENTION: 'bg-amber-100 text-amber-700',
  USE_AI_ASSISTANT: 'bg-teal-100 text-teal-700',
}

const actionLabels = {
  CREATE_MACHINE: 'Creation machine',
  UPDATE_MACHINE: 'Modification machine',
  DELETE_MACHINE: 'Suppression machine',
  CREATE_MISSION: 'Creation mission',
  UPDATE_MISSION: 'Modification mission',
  DELETE_MISSION: 'Suppression mission',
  CREATE_INTERVENTION: 'Creation intervention',
  UPDATE_INTERVENTION: 'Modification intervention',
  ASSIGN_USER_INTERVENTION: 'Affectation utilisateur',
  USE_AI_ASSISTANT: 'Assistant IA',
}

const moduleMeta = {
  'Parc Machine - Assistant IA': {
    icon: Zap,
    pill: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  'Parc Machine': {
    icon: Cog,
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  Missions: {
    icon: CheckCircle,
    pill: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  Interventions: {
    icon: AlertCircle,
    pill: 'bg-violet-50 text-violet-700 border-violet-200',
  },
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDateForDisplay(dateString) {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return '-'
  }
}

function getStartOfMonth(date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  return new Date(year, month, 1)
}

function formatDateToISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function moduleFromLog(log) {
  if (log.action === 'USE_AI_ASSISTANT') return 'Parc Machine - Assistant IA'
  if (log.entity === 'MACHINE') return 'Parc Machine'
  if (log.entity === 'MISSION') return 'Missions'
  if (log.entity === 'INTERVENTION') return 'Interventions'
  return log.entity || '-'
}

function getDescriptionLabel(action, description) {
  if (description && description.length > 0 && description !== '-') {
    return description
  }
  return actionLabels[action] || action
}

export default function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [userDetails, setUserDetails] = useState(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [pageError, setPageError] = useState('')

  const today = new Date()
  const startOfMonth = getStartOfMonth(today)
  const [dateStart, setDateStart] = useState(formatDateToISO(startOfMonth))
  const [dateEnd, setDateEnd] = useState(formatDateToISO(today))

  const [auditPage, setAuditPage] = useState(1)
  const [auditLogs, setAuditLogs] = useState({ items: [], total: 0, page: 1, totalPages: 1 })
  const [auditStats, setAuditStats] = useState(null)
  const [isLoadingAudit, setIsLoadingAudit] = useState(false)
  const [auditError, setAuditError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [tablePage, setTablePage] = useState(1)
  const tableRowsPerPage = 6

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoadingUser(true)
      setPageError('')
      try {
        const response = await apiFetch(`/users/${id}`, { auth: true })
        if (!response.ok) {
          setPageError("Impossible de charger les informations de l'utilisateur.")
          return
        }
        const data = await response.json()
        setUserDetails(data)
      } catch {
        setPageError("Erreur lors du chargement des informations de l'utilisateur.")
      } finally {
        setIsLoadingUser(false)
      }
    }

    if (id) fetchUser()
  }, [id])

  useEffect(() => {
    const fetchAudit = async () => {
      if (!id) return
      setIsLoadingAudit(true)
      setAuditError('')
      setAuditPage(1)

      try {
        const baseParams = `&dateStart=${dateStart}&dateEnd=${dateEnd}`

        const [logsResponse, statsResponse] = await Promise.all([
          apiFetch(`/audit-logs/user/${id}?page=1&limit=20${baseParams}`, { auth: true }),
          apiFetch(`/audit-logs/user/${id}/stats?${baseParams.substring(1)}`, { auth: true }),
        ])

        if (!logsResponse.ok || !statsResponse.ok) {
          setAuditError('Impossible de charger la tracabilite de cet utilisateur.')
          return
        }

        const [logsData, statsData] = await Promise.all([
          logsResponse.json(),
          statsResponse.json(),
        ])

        setAuditLogs({
          items: Array.isArray(logsData?.items) ? logsData.items : [],
          total: Number(logsData?.total) || 0,
          page: Number(logsData?.page) || 1,
          totalPages: Number(logsData?.totalPages) || 1,
        })
        setAuditStats(statsData || null)
      } catch {
        setAuditError('Erreur lors du chargement de la tracabilite.')
      } finally {
        setIsLoadingAudit(false)
      }
    }

    fetchAudit()
  }, [id, dateStart, dateEnd, refreshKey])

  useEffect(() => {
    if (auditPage === 1) return

    const fetchNextPage = async () => {
      if (!id) return
      setIsLoadingAudit(true)

      try {
        const baseParams = `&dateStart=${dateStart}&dateEnd=${dateEnd}`
        const response = await apiFetch(`/audit-logs/user/${id}?page=${auditPage}&limit=20${baseParams}`, { auth: true })

        if (!response.ok) return

        const logsData = await response.json()
        setAuditLogs({
          items: Array.isArray(logsData?.items) ? logsData.items : [],
          total: Number(logsData?.total) || 0,
          page: Number(logsData?.page) || 1,
          totalPages: Number(logsData?.totalPages) || 1,
        })
      } catch {
        // Ignore
      } finally {
        setIsLoadingAudit(false)
      }
    }

    fetchNextPage()
  }, [auditPage, id, dateStart, dateEnd])

  const counts = useMemo(() => {
    const map = auditStats?.actionsByType || {}
    return {
      ai: Number(map.USE_AI_ASSISTANT || 0),
      machineCreate: Number(map.CREATE_MACHINE || 0),
      machineUpdate: Number(map.UPDATE_MACHINE || 0),
      machineDelete: Number(map.DELETE_MACHINE || 0),
      missionCreate: Number(map.CREATE_MISSION || 0),
      missionUpdate: Number(map.UPDATE_MISSION || 0),
      missionDelete: Number(map.DELETE_MISSION || 0),
      interventionCreate: Number(map.CREATE_INTERVENTION || 0),
      interventionUpdate: Number(map.UPDATE_INTERVENTION || 0),
      interventionAssign: Number(map.ASSIGN_USER_INTERVENTION || 0),
    }
  }, [auditStats])

  const totalActions = useMemo(
    () =>
      counts.ai +
      counts.machineCreate +
      counts.machineUpdate +
      counts.machineDelete +
      counts.missionCreate +
      counts.missionUpdate +
      counts.missionDelete +
      counts.interventionCreate +
      counts.interventionUpdate +
      counts.interventionAssign,
    [counts],
  )

  const logsForTable = useMemo(
    () => (auditLogs.items || []).filter((item) => BUSINESS_ACTIONS.includes(item.action)),
    [auditLogs.items],
  )

  const totalTablePages = useMemo(
    () => Math.max(1, Math.ceil(logsForTable.length / tableRowsPerPage)),
    [logsForTable.length],
  )

  const paginatedLogsForTable = useMemo(() => {
    const startIndex = (tablePage - 1) * tableRowsPerPage
    return logsForTable.slice(startIndex, startIndex + tableRowsPerPage)
  }, [logsForTable, tablePage])

  useEffect(() => {
    setTablePage(1)
  }, [logsForTable.length, dateStart, dateEnd, refreshKey])

  useEffect(() => {
    if (tablePage > totalTablePages) {
      setTablePage(totalTablePages)
    }
  }, [tablePage, totalTablePages])

  const handleDateStartChange = (e) => setDateStart(e.target.value)
  const handleDateEndChange = (e) => setDateEnd(e.target.value)

  const handleResetDates = () => {
    const now = new Date()
    setDateStart(formatDateToISO(getStartOfMonth(now)))
    setDateEnd(formatDateToISO(now))
  }

  const handleRefresh = () => setRefreshKey((v) => v + 1)

  const handleExportPdf = () => {
    if (!userDetails) return

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const periodStart = formatDateForDisplay(dateStart)
    const periodEnd = formatDateForDisplay(dateEnd)

    const primaryColor = [0, 82, 204]
    const lightGrey = [248, 250, 252]
    const darkText = [30, 41, 59]
    const mediumText = [100, 116, 139]

    // En-tete premium
    doc.setFillColor(0, 70, 180)
    doc.rect(0, 0, pageWidth, 40, 'F')
    doc.setFillColor(...primaryColor)
    doc.rect(0, 40, pageWidth, 4, 'F')

    // Cartouche logo
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(10, 6, 30, 30, 3, 3, 'F')
    try {
      doc.addImage(logoImage, 'PNG', 12, 8, 26, 26)
    } catch (err) {
      console.warn('Logo non disponible:', err)
    }

    // Titre et metadonnees
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(17)
    doc.text('Rapport de Tracabilite Metier', 46, 16)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Utilisateur: ${userDetails.name || '-'}`, 46, 23)
    doc.text(`Periode: ${periodStart} au ${periodEnd}`, 46, 29)
    doc.text(`Genere le ${new Date().toLocaleString('fr-FR')}`, 46, 35)

    // Section Informations utilisateur
    let yPos = 52
    doc.setTextColor(...darkText)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Informations Utilisateur', 14, yPos)

    const infoStartY = yPos + 8
    const lineHeight = 6
    const leftLabelX = 14
    const leftValueX = 32
    const rightLabelX = 108
    const rightValueX = 136

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...mediumText)
    doc.text('Nom:', leftLabelX, infoStartY)
    doc.setTextColor(...darkText)
    doc.setFont('helvetica', 'bold')
    doc.text(`${userDetails.name || '-'}`, leftValueX, infoStartY)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...mediumText)
    doc.text('Email:', leftLabelX, infoStartY + lineHeight)
    doc.setTextColor(...darkText)
    doc.setFont('helvetica', 'bold')
    doc.text(`${userDetails.email || '-'}`, leftValueX, infoStartY + lineHeight)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...mediumText)
    doc.text('Rôle:', rightLabelX, infoStartY)
    doc.setTextColor(...darkText)
    doc.setFont('helvetica', 'bold')
    doc.text(`${userDetails.role || '-'}`, rightValueX, infoStartY)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...mediumText)
    doc.text('Période analysée:', rightLabelX, infoStartY + lineHeight)
    doc.setTextColor(...darkText)
    doc.setFont('helvetica', 'bold')
    doc.text(`${periodStart} au ${periodEnd}`, rightValueX, infoStartY + lineHeight)

    yPos = infoStartY + lineHeight + 12

    // Section Statistiques (format carte similaire a l'interface)
    doc.setTextColor(...darkText)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Résumé des Statistiques Métier', 14, yPos)

    const statsCards = [
      {
        title: 'Assistant IA',
        value: counts.ai,
        lines: [
          counts.ai === 0
            ? "L'Assistant IA de diagnostic n'a pas ete utilise durant cette periode."
            : counts.ai === 1
              ? "Cet utilisateur a utilise l'Assistant IA de diagnostic 1 fois durant cette periode."
              : `Cet utilisateur a utilise l'Assistant IA de diagnostic ${counts.ai} fois durant cette periode.`,
        ],
      },
      {
        title: 'Parc Machines',
        value: counts.machineCreate + counts.machineUpdate + counts.machineDelete,
        lines: [
          counts.machineCreate === 0
            ? "Aucune creation de machine n'a ete enregistree durant cette periode."
            : counts.machineCreate === 1
              ? 'Une nouvelle machine a ete creee par cet utilisateur.'
              : `${counts.machineCreate} creations de machines ont ete enregistrees durant cette periode.`,
          counts.machineUpdate === 0
            ? "Aucune modification de machine n'a ete enregistree durant cette periode."
            : counts.machineUpdate === 1
              ? 'Une machine a ete modifiee par cet utilisateur.'
              : `${counts.machineUpdate} modifications de machines ont ete enregistrees durant cette periode.`,
          counts.machineDelete === 0
            ? "Aucune suppression de machine n'a ete enregistree durant cette periode."
            : counts.machineDelete === 1
              ? 'Une machine a ete supprimee par cet utilisateur.'
              : `${counts.machineDelete} suppressions de machines ont ete enregistrees durant cette periode.`,
        ],
      },
      {
        title: 'Missions',
        value: counts.missionCreate + counts.missionUpdate + counts.missionDelete,
        lines: [
          counts.missionCreate === 0
            ? "Aucune creation de mission n'a ete enregistree durant cette periode."
            : counts.missionCreate === 1
              ? 'Une nouvelle mission a ete creee par cet utilisateur.'
              : `${counts.missionCreate} creations de missions ont ete enregistrees durant cette periode.`,
          counts.missionUpdate === 0
            ? "Aucune modification de mission n'a ete enregistree durant cette periode."
            : counts.missionUpdate === 1
              ? 'Une mission a ete modifiee par cet utilisateur.'
              : `${counts.missionUpdate} modifications de missions ont ete enregistrees durant cette periode.`,
          counts.missionDelete === 0
            ? "Aucune suppression de mission n'a ete enregistree durant cette periode."
            : counts.missionDelete === 1
              ? 'Une mission a ete supprimee par cet utilisateur.'
              : `${counts.missionDelete} suppressions de missions ont ete enregistrees durant cette periode.`,
        ],
      },
      {
        title: 'Interventions',
        value: counts.interventionCreate + counts.interventionUpdate + counts.interventionAssign,
        lines: [
          counts.interventionCreate === 0
            ? "Aucune creation d'intervention n'a ete enregistree durant cette periode."
            : counts.interventionCreate === 1
              ? 'Une nouvelle intervention a ete creee par cet utilisateur.'
              : `${counts.interventionCreate} creations d'interventions ont ete enregistrees durant cette periode.`,
          counts.interventionUpdate === 0
            ? "Aucune modification d'intervention n'a ete detectee pour cette periode."
            : counts.interventionUpdate === 1
              ? 'Une intervention a ete modifiee par cet utilisateur.'
              : `${counts.interventionUpdate} modifications d'interventions ont ete detectees pour cette periode.`,
          counts.interventionAssign === 0
            ? "Aucune affectation d'utilisateur n'a ete enregistree durant cette periode."
            : counts.interventionAssign === 1
              ? 'Un utilisateur a ete affecte a une intervention durant cette periode.'
              : `${counts.interventionAssign} affectations d'utilisateurs ont ete enregistrees durant cette periode.`,
        ],
      },
    ]

    const cardPairs = [
      [statsCards[0], statsCards[1]],
      [statsCards[2], statsCards[3]],
    ]
    const cardStartY = yPos + 8
    const cardGapX = 6
    const cardGapY = 6
    const cardXLeft = 12
    const cardWidth = (pageWidth - 24 - cardGapX) / 2

    const drawStatsCard = (card, x, y, width, height, fillColor, borderColor) => {
      doc.setFillColor(...fillColor)
      doc.setDrawColor(...borderColor)
      doc.roundedRect(x, y, width, height, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...darkText)
      doc.text(card.title, x + 4, y + 7)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(...primaryColor)
      doc.text(String(card.value), x + 4, y + 14)

      let lineY = y + 20
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...mediumText)
      card.lines.forEach((line) => {
        const wrapped = doc.splitTextToSize(`- ${line}`, width - 8)
        doc.text(wrapped, x + 4, lineY)
        lineY += wrapped.length * 4.3
      })
    }

    yPos = cardStartY
    cardPairs.forEach((pair, rowIndex) => {
      const [leftCard, rightCard] = pair
      const leftHeight = 24 + leftCard.lines.reduce((sum, line) => sum + doc.splitTextToSize(line, cardWidth - 8).length * 4.3, 0)
      const rightHeight = 24 + rightCard.lines.reduce((sum, line) => sum + doc.splitTextToSize(line, cardWidth - 8).length * 4.3, 0)
      const rowHeight = Math.max(leftHeight, rightHeight)

      if (yPos + rowHeight > pageHeight - 30) {
        doc.addPage()
        yPos = 22
      }

      const leftPalette = rowIndex === 0 ? { fill: [240, 253, 250], border: [153, 246, 228] } : { fill: [236, 254, 255], border: [165, 243, 252] }
      const rightPalette = rowIndex === 0 ? { fill: [236, 253, 245], border: [167, 243, 208] } : { fill: [245, 243, 255], border: [221, 214, 254] }

      drawStatsCard(leftCard, cardXLeft, yPos, cardWidth, rowHeight, leftPalette.fill, leftPalette.border)
      drawStatsCard(rightCard, cardXLeft + cardWidth + cardGapX, yPos, cardWidth, rowHeight, rightPalette.fill, rightPalette.border)

      yPos += rowHeight + cardGapY
    })

    // Total actions
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(0.5)
    doc.line(10, yPos, pageWidth - 10, yPos)

    yPos += 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...primaryColor)
    doc.text(`Total des actions: ${totalActions}`, 14, yPos)

    // Historique des actions
    yPos += 10
    const rows = logsForTable.map((item) => [
      formatDateForDisplay(item.createdAt?.split('T')[0] || ''),
      item.createdAt?.split('T')[1]?.slice(0, 5) || '',
      moduleFromLog(item),
      actionLabels[item.action] || item.action,
    ])

    if (rows.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Heure', 'Module', 'Action']],
        body: rows,
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          textColor: darkText,
          lineColor: [226, 232, 240],
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left',
        },
        alternateRowStyles: {
          fillColor: lightGrey,
        },
        margin: { left: 10, right: 10, bottom: 15 },
        didDrawPage: (data) => {
          // Pied de page
          const pageCount = doc.internal.pages.length
          const currentPage = data.pageNumber

          doc.setFontSize(8)
          doc.setTextColor(...mediumText)
          doc.text(
            `Page ${currentPage} sur ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          )

          doc.setFontSize(7)
          doc.text(
            `Généré le ${new Date().toLocaleString('fr-FR')}`,
            pageWidth / 2,
            pageHeight - 5,
            { align: 'center' }
          )
        },
      })
    }

    doc.save(`rapport-tracabilite-${userDetails.name || 'user'}-${dateStart}-to-${dateEnd}.pdf`)
  }

  const noActivity = totalActions === 0

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 to-slate-100/70 p-5 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="h-10 w-10 rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 hover:shadow-sm"
            title="Retour"
          >
            <ArrowLeft size={18} className="mx-auto" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 lg:text-3xl">Historique des activités</h1>
            <p className="text-sm font-medium text-slate-500">Traçabilite métier et historique des actions de l'utilisateur.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            title="Actualiser la section traçabilité"
          >
            <RefreshCw size={15} />
            Actualiser
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0052CC] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#0052CC]/25 transition hover:bg-[#0042a3]"
          >
            <Download size={15} />
            Exporter PDF
          </button>
        </div>
      </div>

      {pageError && (
        <div className="inline-flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{pageError}</span>
        </div>
      )}

      {isLoadingUser ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Chargement utilisateur...</div>
      ) : userDetails && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="md:col-span-2 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0052CC] to-blue-700 text-xl font-black text-white shadow-md">
                  {String(userDetails.name || 'U').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900">{userDetails.name || '-'}</p>
                  <p className="truncate text-sm text-slate-500">{userDetails.email || '-'}</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-slate-800">
                  <Shield size={14} className="text-[#0052CC]" />
                  {userDetails.role || '-'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Derniere connexion</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-slate-800">
                  <Clock size={14} className="text-[#0052CC]" />
                  {formatDateTime(userDetails.lastLogin)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="w-full flex-1">
                <h3 className="mb-4 inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700">
                  <Calendar size={16} className="text-[#0052CC]" />
                  Selectionner la periode
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col">
                    <label htmlFor="dateStart" className="mb-2 text-xs font-bold text-slate-700">Date de debut</label>
                    <input
                      id="dateStart"
                      type="date"
                      value={dateStart}
                      onChange={handleDateStartChange}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 focus:border-[#0052CC] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/25"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="dateEnd" className="mb-2 text-xs font-bold text-slate-700">Date de fin</label>
                    <input
                      id="dateEnd"
                      type="date"
                      value={dateEnd}
                      onChange={handleDateEndChange}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 focus:border-[#0052CC] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/25"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetDates}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
                >
                  <RotateCcw size={14} />
                  Reinitialiser
                </button>
              </div>

              <div className="rounded-xl border border-[#0052CC]/25 bg-[#0052CC]/8 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-[#0052CC]">Periode analysee</p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  du {formatDateForDisplay(dateStart)} au {formatDateForDisplay(dateEnd)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="inline-flex items-center gap-2 text-lg font-black uppercase tracking-widest text-slate-800">
                <BarChart3 size={18} className="text-[#0052CC]" />
                Statistiques metier
              </h2>
              <div className="inline-flex items-center gap-2 rounded-lg border border-[#0052CC]/20 bg-[#0052CC]/5 px-3 py-1.5 text-xs font-semibold text-[#0052CC]">
                <Sparkles size={14} />
                {totalActions} action(s) sur la periode
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 transition hover:shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-black uppercase tracking-widest text-slate-600">Assistant IA</p>
                  <span className="rounded-md bg-teal-100 px-2 py-1 text-xs font-bold text-teal-700">{counts.ai}</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-700">
                  {counts.ai === 0
                    ? "- L'Assistant IA de diagnostic n'a pas ete utilise durant cette periode."
                    : counts.ai === 1
                      ? "- Cet utilisateur a utilise l'Assistant IA de diagnostic 1 fois durant la periode selectionnee."
                      : `- Cet utilisateur a utilise l'Assistant IA de diagnostic ${counts.ai} fois durant la periode selectionnee.`}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 transition hover:shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-black uppercase tracking-widest text-slate-600">Parc Machines</p>
                  <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                    {counts.machineCreate + counts.machineUpdate + counts.machineDelete}
                  </span>
                </div>
                <div className="space-y-1 text-sm leading-relaxed text-slate-700">
                  <p>- {counts.machineCreate === 0 ? "Aucune creation de machine n'a ete enregistree durant cette periode." : counts.machineCreate === 1 ? 'Une nouvelle machine a ete creee par cet utilisateur.' : `${counts.machineCreate} creations de machines ont ete enregistrees durant cette periode.`}</p>
                  <p>- {counts.machineUpdate === 0 ? "Aucune modification de machine n'a ete enregistree durant cette periode." : counts.machineUpdate === 1 ? 'Une machine a ete modifiee par cet utilisateur.' : `${counts.machineUpdate} modifications de machines ont ete enregistrees durant cette periode.`}</p>
                  <p>- {counts.machineDelete === 0 ? "Aucune suppression de machine n'a ete enregistree durant cette periode." : counts.machineDelete === 1 ? 'Une machine a ete supprimee par cet utilisateur.' : `${counts.machineDelete} suppressions de machines ont ete enregistrees durant cette periode.`}</p>
                </div>
              </div>

              <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 transition hover:shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-black uppercase tracking-widest text-slate-600">Missions</p>
                  <span className="rounded-md bg-cyan-100 px-2 py-1 text-xs font-bold text-cyan-700">
                    {counts.missionCreate + counts.missionUpdate + counts.missionDelete}
                  </span>
                </div>
                <div className="space-y-1 text-sm leading-relaxed text-slate-700">
                  <p>- {counts.missionCreate === 0 ? "Aucune creation de mission n'a ete enregistree durant cette periode." : counts.missionCreate === 1 ? 'Une nouvelle mission a ete creee par cet utilisateur.' : `${counts.missionCreate} creations de missions ont ete enregistrees durant cette periode.`}</p>
                  <p>- {counts.missionUpdate === 0 ? "Aucune modification de mission n'a ete enregistree durant cette periode." : counts.missionUpdate === 1 ? 'Une mission a ete modifiee par cet utilisateur.' : `${counts.missionUpdate} modifications de missions ont ete enregistrees durant cette periode.`}</p>
                  <p>- {counts.missionDelete === 0 ? "Aucune suppression de mission n'a ete enregistree durant cette periode." : counts.missionDelete === 1 ? 'Une mission a ete supprimee par cet utilisateur.' : `${counts.missionDelete} suppressions de missions ont ete enregistrees durant cette periode.`}</p>
                </div>
              </div>

              <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 transition hover:shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-black uppercase tracking-widest text-slate-600">Interventions</p>
                  <span className="rounded-md bg-violet-100 px-2 py-1 text-xs font-bold text-violet-700">
                    {counts.interventionCreate + counts.interventionUpdate + counts.interventionAssign}
                  </span>
                </div>
                <div className="space-y-1 text-sm leading-relaxed text-slate-700">
                  <p>- {counts.interventionCreate === 0 ? "Aucune creation d'intervention n'a ete enregistree durant cette periode." : counts.interventionCreate === 1 ? 'Une nouvelle intervention a ete creee par cet utilisateur.' : `${counts.interventionCreate} creations d'interventions ont ete enregistrees durant cette periode.`}</p>
                  <p>- {counts.interventionUpdate === 0 ? "Aucune modification d'intervention n'a ete detectee pour cette periode." : counts.interventionUpdate === 1 ? 'Une intervention a ete modifiee par cet utilisateur.' : `${counts.interventionUpdate} modifications d'interventions ont ete detectees pour cette periode.`}</p>
                  <p>- {counts.interventionAssign === 0 ? "Aucune affectation d'utilisateur n'a ete enregistree durant cette periode." : counts.interventionAssign === 1 ? 'Un utilisateur a ete affecte a une intervention durant cette periode.' : `${counts.interventionAssign} affectations d'utilisateurs ont ete enregistrees durant cette periode.`}</p>
                </div>
              </div>
            </div>

            {noActivity && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                <p className="text-sm font-medium">Aucune activite n'a ete enregistree pour cet utilisateur durant la periode selectionnee.</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-black uppercase tracking-widest text-slate-800">
              <Activity size={18} className="text-[#0052CC]" />
              Historique des actions
            </h2>

            {auditError && (
              <div className="mb-4 inline-flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{auditError}</span>
              </div>
            )}

            {isLoadingAudit ? (
              <div className="py-8 text-center text-slate-500">Chargement de l'historique...</div>
            ) : logsForTable.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                <Eye size={26} className="mx-auto mb-2 text-slate-400" />
                <p className="font-medium">Aucune activite n'a ete enregistree pour la periode selectionnee.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[980px]">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">Date</th>
                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">Heure</th>
                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">Module</th>
                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">Action</th>
                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedLogsForTable.map((log) => {
                        const moduleName = moduleFromLog(log)
                        const meta = moduleMeta[moduleName]
                        const ModuleIcon = meta?.icon
                        return (
                          <tr key={log.id} className="transition-colors hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                              {formatDateForDisplay(log.createdAt?.split('T')[0] || '')}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-600">{formatTime(log.createdAt)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${meta?.pill || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                {ModuleIcon ? <ModuleIcon size={13} /> : <Activity size={13} />}
                                {moduleName}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                title={actionLabels[log.action] || log.action}
                                className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-black ${actionBadgeColors[log.action] || 'bg-slate-100 text-slate-700'}`}
                              >
                                {actionLabels[log.action] || log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{getDescriptionLabel(log.action, log.description)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-slate-500">
                    {logsForTable.length === 0
                      ? 'Aucun evenement'
                      : `Page ${tablePage} sur ${totalTablePages} • ${logsForTable.length} evenement(s) affiché(s)`}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTablePage((prev) => Math.max(1, prev - 1))}
                      disabled={tablePage <= 1}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ← Precedent
                    </button>
                    <button
                      type="button"
                      onClick={() => setTablePage((prev) => Math.min(totalTablePages, prev + 1))}
                      disabled={tablePage >= totalTablePages}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Suivant →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
