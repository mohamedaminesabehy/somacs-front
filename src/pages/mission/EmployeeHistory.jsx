import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, Building2, Calendar, CheckCircle2, Edit3, Eye, Hash, History, Search, User, Wrench, X } from 'lucide-react'
import { apiFetch } from '../../api/apiClient'
import logo from '../../assets/logo.jpg'
import FichePreviewFrame from '../../components/intervention/FichePreviewFrame'
import {
  INTERVENTION_STATUS_BADGE as statusBadgeByStatus,
  buildAssignedEmployeesDisplay,
  mapRawToInterventionData,
} from '../../utils/intervention'

function getAuthUser() {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem('auth_user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function normalizeIntervention(row) {
  const status = row?.status || ''
  const technicianName =
    row?.technicianName ||
    row?.assignedTo ||
    row?.assignee ||
    row?.technician ||
    ''
  const clientName =
    row?.clientName ||
    row?.client ||
    row?.clientEntity?.name ||
    ''
  const machine =
    row?.machineType ||
    row?.machineModel ||
    row?.machine ||
    ''
  const siteName = row?.siteName || row?.site || ''
  const interventionDate = row?.interventionDate || row?.date || ''
  const ficheNumber = row?.ficheNumber || ''

  return {
    id: row?.id,
    status,
    technicianName,
    assignedEmployeesDisplay: row?.assignedEmployeesDisplay || technicianName,
    missionId: row?.missionId || null,
    clientName,
    machine,
    siteName,
    interventionDate,
    ficheNumber,
    raw: row,
  }
}

function InterventionPreview({ intervention }) {
  const data = intervention?.raw || {}
  const parts = Array.isArray(data.parts) ? data.parts : []
  const laborPrice = typeof data.laborPrice === 'number' ? data.laborPrice : Number(data.laborPrice) || 0
  const interventionData = mapRawToInterventionData(data)
  const [technicianSignatureUrl, setTechnicianSignatureUrl] = useState('')
  const [clientSignatureUrl, setClientSignatureUrl] = useState('')

  useEffect(() => {
    const interventionId = intervention?.id || data.id
    if (!interventionId) {
      const resetTimer = window.setTimeout(() => {
        setTechnicianSignatureUrl('')
        setClientSignatureUrl('')
      }, 0)
      return () => window.clearTimeout(resetTimer)
    }
    let cancelled = false
    void (async () => {
      try {
        const response = await apiFetch(`/interventions/${interventionId}/signatures`, { cache: 'no-store' })
        if (!response.ok) return
        const list = await response.json().catch(() => [])
        if (cancelled || !Array.isArray(list)) return
        const findActive = (...types) =>
          list.find((sig) => sig?.isActive !== false && types.includes(sig?.type))
        const tech = findActive('TECHNICIAN_SIGNATURE')
        const client = findActive('CLIENT_SIGNATURE_STAMP', 'CLIENT_SIGNATURE', 'CLIENT_STAMP')
        setTechnicianSignatureUrl(tech?.url || '')
        setClientSignatureUrl(client?.url || '')
      } catch {
        // Signature previews are optional in the printable fiche.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [intervention?.id, data.id])

  return (
    <FichePreviewFrame
      interventionData={interventionData}
      parts={parts}
      laborPrice={laborPrice}
      logo={logo}
      technicianSignatureUrl={technicianSignatureUrl}
      clientSignatureUrl={clientSignatureUrl}
      rounded
    />
  )
}
export default function EmployeeHistory() {
  const { employeeId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [isLoading, setIsLoading] = useState(true)
  const [employeeName, setEmployeeName] = useState('')
  const [resolvedRole, setResolvedRole] = useState('')
  const [interventions, setInterventions] = useState([])

  const [searchTerm, setSearchTerm] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [showDetails, setShowDetails] = useState(false)
  const [selected, setSelected] = useState(null)
  const [highlightId, setHighlightId] = useState('')
  const highlightTimerRef = useRef(null)
  const highlightRowRef = useRef(null)
  const modifiedIdsSet = useMemo(() => {
    try {
      const raw = window.localStorage.getItem('intervention_modified_ids')
      const list = raw ? JSON.parse(raw) : []
      return new Set(Array.isArray(list) ? list : [])
    } catch {
      return new Set()
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search || '')
    const fromQuery = params.get('highlight') || ''
    const fromState = location.state?.highlightInterventionId || ''
    const next = String(fromQuery || fromState || '')
    if (!next) return

    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current)
      highlightTimerRef.current = null
    }
    setHighlightId(next)
    window.setTimeout(() => {
      if (highlightRowRef.current?.scrollIntoView) {
        highlightRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 50)
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightId('')
      highlightTimerRef.current = null
    }, 1800)

    if (fromQuery) {
      navigate({ pathname: location.pathname, search: '' }, { replace: true, state: location.state })
    }

    return () => {
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current)
      highlightTimerRef.current = null
    }
  }, [location.pathname, location.search, location.state, navigate])

  useEffect(() => {
    void (async () => {
      setIsLoading(true)
      try {
        let resolvedEmployeeName = ''
        let isMe = employeeId === 'me'
        const usersRes = await apiFetch('/users')
        if (usersRes.ok) {
          const users = await usersRes.json()
          const list = Array.isArray(users) ? users : []
          let found = null
          if (isMe) {
            const authUser = getAuthUser()
            if (authUser?.id) found = list.find((u) => String(u.id) === String(authUser.id))
          } else {
            found = list.find((u) => String(u.id) === String(employeeId))
          }
          resolvedEmployeeName = found?.name || ''
          setEmployeeName(resolvedEmployeeName)
          setResolvedRole(found?.role || '')
        }

        const [interventionsRes, missionsRes] = await Promise.all([
          apiFetch('/interventions', { auth: true, cache: 'no-store' }),
          apiFetch('/missions', { auth: true, cache: 'no-store' }),
        ])
        if (!interventionsRes.ok) {
          setInterventions([])
          return
        }
        const data = await interventionsRes.json()
        const missionsData = missionsRes.ok ? await missionsRes.json().catch(() => []) : []
        const list = Array.isArray(data) ? data : []
        const missionsList = Array.isArray(missionsData) ? missionsData : []

        const missionAggregateByIntervention = new Map()
        for (const mission of missionsList) {
          const interventionId = mission?.interventionId
          if (!interventionId) continue
          const key = String(interventionId)
          if (!missionAggregateByIntervention.has(key)) {
            missionAggregateByIntervention.set(key, { names: new Set(), missionId: mission?.id || null })
          }
          const aggregate = missionAggregateByIntervention.get(key)
          const names = buildAssignedEmployeesDisplay(mission)
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean)
          names.forEach((name) => aggregate.names.add(name))
          if (!aggregate.missionId && mission?.id) aggregate.missionId = mission.id
        }

        const normalized = list.map((row) => {
          const aggregate = missionAggregateByIntervention.get(String(row?.id || ''))
          const assignedEmployeesDisplay =
            aggregate && aggregate.names.size > 0
              ? Array.from(aggregate.names).join(', ')
              : String(row?.technicianName || row?.assignedTo || row?.assignee || row?.technician || '')
          return normalizeIntervention({
            ...row,
            assignedEmployeesDisplay,
            missionId: aggregate?.missionId || null,
          })
        })
        const closed = normalized.filter((row) => String(row.status).toUpperCase() === 'CLOSED')
        const byEmployee = resolvedEmployeeName
          ? closed.filter((row) => {
              const target = String(resolvedEmployeeName).trim()
              const names = String(row.assignedEmployeesDisplay || row.technicianName || '')
                .split(',')
                .map((name) => name.trim())
                .filter(Boolean)
              return names.includes(target)
            })
          : closed
        setInterventions(byEmployee)
      } catch {
        setInterventions([])
      } finally {
        setIsLoading(false)
      }
    })()
  }, [employeeId])

  const filtered = useMemo(() => {
    return interventions.filter((row) => {
      if (fromDate && row.interventionDate && String(row.interventionDate) < fromDate) return false
      if (toDate && row.interventionDate && String(row.interventionDate) > toDate) return false
      if (searchTerm) {
        const t = searchTerm.toLowerCase()
        const hay = `${row.id} ${row.ficheNumber} ${row.clientName} ${row.machine} ${row.siteName}`.toLowerCase()
        if (!hay.includes(t)) return false
      }
      return true
    })
  }, [interventions, fromDate, toDate, searchTerm])

  const handleOpenDetails = (row) => {
    setSelected(row)
    setShowDetails(true)
  }

  const handleCloseDetails = () => {
    setShowDetails(false)
    setSelected(null)
  }

  useEffect(() => {
    if (!showDetails) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [showDetails])

  const hasActiveFilters = Boolean(searchTerm || fromDate || toDate)
  const resetFilters = () => { setSearchTerm(''); setFromDate(''); setToDate('') }

  const renderSkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-44 bg-slate-200 rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-40 bg-slate-200 rounded" /></td>
      <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-200 rounded-full" /></td>
      <td className="px-6 py-4 text-right"><div className="h-8 w-40 bg-slate-200 rounded-lg inline-block" /></td>
    </tr>
  )

  const renderSkeletonCard = (key) => (
    <div key={key} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-slate-200 rounded" />
        <div className="h-6 w-20 bg-slate-200 rounded-full" />
      </div>
      <div className="h-3 w-40 bg-slate-200 rounded" />
      <div className="h-3 w-32 bg-slate-200 rounded" />
      <div className="flex gap-2 pt-1">
        <div className="h-9 flex-1 bg-slate-200 rounded-xl" />
        <div className="h-9 flex-1 bg-slate-200 rounded-xl" />
      </div>
    </div>
  )

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 space-y-5 sm:space-y-6">

        {/* ── En-tête ── */}
        <div className="flex flex-col gap-5 sm:flex-row sm:justify-between sm:items-center bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#0052CC] to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
              <History size={24} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">Historique des interventions</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0052CC]/10 text-[#0052CC] text-[11px] font-black rounded-lg uppercase tracking-wider">
                  <User size={11} /> {employeeName || '—'}
                </span>
                {resolvedRole && (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg">{resolvedRole}</span>
                )}
                <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Interventions clôturées et validées</span>
              </div>
            </div>
          </div>

          {/* Stat total */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-3 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl px-4 py-3 flex-1 sm:flex-none">
              <div className="w-10 h-10 rounded-xl bg-white border border-green-200 flex items-center justify-center text-green-600 shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-green-600/80 uppercase tracking-wider leading-none">Clôturées</p>
                <p className="text-xl font-black text-slate-900 leading-tight">{filtered.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filtres ── */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4">
          <div className="relative flex-1 min-w-0 group">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" />
            <input
              type="text"
              placeholder="Rechercher (réf, fiche, client, machine, site)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] hover:border-slate-300 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Filtres date : empilés sur mobile, 2 colonnes sur tablette */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex xl:items-end gap-3">
            <div className="flex flex-col gap-1.5 min-w-0">
              <label htmlFor="filter-from-date" className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" /> Date de début
              </label>
              <div className="relative min-w-0">
                <input
                  id="filter-from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  aria-label="Date de début"
                  className="w-full sm:w-auto xl:w-[160px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-base sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] hover:border-slate-300 transition-all min-w-0"
                />
                {!fromDate && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium pointer-events-none sm:hidden">
                    JJ/MM/AAAA
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <label htmlFor="filter-to-date" className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" /> Date de fin
              </label>
              <div className="relative min-w-0">
                <input
                  id="filter-to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  aria-label="Date de fin"
                  className="w-full sm:w-auto xl:w-[160px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-base sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] hover:border-slate-300 transition-all min-w-0"
                />
                {!toDate && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium pointer-events-none sm:hidden">
                    JJ/MM/AAAA
                  </span>
                )}
              </div>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="sm:col-span-2 xl:col-span-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-black hover:bg-red-100 transition-colors active:scale-95"
              >
                <X size={16} /> Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* ── Vue mobile : cartes ── */}
        <div className="space-y-4 sm:space-y-5 lg:hidden">
          {isLoading ? (
            <>{renderSkeletonCard('s1')}{renderSkeletonCard('s2')}{renderSkeletonCard('s3')}</>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center px-6 py-12">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                <AlertCircle size={24} className="text-slate-400" />
              </div>
              <p className="text-sm font-black text-slate-700">Aucune intervention clôturée</p>
              <p className="text-xs text-slate-500 mt-1">{hasActiveFilters ? 'Modifiez vos filtres ou réinitialisez la recherche.' : 'Les interventions validées apparaîtront ici.'}</p>
              {hasActiveFilters && (
                <button type="button" onClick={resetFilters} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black active:scale-95 transition-transform">
                  <X size={14} /> Réinitialiser
                </button>
              )}
            </div>
          ) : (
            filtered.map((row) => (
              <div
                key={row.id}
                ref={row.id === highlightId ? highlightRowRef : null}
                className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-all ${
                  row.id === highlightId ? 'border-amber-300 ring-2 ring-amber-200 animate-pulse' : 'border-slate-200'
                }`}
              >
                <div className="h-1 w-full bg-green-500" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        <Hash size={11} /> {row.ficheNumber || row.id}
                      </div>
                      <p className="text-base font-black text-slate-900 leading-tight truncate">{row.clientName || '—'}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black border bg-green-50 text-green-700 border-green-200 shrink-0">
                      <CheckCircle2 size={11} /> Clôturée
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold min-w-0">
                      <Calendar size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{row.interventionDate || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold min-w-0">
                      <Building2 size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{row.siteName || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold min-w-0">
                      <Wrench size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{row.machine || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold min-w-0">
                      <User size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{row.assignedEmployeesDisplay || row.technicianName || '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(row)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-black transition-colors active:scale-95"
                    >
                      <Eye size={14} /> Détails
                    </button>
                    {!modifiedIdsSet.has(row.id) && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/interventions/${row.id}`, {
                            state: {
                              assignedTechnicianName: row.assignedEmployeesDisplay || row.technicianName,
                              missionId: row.missionId,
                              returnTo: `${window.location.pathname}${window.location.search}`,
                            },
                          })
                        }
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-black transition-colors active:scale-95"
                      >
                        <Edit3 size={14} /> Modifier
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Vue desktop : tableau ── */}
        <div className="hidden lg:flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Référence</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Machine</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <>
                    {renderSkeletonRow()}
                    {renderSkeletonRow()}
                    {renderSkeletonRow()}
                  </>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                          <AlertCircle size={24} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-black text-slate-700">Aucune intervention clôturée</p>
                        <p className="text-xs text-slate-500 mt-1">{hasActiveFilters ? 'Modifiez vos filtres ou effectuez une autre recherche.' : 'Les interventions validées apparaîtront ici.'}</p>
                        {hasActiveFilters && (
                          <button type="button" onClick={resetFilters} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-950 transition-colors">
                            <X size={14} /> Réinitialiser les filtres
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.id}
                      ref={row.id === highlightId ? highlightRowRef : null}
                      className={`transition-colors ${
                        row.id === highlightId
                          ? 'bg-amber-50 ring-2 ring-amber-200 animate-pulse'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900">{row.id}</p>
                          <p className="text-xs text-slate-500 font-semibold truncate">{row.ficheNumber || '—'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-700">{row.interventionDate || '—'}</p>
                        <p className="text-xs text-slate-500 font-semibold">{row.siteName || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">{row.clientName || '—'}</p>
                        <p className="text-xs text-slate-500 font-semibold">{row.assignedEmployeesDisplay || row.technicianName || ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-700">{row.machine || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${statusBadgeByStatus[row.status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          <CheckCircle2 size={12} /> Clôturée
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(row)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-black transition-colors"
                          >
                            <Eye size={14} /> Détails
                          </button>
                          {!modifiedIdsSet.has(row.id) && (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/interventions/${row.id}`, {
                                  state: {
                                    assignedTechnicianName: row.assignedEmployeesDisplay || row.technicianName,
                                    missionId: row.missionId,
                                    returnTo: `${window.location.pathname}${window.location.search}`,
                                  },
                                })
                              }
                              className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-black transition-colors"
                            >
                              <Edit3 size={14} /> Modifier
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showDetails && selected && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overscroll-contain" onClick={handleCloseDetails}>
            <div className="relative w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[92vh]" onClick={(e) => e.stopPropagation()}>
              <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                    <Eye size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aperçu de la fiche officielle</p>
                    <p className="text-sm font-black text-slate-900 truncate">{selected.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCloseDetails}
                    className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden flex">
                <InterventionPreview intervention={selected} />
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseDetails}
                  className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
                >
                  Fermer l'aperçu
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  )
}
