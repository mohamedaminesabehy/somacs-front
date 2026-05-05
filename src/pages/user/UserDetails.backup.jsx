import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Shield, Clock, Calendar, RotateCcw, Zap, Cog, CheckCircle, AlertCircle, Activity, TrendingUp, RefreshCw, Wrench, ListTodo } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { apiFetch } from '../../api/apiClient'

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
  CREATE_MACHINE: 'Création machine',
  UPDATE_MACHINE: 'Modification machine',
  DELETE_MACHINE: 'Suppression machine',
  CREATE_MISSION: 'Création mission',
  UPDATE_MISSION: 'Modification mission',
  DELETE_MISSION: 'Suppression mission',
  CREATE_INTERVENTION: 'Création intervention',
  UPDATE_INTERVENTION: 'Modification intervention',
  ASSIGN_USER_INTERVENTION: 'Affectation utilisateur',
  USE_AI_ASSISTANT: 'Assistant IA',
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
@@role and login info
  if (log.entity === 'MACHINE') return 'Parc Machine'
  if (log.entity === 'MISSION') return 'Missions'
  if (log.entity === 'INTERVENTION') return 'Interventions'
  return log.entity || '-'
}

function getDescriptionLabel(action, description) {
  // Utilise la description stockée en base si elle existe, sinon utilise un label par défaut
  if (description && description.length > 0 && description !== '-') {
    return description
  }
  return actionLabels[action] || action
}

