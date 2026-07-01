import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, Clock, Calendar, MapPin,
  Building2, Wrench, ClipboardList, AlertTriangle, Link2,
  User, FileText, Hash, ChevronRight, Edit2,
  CheckSquare, Flag, Phone, Zap, Info,
  ExternalLink, History, Save,
  MoreVertical, Paperclip, File, X,
  Download, Eye, Truck
} from 'lucide-react'
import { apiFetch } from '../../api/apiClient'
import {
  MISSION_PRIORITY_CONFIG as PRIORITY_CONFIG,
  MISSION_STATUS_CONFIG as STATUS_CONFIG,
  MISSION_STATUS_STEPS as STATUS_STEPS,
} from '../../constants/missionConstants'

const ACTIONS_SECTION_ACCENT = {
  'À faire': 'border-blue-200',
  'En cours': 'border-amber-300',
  'Terminée': 'border-green-200',
  'Bloquée': 'border-red-200',
}

function SectionHeader({ icon, title, children }) {
  const SectionIcon = icon
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
          <SectionIcon size={18} />
        </div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function InfoItem({ label, value, icon, colorClass = "text-slate-500" }) {
  const ItemIcon = icon
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className={`mt-0.5 ${colorClass}`}>
        <ItemIcon size={16} />
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-slate-700">{value || 'Non spécifié'}</p>
      </div>
    </div>
  )
}

function buildGroupedEmployeesDisplay(missionLike) {
  const primary = String(missionLike?.employee || '').trim()
  const fromArray = Array.isArray(missionLike?.groupedEmployees)
    ? missionLike.groupedEmployees.map((name) => String(name || '').trim()).filter(Boolean)
    : []
  const fromDisplay = String(missionLike?.employeeDisplay || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)

  return Array.from(new Set([primary, ...fromArray, ...fromDisplay].filter(Boolean))).join(', ')
}

function syncVehicleMileageState(setDepart, setRetour, missionLike) {
  setDepart(
    typeof missionLike?.vehicleKilometrageDepart === 'number' || typeof missionLike?.vehicleKilometrageDepart === 'string'
      ? missionLike.vehicleKilometrageDepart
      : '',
  )
  setRetour(
    typeof missionLike?.vehicleKilometrageRetour === 'number' || typeof missionLike?.vehicleKilometrageRetour === 'string'
      ? missionLike.vehicleKilometrageRetour
      : '',
  )
}