export default function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  // État utilisateur
  const [userDetails, setUserDetails] = useState(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [pageError, setPageError] = useState('')

  // État filtrage par date (calendrier)
  const today = new Date()
  const startOfMonth = getStartOfMonth(today)
  const [dateStart, setDateStart] = useState(formatDateToISO(startOfMonth))
  const [dateEnd, setDateEnd] = useState(formatDateToISO(today))

  // État audit
  const [auditPage, setAuditPage] = useState(1)
  const [auditLogs, setAuditLogs] = useState({ items: [], total: 0, page: 1, totalPages: 1 })
  const [auditStats, setAuditStats] = useState(null)
  const [isLoadingAudit, setIsLoadingAudit] = useState(false)
  const [auditError, setAuditError] = useState('')

  // Récupère les détails utilisateur
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

    if (id) {
      fetchUser()
    }
  }, [id])

  // Récupère les logs et stats audit
  useEffect(() => {
    const fetchAudit = async () => {
      if (!id) return
      setIsLoadingAudit(true)
      setAuditError('')
      setAuditPage(1) // Réinitialise la page

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
  }, [id, dateStart, dateEnd])

  // Récupère la page suivante
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
  }, [auditPage, dateStart, dateEnd, id])

  // Statistiques calculées
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

  const logsForTable = useMemo(
    () => (auditLogs.items || []).filter((item) => BUSINESS_ACTIONS.includes(item.action)),
    [auditLogs.items],
  )

  // Gère le changement de dates
  const handleDateStartChange = (e) => {
    setDateStart(e.target.value)
  }

  const handleDateEndChange = (e) => {
    setDateEnd(e.target.value)
  }

  const handleResetDates = () => {
    const today = new Date()
    const startOfMonth = getStartOfMonth(today)
    setDateStart(formatDateToISO(startOfMonth))
    setDateEnd(formatDateToISO(today))
  }

  const handleExportPdf = () => {
    if (!userDetails) return

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const periodStart = formatDateForDisplay(dateStart)
    const periodEnd = formatDateForDisplay(dateEnd)

    doc.setFillColor(0, 82, 204)
    doc.rect(0, 0, 210, 24, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text('SOMACS - Rapport de tracabilite metier', 14, 15)

    doc.setTextColor(33, 37, 41)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Utilisateur: ${userDetails.name || '-'}`, 14, 34)
    doc.text(`Email: ${userDetails.email || '-'}`, 14, 41)
    doc.text(`Role: ${userDetails.role || '-'}`, 14, 48)
    doc.text(`Periode: du ${periodStart} au ${periodEnd}`, 14, 55)

    doc.setFont('helvetica', 'bold')
    doc.text('Statistiques metier', 14, 66)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    let yPos = 73
    const stats = [
      { label: 'Assistant IA', value: counts.ai, positive: 'Cet utilisateur a utilise l\'Assistant IA de diagnostic {count} fois.', negative: 'L\'Assistant IA de diagnostic n\'a pas ete utilise durant cette periode.' },
      { label: 'Machines creees', value: counts.machineCreate, positive: '{count} machine(s) a/ont ete creee(s).', negative: 'Aucune creation de machine n\'a ete enregistree.' },
      { label: 'Machines modifiees', value: counts.machineUpdate, positive: '{count} machine(s) a/ont ete modifiee(s).', negative: 'Aucune modification de machine n\'a ete enregistree.' },
      { label: 'Machines supprimees', value: counts.machineDelete, positive: '{count} machine(s) a/ont ete supprimee(s).', negative: 'Aucune suppression de machine n\'a ete enregistree.' },
    ]

    stats.forEach((stat) => {
      const text = stat.value > 0 ? stat.positive.replace('{count}', stat.value) : stat.negative
      doc.text(`• ${text}`, 14, yPos)
      yPos += 5
    })

    const rows = logsForTable.map((item) => [
      formatDateForDisplay(item.createdAt?.split('T')[0] || ''),
      item.createdAt?.split('T')[1]?.slice(0, 5) || '',
      moduleFromLog(item),
      actionLabels[item.action] || item.action,
      String(item.description || '-').slice(0, 80),
    ])

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Date', 'Heure', 'Module', 'Action', 'Description']],
      body: rows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 82, 204] },
      margin: { left: 10, right: 10 },
    })

    doc.save(`rapport-tracabilite-${userDetails.name || 'user'}-${dateStart}-to-${dateEnd}.pdf`)
  }

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors"
            title="Retour"
          >
            <ArrowLeft size={18} className="text-slate-700" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Détails utilisateur</h1>
            <p className="text-sm text-slate-500 font-medium">Tracabilité métier détaillée et professionnelle.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExportPdf}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0052CC] hover:bg-[#0042a3] text-white font-bold text-sm shadow-lg shadow-[#0052CC]/20 transition-colors"
        >
          <Download size={16} />
          Exporter PDF
        </button>
      </div>

      {pageError && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700 inline-flex gap-2 items-start">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{pageError}</span>
        </div>
      )}

      {isLoadingUser ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">Chargement utilisateur...</div>
      ) : userDetails && (
        <>
          {/* Profil utilisateur */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0052CC] to-blue-700 text-white font-black flex items-center justify-center text-xl flex-shrink-0">
                  {String(userDetails.name || 'U').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900">{userDetails.name || '-'}</p>
                  <p className="text-sm text-slate-500 truncate">{userDetails.email || '-'}</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Rôle</p>
                <p className="text-sm font-bold text-slate-800 mt-2 inline-flex items-center gap-1.5">
                  <Shield size={14} className="text-[#0052CC]" />
                  {userDetails.role || '-'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Dernière connexion</p>
                <p className="text-sm font-bold text-slate-800 mt-2 inline-flex items-center gap-1.5">
                  <Clock size={14} className="text-[#0052CC]" />
                  {formatDateTime(userDetails.lastLogin)}
                </p>
              </div>
            </div>
          </div>

          {/* Filtres dates (calendrier) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6 justify-between">
              <div className="flex-1 w-full">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 mb-4 flex items-center gap-2">
                  <Calendar size={16} className="text-[#0052CC]" />
                  Sélectionner la période
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label htmlFor="dateStart" className="text-xs font-bold text-slate-600 mb-2">
                      Date de début
                    </label>
                    <input
                      id="dateStart"
                      type="date"
                      value={dateStart}
                      onChange={handleDateStartChange}
                        className="px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 focus:border-[#0052CC] cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="dateEnd" className="text-xs font-bold text-slate-600 mb-2">
                      Date de fin
                    </label>
                    <input
                      id="dateEnd"
                      type="date"
                      value={dateEnd}
                      onChange={handleDateEndChange}
                        className="px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 focus:border-[#0052CC] cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetDates}
                    className="mt-4 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs uppercase tracking-wide transition-all"
                  title="Réinitialiser à la période actuelle"
                >
                  <RotateCcw size={14} />
                  Réinitialiser
                </button>
              </div>

              <div className="flex flex-col items-start lg:items-end gap-2 bg-[#0052CC]/10 rounded-lg border border-[#0052CC]/20 p-4">
                  <span className="text-xs uppercase tracking-widest font-black text-[#0052CC]">Période analysée</span>
                  <span className="text-base font-bold text-slate-900">
                  du {formatDateForDisplay(dateStart)} au {formatDateForDisplay(dateEnd)}
                </span>
              </div>
            </div>
          </div>

          {/* Statistiques métier - TOUJOURS AFFICHÉES */}
          <div>
            <h2 className="text-lg font-black uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2">
              <Zap size={18} className="text-[#0052CC]" />
              Statistiques métier
            </h2>

            <div className="space-y-3">
              {/* Assistant IA */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap size={16} className="text-teal-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black uppercase tracking-widest text-slate-600 mb-1">Assistant IA</p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {counts.ai === 0
                        ? "L'Assistant IA de diagnostic n'a pas été utilisé durant cette période."
                        : counts.ai === 1
                          ? 'Cet utilisateur a utilisé l\'Assistant IA de diagnostic 1 fois.'
                          : `Cet utilisateur a utilisé l'Assistant IA de diagnostic ${counts.ai} fois.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parc Machines */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Cog size={16} className="text-emerald-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black uppercase tracking-widest text-slate-600 mb-2">Parc Machines</p>
                    <div className="space-y-1 text-sm text-slate-700">
                      <p>
                        {counts.machineCreate === 0
                          ? 'Aucune création de machine n\'a été enregistrée durant cette période.'
                          : counts.machineCreate === 1
                            ? 'Une machine a été créée durant cette période.'
                            : `${counts.machineCreate} machines ont été créées durant cette période.`}
                      </p>
                      <p>
                        {counts.machineUpdate === 0
                          ? 'Aucune modification de machine n\'a été enregistrée durant cette période.'
                          : counts.machineUpdate === 1
                            ? 'Une machine a été modifiée durant cette période.'
                            : `${counts.machineUpdate} machines ont été modifiées durant cette période.`}
                      </p>
                      <p>
                        {counts.machineDelete === 0
                          ? 'Aucune suppression de machine n\'a été enregistrée durant cette période.'
                          : counts.machineDelete === 1
                            ? 'Une machine a été supprimée durant cette période.'
                            : `${counts.machineDelete} machines ont été supprimées durant cette période.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Missions */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle size={16} className="text-cyan-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black uppercase tracking-widest text-slate-600 mb-2">Missions</p>
                    <div className="space-y-1 text-sm text-slate-700">
                      <p>
                        {counts.missionCreate === 0
                          ? 'Aucune nouvelle mission n\'a été créée durant cette période.'
                          : counts.missionCreate === 1
                            ? 'Une mission a été créée durant cette période.'
                            : `${counts.missionCreate} missions ont été créées durant cette période.`}
                      </p>
                      <p>
                        {counts.missionUpdate === 0
                          ? 'Aucune modification de mission n\'a été enregistrée durant cette période.'
                          : counts.missionUpdate === 1
                            ? 'Une mission a été modifiée durant cette période.'
                            : `${counts.missionUpdate} missions ont été modifiées durant cette période.`}
                      </p>
                      <p>
                        {counts.missionDelete === 0
                          ? 'Aucune suppression de mission n\'a été enregistrée durant cette période.'
                          : counts.missionDelete === 1
                            ? 'Une mission a été supprimée durant cette période.'
                            : `${counts.missionDelete} missions ont été supprimées durant cette période.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interventions */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle size={16} className="text-violet-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black uppercase tracking-widest text-slate-600 mb-2">Interventions</p>
                    <div className="space-y-1 text-sm text-slate-700">
                      <p>
                        {counts.interventionCreate === 0
                          ? 'Aucune nouvelle intervention n\'a été créée durant cette période.'
                          : counts.interventionCreate === 1
                            ? 'Une intervention a été créée durant cette période.'
                            : `${counts.interventionCreate} interventions ont été créées durant cette période.`}
                      </p>
                      <p>
                        {counts.interventionUpdate === 0
                          ? 'Aucune modification d\'intervention n\'a été enregistrée durant cette période.'
                          : counts.interventionUpdate === 1
                            ? 'Une intervention a été modifiée durant cette période.'
                            : `${counts.interventionUpdate} interventions ont été modifiées durant cette période.`}
                      </p>
                      <p>
                        {counts.interventionAssign === 0
                          ? 'Aucune affectation d\'utilisateur n\'a été enregistrée durant cette période.'
                          : counts.interventionAssign === 1
                            ? 'Un utilisateur a été affecté à une intervention durant cette période.'
                            : `${counts.interventionAssign} utilisateurs ont été affectés à des interventions durant cette période.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message global si aucune activité */}
              {counts.ai === 0 &&
                counts.machineCreate === 0 &&
                counts.machineUpdate === 0 &&
                counts.machineDelete === 0 &&
                counts.missionCreate === 0 &&
                counts.missionUpdate === 0 &&
                counts.missionDelete === 0 &&
                counts.interventionCreate === 0 &&
                counts.interventionUpdate === 0 &&
                counts.interventionAssign === 0 && (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center text-slate-500 mt-4">
                    <p className="text-sm font-medium">Aucune activité n'a été enregistrée pour cet utilisateur durant la période sélectionnée.</p>
                  </div>
                )}
            </div>
          </div>

          {/* Tableau historique */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-black uppercase tracking-widest text-slate-800 mb-4">Historique des actions</h2>

            {auditError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700 inline-flex gap-2 items-start">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{auditError}</span>
              </div>
            )}

            {isLoadingAudit ? (
              <div className="text-center py-8 text-slate-500">Chargement de l'historique...</div>
            ) : logsForTable.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>Aucune activité n'a été enregistrée pour cet utilisateur durant cette période.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest font-black text-slate-400">Date</th>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest font-black text-slate-400">Heure</th>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest font-black text-slate-400">Module</th>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest font-black text-slate-400">Action</th>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest font-black text-slate-400">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logsForTable.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                            {formatDateForDisplay(log.createdAt?.split('T')[0] || '')}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                            {formatTime(log.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-700">{moduleFromLog(log)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-black whitespace-nowrap ${
                                actionBadgeColors[log.action] || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {actionLabels[log.action] || log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {getDescriptionLabel(log.action, log.description)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
                  <span className="text-sm text-slate-500">
                    {auditLogs.total === 0
                      ? 'Aucun événement'
                      : `Page ${auditLogs.page} sur ${auditLogs.totalPages} • ${auditLogs.total} événement(s) au total`}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
                      disabled={auditLogs.page <= 1}
                      className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Précédent
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuditPage((prev) => Math.min(auditLogs.totalPages || 1, prev + 1))}
                      disabled={auditLogs.page >= auditLogs.totalPages}
                      className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