function downloadDocument(url, filename) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'document'
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function MissionDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [mission, setMission] = useState(null)
  const [intervention, setIntervention] = useState(null)
  const [isLoadingMission, setIsLoadingMission] = useState(true)
  const [showInterventionPreview, setShowInterventionPreview] = useState(false)

  const [status, setStatus] = useState(mission?.status || 'À faire')
  const [notes, setNotes]   = useState(mission?.notes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveToast, setShowSaveToast] = useState(false)
  const refreshTimerRef = useRef(null)
  const statusAnimTimerRef = useRef(null)
  const [statusJustChangedTo, setStatusJustChangedTo] = useState('')
  const statusAttentionTimerRef = useRef(null)
  const lastStatusAttentionRef = useRef('')
  const lastInterventionStatusRef = useRef('')
  const [showStatusAttention, setShowStatusAttention] = useState(false)
  const [statusAttentionText, setStatusAttentionText] = useState('')
  const [missionActionError, setMissionActionError] = useState('')
  const [docViewer, setDocViewer] = useState({ open: false, url: '', type: '', name: '', isPdf: false, downloadUrl: '', publicId: '' })
  const [groupedEmployeesDisplay, setGroupedEmployeesDisplay] = useState('')
  const [vehicleKilometrageDepart, setVehicleKilometrageDepart] = useState('')
  const [vehicleKilometrageRetour, setVehicleKilometrageRetour] = useState('')
  const [vehicleMileageError, setVehicleMileageError] = useState('')
  const [showInterventionClosedSuccess, setShowInterventionClosedSuccess] = useState(false)
  // Track whether the user is actively editing the mileage fields so the
  // background polling never overwrites what they are typing.
  const mileageEditingRef = useRef(false)

  useEffect(() => {
    if (!location.state?.interventionClosedSuccess) return undefined

    setShowInterventionClosedSuccess(true)
    navigate(
      { pathname: location.pathname, search: location.search },
      {
        replace: true,
        state: {
          ...location.state,
          interventionClosedSuccess: false,
        },
      },
    )

    const timer = window.setTimeout(() => {
      setShowInterventionClosedSuccess(false)
    }, 4500)

    return () => window.clearTimeout(timer)
  }, [location.pathname, location.search, location.state, navigate])

  const attachments = useMemo(() => {
    const list = Array.isArray(mission?.attachments) ? mission.attachments : []
    return list.map((a, idx) => {
      // Determine if it's an image or PDF/file
      const isPdf = a.format === 'pdf' || (a.url && a.url.toLowerCase().includes('.pdf'))
      const isImage = a.resourceType === 'image' && !isPdf
      
      // For PDFs, we need to modify the URL
      let displayUrl = a.url
      let viewUrl = a.url // URL for viewing in modal (without download flag)
      let downloadUrl = a.url
      
      if (isPdf && a.url) {
        // Convert PDF URL to display first page as PNG image for preview
        displayUrl = a.url.replace('/upload/', '/upload/pg_1,f_png/')
        
        // For viewing in modal, use original URL without any flags
        viewUrl = a.url
        
        // For download, add fl_attachment flag to force download
        downloadUrl = a.url.replace('/upload/', '/upload/fl_attachment/')
      }
      
      return {
        id: a.publicId || String(idx),
        name: a.originalFilename || a.publicId || `Fichier ${idx + 1}`,
        type: isImage ? 'image' : 'file',
        size: typeof a.bytes === 'number' ? `${Math.ceil(a.bytes / 1024)} KB` : '',
        date: a.createdAt || '',
        url: a.url,
        displayUrl: displayUrl, // URL for preview (first page as image for PDFs)
        viewUrl: viewUrl, // URL for viewing in modal (no download)
        downloadUrl: downloadUrl, // URL for download
        publicId: a.publicId || '', // Public ID for signed URL generation
        isPdf: isPdf,
      }
    })
  }, [mission])

  useEffect(() => {
    void (async () => {
      setIsLoadingMission(true)
      try {
        const response = await apiFetch(`/missions/${id}`, { auth: true, cache: 'no-store' })
        if (!response.ok) {
          if (response.status === 403) {
            setMissionActionError("Accès refusé : vous n'avez pas la permission (403).")
          }
          setMission(null)
          return
        }
        const data = await response.json()
        setMission(data)
        setStatus(data?.status || 'À faire')
        setNotes(data?.notes || '')
        setGroupedEmployeesDisplay(buildGroupedEmployeesDisplay(data))
          syncVehicleMileageState(setVehicleKilometrageDepart, setVehicleKilometrageRetour, data)
      } catch {
        setMission(null)
      } finally {
        setIsLoadingMission(false)
      }
    })()
  }, [id])

  useEffect(() => {
    if (!mission?.interventionId) {
      setIntervention(null)
      return
    }
    void (async () => {
      try {
        const response = await apiFetch(`/interventions/${mission.interventionId}`, { auth: true })
        if (!response.ok) return
        const data = await response.json()
        setIntervention(data)
      } catch {
        // Linked intervention details are optional on this view.
      }
    })()
  }, [mission?.interventionId])

  useEffect(() => {
    if (!mission?.id) return

    const refresh = async () => {
      try {
        const missionRes = await apiFetch(`/missions/${mission.id}`, { auth: true, cache: 'no-store' })
        if (missionRes.ok) {
          const data = await missionRes.json()
          const nextStatus = data?.status || 'À faire'
          setMission((prev) => (prev ? { ...prev, ...data, status: nextStatus } : data))
          setStatus((prev) => (prev !== nextStatus ? nextStatus : prev))
          setGroupedEmployeesDisplay(buildGroupedEmployeesDisplay(data))
          // Only sync mileage fields from the server if the user is not
          // currently typing in them — otherwise the poll would erase input.
          if (!mileageEditingRef.current) {
            syncVehicleMileageState(setVehicleKilometrageDepart, setVehicleKilometrageRetour, data)
          }
        }

        if (mission.interventionId) {
          const interventionRes = await apiFetch(`/interventions/${mission.interventionId}`, { auth: true, cache: 'no-store' })
          if (interventionRes.ok) {
            const iv = await interventionRes.json()
            setIntervention(iv)
          }
        }
      } catch {
        // Background refresh is best-effort; keep current mission state.
      }
    }

    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    refreshTimerRef.current = window.setInterval(refresh, 5000)
    return () => {
      window.removeEventListener('focus', onFocus)
      if (refreshTimerRef.current) window.clearInterval(refreshTimerRef.current)
      refreshTimerRef.current = null
      if (statusAnimTimerRef.current) window.clearTimeout(statusAnimTimerRef.current)
      statusAnimTimerRef.current = null
      if (statusAttentionTimerRef.current) window.clearTimeout(statusAttentionTimerRef.current)
      statusAttentionTimerRef.current = null
    }
  }, [mission?.id, mission?.interventionId])

  useEffect(() => {
    if (!status) return
    const interventionStatus = intervention?.status || ''
    const interventionChanged = interventionStatus && lastInterventionStatusRef.current !== interventionStatus
    if (interventionChanged) lastInterventionStatusRef.current = interventionStatus

    if (!interventionChanged && lastStatusAttentionRef.current === status) return
    lastStatusAttentionRef.current = status

    if (statusAttentionTimerRef.current) window.clearTimeout(statusAttentionTimerRef.current)
    setStatusAttentionText(`Statut actuel : ${status}`)
    setShowStatusAttention(true)
    statusAttentionTimerRef.current = window.setTimeout(() => {
      setShowStatusAttention(false)
      statusAttentionTimerRef.current = null
    }, 3500)
  }, [status, intervention?.status])

  if (!mission && !isLoadingMission) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 bg-white rounded-3xl border-2 border-slate-200 flex items-center justify-center shadow-sm">
          <AlertTriangle size={36} className="text-slate-300" />
        </div>
        <p className="text-slate-500 font-black text-lg">{missionActionError || 'Mission introuvable'}</p>
        <button
          onClick={() => navigate('/missions/my')}
          className="flex items-center gap-2 px-6 py-3 bg-[#0052CC] text-white rounded-xl text-sm font-black shadow-lg shadow-blue-200 hover:bg-[#0042a3] transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={3} /> Retour à mes missions
        </button>
      </div>
    )
  }
  if (!mission) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-[1600px] mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
          </div>
        </header>
        <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-slate-100 rounded" />
                    <div className="h-5 w-2/3 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-20 bg-slate-50 rounded-xl" />
                <div className="h-16 bg-slate-50 rounded-xl" />
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-50 rounded-xl" />)}
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 h-48" />
              <div className="bg-white rounded-2xl border border-slate-200 p-6 h-64" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  const priority   = PRIORITY_CONFIG[mission.priority] || PRIORITY_CONFIG['Moyenne']
  const statusCfg  = STATUS_CONFIG[status] || STATUS_CONFIG['À faire']

  const handleStatusChange = (newStatus) => {
    if (statusAnimTimerRef.current) {
      window.clearTimeout(statusAnimTimerRef.current)
      statusAnimTimerRef.current = null
    }
    setStatus(newStatus)
    setMission((prev) => (prev ? { ...prev, status: newStatus } : prev))
    void (async () => {
      try {
        // Le kilométrage reste facultatif : on l'enregistre seulement s'il est renseigné.
        if (newStatus === 'Terminée' && mission.vehicleId) {
          const departText = String(vehicleKilometrageDepart ?? '').trim()
          const retourText = String(vehicleKilometrageRetour ?? '').trim()
          if (departText !== '' || retourText !== '') {
            const depart = departText === '' ? null : Number(departText)
            const retour = retourText === '' ? null : Number(retourText)
            const kmRes = await apiFetch(`/missions/${mission.id}/vehicle-kilometrage`, {
              method: 'PATCH',
              body: { vehicleKilometrageDepart: depart, vehicleKilometrageRetour: retour },
              auth: true,
            })
            if (!kmRes.ok) {
              const kmErr = await kmRes.json().catch(() => ({}))
              setVehicleMileageError(kmErr.message || 'Kilométrage non enregistré, statut mis à jour.')
            }
          }
        }

        const response = await apiFetch(`/missions/${mission.id}`, {
          method: 'PATCH',
          body: { status: newStatus },
          auth: true,
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || 'Impossible de mettre à jour le statut.')
        }
        setMissionActionError('')
        setVehicleMileageError('')
        setStatusJustChangedTo(newStatus)
        statusAnimTimerRef.current = window.setTimeout(() => {
          setStatusJustChangedTo('')
          statusAnimTimerRef.current = null
        }, 700)
        if (refreshTimerRef.current) {
          window.clearInterval(refreshTimerRef.current)
          refreshTimerRef.current = null
        }
        const missionRes = await apiFetch(`/missions/${mission.id}`, { auth: true, cache: 'no-store' })
        if (missionRes.ok) {
          const latestMission = await missionRes.json().catch(() => null)
          if (latestMission) {
            setMission((prev) => (prev ? { ...prev, ...latestMission, status: latestMission.status || newStatus } : latestMission))
            setStatus(latestMission.status || newStatus)
            setGroupedEmployeesDisplay(buildGroupedEmployeesDisplay(latestMission))
            syncVehicleMileageState(setVehicleKilometrageDepart, setVehicleKilometrageRetour, latestMission)
            try {
              window.dispatchEvent(new CustomEvent('mission:updated', { detail: latestMission }))
            } catch {
              // Ignore malformed attachment metadata.
            }
          }
        }
        refreshTimerRef.current = window.setInterval(async () => {
          try {
            const pollRes = await apiFetch(`/missions/${mission.id}`, { auth: true, cache: 'no-store' })
            if (!pollRes.ok) return
            const pollData = await pollRes.json()
            const nextStatus = pollData?.status || 'À faire'
            setMission((prev) => (prev ? { ...prev, ...pollData, status: nextStatus } : pollData))
            setStatus((prev) => (prev !== nextStatus ? nextStatus : prev))
            setGroupedEmployeesDisplay(buildGroupedEmployeesDisplay(pollData))
            if (!mileageEditingRef.current) {
              syncVehicleMileageState(setVehicleKilometrageDepart, setVehicleKilometrageRetour, pollData)
            }
          } catch {
            // Ignore malformed attachment metadata.
          }
        }, 5000)
        setShowSaveToast(`Cette mission est ${newStatus}`)
        setTimeout(() => setShowSaveToast(false), 3000)
      } catch (error) {
        console.error('Erreur MAJ statut:', error)
        setMissionActionError(error?.message || 'Impossible de mettre à jour le statut.')
        // Rétablir le statut précédent en cas d'erreur
        setStatus(mission.status)
        setMission((prev) => (prev ? { ...prev, status: mission.status } : prev))
      }
    })()
  }

  const handleSave = () => {
    setIsSaving(true)
    const missionId = mission?.id
    const nextStatus = status
    const nextNotes = notes
    if (missionId) {
      setMission((prev) => (prev ? { ...prev, status: nextStatus, notes: nextNotes } : prev))
    }
    void (async () => {
      try {
        const response = await apiFetch(`/missions/${missionId}`, {
          method: 'PATCH',
          body: { status: nextStatus, notes: nextNotes },
          auth: true,
        })
        if (response.ok) {
          await response.json().catch(() => null)
          const fullRes = await apiFetch(`/missions/${missionId}`, { auth: true, cache: 'no-store' })
          if (fullRes.ok) {
            const full = await fullRes.json().catch(() => null)
            if (full) {
              setMission((prev) => (prev ? { ...prev, ...full } : full))
              setStatus(full?.status || nextStatus)
              setNotes(full?.notes || nextNotes)
              setGroupedEmployeesDisplay(buildGroupedEmployeesDisplay(full))
                try { window.dispatchEvent(new CustomEvent('mission:updated', { detail: full })) } catch {
                  // Mission update events are best-effort.
                }
            }
          }
        }
        setShowSaveToast(true)
        setTimeout(() => setShowSaveToast(false), 3000)
      } catch {
        // Status update errors are handled by preserving the current view.
      }
      setIsSaving(false)
    })()
  }
  const PROGRESS_MAP = { 'À faire': 10, 'En cours': 50, 'Terminée': 100 }
  const progressPct = PROGRESS_MAP[status] || 0

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* TOAST NOTIFICATION */}
      {showSaveToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4">
          <div className="bg-slate-900 text-white border border-slate-700 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-400" />
            <span className="text-sm font-bold tracking-wide">{typeof showSaveToast === 'string' ? showSaveToast : 'Statut mis à jour'}</span>
          </div>
        </div>
      )}

      {showInterventionClosedSuccess && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowInterventionClosedSuccess(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-green-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-200 text-green-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-1">Succès</p>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    L’intervention a été clôturée avec succès.
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInterventionClosedSuccess(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors shrink-0"
                  aria-label="Fermer"
                >
                  <X size={17} />
                </button>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowInterventionClosedSuccess(false)}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#0052CC] hover:bg-[#0042a3] text-white text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-blue-100"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => navigate('/missions/my')}
              className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1" />
            <div className="min-w-0">
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <button onClick={() => navigate('/missions/my')} className="hover:text-[#0052CC]">Missions</button>
                <ChevronRight size={10} />
                <span className="text-slate-500">Détails</span>
              </div>
              <h1 className="text-xs sm:text-sm font-black text-slate-900 leading-none mt-0.5 sm:mt-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="truncate">{mission.title}</span>
                {mission?.dueTime && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-black w-fit">
                    <Clock size={12} />
                    {mission.dueTime}
                  </span>
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 mr-4">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${priority.badge}`}>
                {priority.label}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${statusCfg.badge}`}>
                {status}
              </span>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8">
        {/*
          Responsive note:
          - On mobile/tablet the column wrappers use `display: contents` so every
            card becomes a direct flex item of this container and can be ordered
            independently (Véhicule affecté is pushed last via `order-last`).
          - At `lg:` the wrappers fall back to normal block columns, so the
            desktop layout and ordering stay exactly the same.
        */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-6">
          
          {/* Left Column: Mission Content (8 cols) */}
          <div className="contents lg:block lg:col-span-8 lg:space-y-6">
            
            {/* Mission Card */}
            <div className="bg-blue-50/40 lg:bg-white rounded-2xl border border-blue-100 lg:border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      mission.type === 'Intervention' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {mission.type === 'Intervention' ? <Wrench size={20} /> : <ClipboardList size={20} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-black text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                          {mission.type}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          ID: MIS-{String(mission.id).padStart(4,'0')}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="truncate">{mission.title}</span>
                        {mission?.dueTime && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-black w-fit">
                            <Clock size={12} />
                            {mission.dueTime}
                          </span>
                        )}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none mb-8">
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {mission.description}
                  </p>
                </div>

                {/* Progress Visual */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Progression globale</span>
                    <span className="text-xs font-black text-[#0052CC]">{progressPct}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#0052CC] transition-all duration-500 ease-out"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-3">
                    {STATUS_STEPS.map((step, idx) => (
                      <div key={step} className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mb-1 ${
                          STATUS_STEPS.indexOf(status) >= idx ? 'bg-[#0052CC]' : 'bg-slate-300'
                        }`} />
                        <span className={`text-[10px] font-bold ${
                          status === step ? 'text-[#0052CC]' : 'text-slate-400'
                        }`}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Véhicule Affecté Card */}
            {mission.vehicle && (
              <div className="order-last lg:order-none bg-emerald-50/40 lg:bg-white rounded-2xl border border-emerald-100 lg:border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6">
                  <SectionHeader icon={Truck} title="Véhicule affecté" />
                  
                  <div className="space-y-4 mt-4">
                    {/* Vehicle Identity Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Matricule</p>
                        <p className="text-sm font-bold text-slate-900 font-mono">{mission.vehicle.matricule}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Marque / Modèle</p>
                        <p className="text-sm font-bold text-slate-900">{mission.vehicle.marque} {mission.vehicle.modele}</p>
                      </div>
                    </div>

                    {/* Current Mileage */}
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Kilométrage actuel du véhicule</p>
                      <p className="text-sm font-bold text-slate-900">
                        {typeof mission.vehicle.kilometrage === 'number' ? `${mission.vehicle.kilometrage.toLocaleString('fr-FR')} km` : '—'}
                      </p>
                    </div>

                    {/* Mileage Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 block">Kilométrage départ</span>
                        <input
                          type="number"
                          min="0"
                          max="999999"
                          value={vehicleKilometrageDepart}
                          onFocus={() => { mileageEditingRef.current = true }}
                          onBlur={() => { mileageEditingRef.current = false }}
                          onChange={(e) => {
                            const v = e.target.value
                            if (v === '' || (Number(v) >= 0 && Number(v) <= 999999)) {
                              setVehicleKilometrageDepart(v)
                            }
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10"
                          placeholder="0"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 block">Kilométrage retour</span>
                        <input
                          type="number"
                          min="0"
                          max="999999"
                          value={vehicleKilometrageRetour}
                          onFocus={() => { mileageEditingRef.current = true }}
                          onBlur={() => { mileageEditingRef.current = false }}
                          onChange={(e) => {
                            const v = e.target.value
                            if (v === '' || (Number(v) >= 0 && Number(v) <= 999999)) {
                              setVehicleKilometrageRetour(v)
                            }
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10"
                          placeholder="0"
                        />
                      </label>
                    </div>

                    {/* Error Display */}
                    {vehicleMileageError && (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-red-200 bg-red-50">
                        <AlertTriangle size={14} className="text-red-500 shrink-0" />
                        <span className="text-xs font-semibold text-red-700">{vehicleMileageError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div
              className={`bg-amber-50/30 lg:bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${
                showStatusAttention
                  ? 'border-amber-300 ring-2 ring-amber-300/60 shadow-lg shadow-amber-100 animate-pulse'
                  : (ACTIONS_SECTION_ACCENT[status] || 'border-slate-200')
              }`}
            >
              <div className="p-4 sm:p-6">
                <SectionHeader icon={Zap} title="Actions & État" />

                {missionActionError && (
                  <div className="mt-3 mb-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle size={16} className="text-red-500 shrink-0" />
                      <span className="text-xs sm:text-sm font-black truncate">{missionActionError}</span>
                    </div>
                    <button type="button" onClick={() => setMissionActionError('')} className="text-[10px] font-black uppercase tracking-wider text-red-600 hover:text-red-700">
                      Fermer
                    </button>
                  </div>
                )}

                {showStatusAttention ? (
                  <div className="mt-3 mb-2 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-amber-500" />
                      <span className="text-xs sm:text-sm font-black">{statusAttentionText}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Info</span>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {['À faire', 'En cours', 'Terminée', 'Bloquée'].map((s) => {
                    const cfg = STATUS_CONFIG[s]
                    const Icon = cfg.icon
                    const isActive = status === s
                    const shouldAnimate = isActive && statusJustChangedTo === s
                    
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          isActive
                            ? `${cfg.border} ${cfg.bg} ${cfg.color} scale-[1.02] shadow-sm ${shouldAnimate ? 'ring-2 ring-offset-2 ring-[#0052CC] animate-in zoom-in-95 duration-200' : ''}`
                            : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200 hover:bg-white hover:text-slate-600'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-white shadow-sm' : 'bg-slate-200/50'}`}>
                          <Icon size={20} className={isActive && s === 'En cours' ? 'animate-spin' : ''} />
                        </div>
                        <span className="text-xs font-black">{s}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="bg-violet-50/40 lg:bg-white rounded-2xl border border-violet-100 lg:border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6">
                <SectionHeader icon={FileText} title="Notes & Observations" />
                <div className="relative mt-4">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ajoutez vos remarques, observations ou détails techniques ici..."
                    className="w-full h-40 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-[#0052CC]/10 focus:border-[#0052CC] outline-none transition-all resize-none"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">
                    <Edit2 size={10} />
                    Modification en direct
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0052CC] text-white text-xs font-black uppercase tracking-wider hover:bg-[#0042a3] active:scale-95 disabled:opacity-50"
                  >
                    <Save size={14} />
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar (4 cols) */}
          <div className="contents lg:block lg:col-span-4 lg:row-span-3 lg:space-y-6">
            
            {/* Linked Intervention (Moved to first position) */}
            {intervention && (
              <div className={`bg-indigo-50/40 lg:bg-white rounded-2xl border-2 shadow-sm overflow-hidden relative ${
                intervention.status === 'CLOSED' ? 'border-red-200' : 'border-blue-600/10'
              }`}>
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-12 -mt-12 opacity-50 ${
                  intervention.status === 'CLOSED' ? 'bg-red-50' : 'bg-blue-50'
                }`} />
                <div className="p-4 sm:p-6 relative">
                  <SectionHeader icon={Wrench} title="Intervention liée">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-[#0052CC] text-[10px] font-black uppercase tracking-wider">
                      SAV
                    </span>
                  </SectionHeader>
                  
                  <div className="space-y-4 mt-2">
                    {intervention.status === 'CLOSED' && (
                      <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={14} />
                          <span className="text-xs font-black uppercase tracking-wider">Intervention clôturée</span>
                        </div>
                        <span className="text-[10px] font-bold text-red-600">Validée</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Référence</p>
                        <p className="text-sm font-black text-slate-900">{intervention.id}</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-blue-600">
                        <Hash size={18} />
                      </div>
                    </div>

                    <div className="flex items-start gap-3 px-1">
                      <div className="mt-1 text-slate-400">
                        <Zap size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Machine</p>
                        <p className="text-sm font-bold text-slate-700">{intervention.machine}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        if (intervention.status === 'CLOSED') setShowInterventionPreview(true)
                        else navigate(`/interventions/${intervention.id}`, { state: { assignedTechnicianName: mission.employee, missionId: mission.id, fromMissionDetails: true } })
                      }}
                      className={`w-full mt-2 py-3 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 group ${
                        intervention.status === 'CLOSED'
                          ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-100'
                          : 'bg-[#0052CC] hover:bg-[#0042a3] text-white shadow-blue-100'
                      }`}
                    >
                      {intervention.status === 'CLOSED' ? 'Intervention clôturée' : 'Ouvrir le dossier'}
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showInterventionPreview && intervention && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" onClick={() => setShowInterventionPreview(false)}>
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl border border-red-200 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <div className="px-5 py-4 border-b border-red-200 bg-red-50 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Intervention clôturée</p>
                      <p className="text-sm font-black text-slate-900 truncate">{intervention.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInterventionPreview(false)}
                      className="inline-flex items-center justify-center w-10 h-10 bg-white hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="p-5 bg-white">
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-red-200 flex items-center justify-center shrink-0 text-red-600">
                        <AlertTriangle size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-red-700">Si vous souhaitez effectuer une modification ou consulter les détails de l’intervention, veuillez vous rendre dans l’interface Historique des interventions.</p>
                        <p className="text-xs font-semibold text-red-700/80 mt-1">
                          Intervention : <span className="font-black">{intervention.id}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowInterventionPreview(false)
                            navigate(`/employees/${mission?.employeeId || 'me'}/history?highlight=${encodeURIComponent(intervention.id)}`)
                          }}
                          className="mt-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-red-100 text-red-700 border border-red-200 text-xs font-black transition-colors"
                        >
                          <History size={14} />
                          Aller à l’historique
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Details */}
            <div className="bg-sky-50/40 lg:bg-white rounded-2xl border border-sky-100 lg:border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 bg-[#F0F8FF]">
                <SectionHeader icon={Info} title="Détails" />
                <div className="mt-2">
                  <InfoItem label="Type" value={mission.type === 'Intervention' ? 'Intervention S.A.V' : mission.type} icon={Wrench} colorClass="text-blue-500" />
                  <InfoItem label="Statut" value={status} icon={CheckSquare} colorClass={statusCfg.color} />
                  <InfoItem label="Priorité" value={priority.label} icon={Flag} colorClass={priority.color} />
                  {mission.type === 'Intervention' && (
                    <InfoItem label="Dossier SAV lié" value={mission.interventionId} icon={Link2} colorClass="text-indigo-500" />
                  )}
                  <InfoItem label="Date mission" value={mission.dueDate} icon={Calendar} />
                  <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
                    <div className="mt-0.5 text-slate-500">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Heure mission</p>
                      <p className="text-sm font-black text-slate-900">{mission.dueTime || '—'}</p>
                    </div>
                  </div>
                  <InfoItem label="Employé(s) assigné(s)" value={groupedEmployeesDisplay || mission.employee} icon={User} colorClass="text-blue-500" />
                </div>
              </div>
            </div>

            {/* Location & Primary Document Card */}
            <div className="bg-rose-50/40 lg:bg-white rounded-2xl border border-rose-100 lg:border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6">
                <SectionHeader icon={MapPin} title="Lieu & Document">
                  <button className="text-[10px] font-black text-[#0052CC] flex items-center gap-1 hover:underline">
                    OUVRIR MAPS <ExternalLink size={10} />
                  </button>
                </SectionHeader>
                <div className="mt-2">
                  <div className="p-3 bg-slate-50 rounded-xl mb-4 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-bold mb-1">
                      <Building2 size={14} className="text-slate-400" />
                      {mission.site}
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed pl-5">
                      {mission.address || 'Adresse non renseignée'}
                    </p>
                    {intervention?.phone && (
                      <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-600 font-bold text-[11px]">
                          <Phone size={12} className="text-blue-500" />
                          {intervention.phone}
                        </div>
                        <a 
                          href={`tel:${intervention.phone}`}
                          className="px-3 py-1 bg-white border border-slate-200 text-[10px] font-black text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          APPELER
                        </a>
                      </div>
                    )}
                  </div>
                  {/* Mission Document Preview (Replacing Map) */}
                  {attachments.length > 0 ? (
                    <div className="aspect-[4/3] md:aspect-video bg-slate-100 rounded-xl border border-slate-200 overflow-hidden group relative cursor-pointer shadow-sm">
                      {attachments[0].type === 'image' ? (
                        <div className="w-full h-full relative">
                          <img 
                            src={attachments[0].url}
                            alt={attachments[0].name}
                            className="w-full h-full object-contain md:object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-[9px] font-black text-blue-600 shadow-sm">
                            DOCUMENT
                          </div>
                        </div>
                      ) : attachments[0].isPdf ? (
                        <div className="w-full h-full relative">
                          <img 
                            src={attachments[0].displayUrl}
                            alt={attachments[0].name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-[9px] font-black text-red-600 shadow-sm flex items-center gap-1">
                            <File size={10} />
                            PDF
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 group-hover:bg-slate-100 transition-colors">
                          <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 border border-slate-200">
                            <File size={32} strokeWidth={2} className="text-red-500" />
                          </div>
                          <span className="text-xs font-black text-slate-700 px-4 text-center mb-1">
                            {attachments[0].name}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            Cliquez pour prévisualiser
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setDocViewer({ 
                            open: true, 
                            url: attachments[0].viewUrl || attachments[0].url, 
                            type: attachments[0].type, 
                            name: attachments[0].name,
                            isPdf: attachments[0].isPdf,
                            downloadUrl: attachments[0].downloadUrl,
                            publicId: attachments[0].publicId 
                          })}
                          className="p-2 bg-white rounded-lg text-slate-900 shadow-xl hover:scale-110 transition-transform"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadDocument(attachments[0].downloadUrl || attachments[0].url, attachments[0].name)}
                          className="p-2 bg-white rounded-lg text-slate-900 shadow-xl hover:scale-110 transition-transform"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[4/3] md:aspect-video bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                      <Paperclip size={24} className="text-slate-300 mb-2" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">Aucun document affecté</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {docViewer.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDocViewer({ open: false, url: '', type: '', name: '', isPdf: false, downloadUrl: '', publicId: '' })}>
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aperçu du document</p>
                  <p className="text-sm font-black text-slate-900 truncate">{docViewer.name}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {docViewer.isPdf && (
                    <a
                      href={docViewer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 bg-blue-50 hover:bg-blue-100 text-[#0052CC] rounded-xl transition-colors"
                      title="Ouvrir dans un nouvel onglet"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => downloadDocument(docViewer.downloadUrl || docViewer.url, docViewer.name)}
                    className="inline-flex items-center justify-center w-10 h-10 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-colors"
                    title="Télécharger"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocViewer({ open: false, url: '', type: '', name: '', isPdf: false, downloadUrl: '', publicId: '' })}
                    className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="p-5 bg-white overflow-auto max-h-[80vh]">
                {docViewer.type === 'image' ? (
                  <img src={docViewer.url} alt={docViewer.name} className="w-full h-auto object-contain rounded-xl border border-slate-200" />
                ) : docViewer.isPdf ? (
                  <div className="w-full min-h-[75vh] rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                    <iframe 
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(docViewer.url)}&embedded=true`}
                      title={docViewer.name} 
                      className="w-full h-[75vh] md:h-[80vh]"
                      style={{ border: 'none' }}
                      onError={(e) => {
                        console.error('Erreur chargement PDF:', e);
                      }}
                    />
                    <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-center gap-4">
                      <p className="text-xs text-slate-600">Le PDF ne s'affiche pas ?</p>
                      <a
                        href={docViewer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-lg text-xs font-bold hover:bg-[#0042a3] transition-colors"
                      >
                        <ExternalLink size={14} />
                        Ouvrir dans un nouvel onglet
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-[75vh] md:h-[70vh] rounded-xl border border-slate-200 flex flex-col items-center justify-center bg-slate-50">
                    <File size={48} className="text-slate-400 mb-4" />
                    <p className="text-sm font-bold text-slate-700 mb-2">{docViewer.name}</p>
                    <button
                      type="button"
                      onClick={() => downloadDocument(docViewer.downloadUrl || docViewer.url, docViewer.name)}
                      className="px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-bold hover:bg-[#0042a3] transition-colors flex items-center gap-2"
                    >
                      <Download size={16} />
                      Télécharger le fichier
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Action bar supprimée */}

      {/* Save Toast */}
      {showSaveToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
            <span className="text-sm font-bold">Modifications enregistrées avec succès</span>
          </div>
        </div>
      )}
    </div>
  )
}
