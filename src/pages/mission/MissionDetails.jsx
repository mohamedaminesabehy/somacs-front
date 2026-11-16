import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Calendar, CheckCircle2, ClipboardList, Hash, X } from 'lucide-react'
import {
  MISSION_PRIORITY_CONFIG as PRIORITY_CONFIG,
  MISSION_STATUS_CONFIG as STATUS_CONFIG,
} from '../../constants/missionConstants'
import { apiFetch, getAuthToken, isAuthTokenUsable } from '../../api/apiClient'
import LoginRequiredModal from '../../components/auth/LoginRequiredModal'
import { useMissionDetailsData } from './hooks/useMissionDetailsData'
import { useMissionStatusActions } from './hooks/useMissionStatusActions'
import { ROLE_TECHNICIEN, buildTeamMembers, normalizeRole, readStoredUser } from './details/missionDetailsUtils'
import MissionHero from './details/MissionHero'
import MissionActionPanel from './details/MissionActionPanel'
import MissionInfoCard from './details/MissionInfoCard'
import MissionClientCard from './details/MissionClientCard'
import MissionTeamCard from './details/MissionTeamCard'
import MissionInterventionCard, { InterventionClosedDialog } from './details/MissionInterventionCard'
import MissionNotesCard from './details/MissionNotesCard'
import MissionDocumentsCard, { DocumentViewer } from './details/MissionDocumentsCard'

const CLOSED_DOC_VIEWER = { open: false, url: '', type: '', name: '', isPdf: false, downloadUrl: '', publicId: '' }

function MissionDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-canvas" aria-busy="true" aria-label="Chargement de la mission">
      <div className="bg-navy-900 px-4 pb-8 pt-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div className="h-9 w-9 rounded-lg bg-white/10" />
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="h-7 w-2/3 rounded bg-white/10" />
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-4 p-4 sm:p-6 lg:grid-cols-12">
        <div className="ui-skeleton h-64 rounded-2xl lg:col-span-4" />
        <div className="ui-skeleton h-64 rounded-2xl lg:col-span-8" />
      </div>
    </div>
  )
}

export default function MissionDetails({ allowUnauthenticated = false }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  // ── Authentication gate ─────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(() => isAuthTokenUsable(getAuthToken()))
  const [showLoginModal, setShowLoginModal] = useState(() => allowUnauthenticated && !isAuthTokenUsable(getAuthToken()))
  const [currentUser] = useState(readStoredUser)
  const isTechnician = normalizeRole(currentUser) === ROLE_TECHNICIEN
  const backPath = isTechnician ? '/missions/my' : '/missions'
  const backLabel = isTechnician ? 'Mes missions' : 'Missions'

  const handleModalLoginSuccess = () => {
    setIsAuthenticated(true)
    setShowLoginModal(false)
    // Use hard navigation to ensure the PWA reloads with the fresh auth token.
    // React Router navigate() fails in PWA mode because App.jsx state hasn't
    // re-rendered yet and the protected route still sees isAuthenticated=false.
    window.location.replace(`/missions/${id}`)
  }

  // ── Authenticated: normal mission details below ─────────────────────────────

  const data = useMissionDetailsData(id)
  const {
    mission, setMission, intervention, isLoadingMission,
    status, setStatus, notes, setNotes,
    groupedEmployeesDisplay,
    vehicleKilometrageDepart, setVehicleKilometrageDepart,
    vehicleKilometrageRetour, setVehicleKilometrageRetour,
    missionActionError, setMissionActionError,
    attachments, mileageEditingRef, refreshTimerRef,
    setGroupedEmployeesDisplay,
  } = data

  const {
    isSaving, showSaveToast, statusJustChangedTo, vehicleMileageError,
    handleStatusChange, handleSave,
  } = useMissionStatusActions({
    mission, setMission, status, setStatus, notes,
    setGroupedEmployeesDisplay, setVehicleKilometrageDepart, setVehicleKilometrageRetour,
    vehicleKilometrageDepart, vehicleKilometrageRetour,
    setMissionActionError, refreshTimerRef, mileageEditingRef,
  })

  const [pendingStatus, setPendingStatus] = useState('')
  const onStatusChange = async (nextStatus) => {
    if (pendingStatus || nextStatus === status) return
    setPendingStatus(nextStatus)
    try {
      await handleStatusChange(nextStatus)
    } finally {
      setPendingStatus('')
    }
  }

  const [showInterventionPreview, setShowInterventionPreview] = useState(false)
  const [docViewer, setDocViewer] = useState(CLOSED_DOC_VIEWER)
  const [showInterventionClosedSuccess, setShowInterventionClosedSuccess] = useState(false)
  const [showStatusAttention, setShowStatusAttention] = useState(false)
  const [statusAttentionText, setStatusAttentionText] = useState('')

  // Consultation : un seul appel par ouverture de fiche (garde contre le double montage StrictMode).
  // Le backend ne retient que l'ouverture par le technicien assigné.
  const recordedViewRef = useRef(null)
  useEffect(() => {
    if (!isAuthenticated || !id || recordedViewRef.current === id) return
    recordedViewRef.current = id
    apiFetch(`/missions/${id}/view`, { method: 'POST', auth: true }).catch(() => {})
  }, [id, isAuthenticated])

  // Intervention closed success toast from navigation state: shown during render for each
  // navigation entry carrying the flag, then the flag is cleared from history by the effect below.
  const interventionClosedFlag = Boolean(location.state?.interventionClosedSuccess)
  const [handledClosedKey, setHandledClosedKey] = useState(null)
  if (interventionClosedFlag && handledClosedKey !== location.key) {
    setHandledClosedKey(location.key)
    setShowInterventionClosedSuccess(true)
  }

  useEffect(() => {
    if (!interventionClosedFlag) return
    navigate(
      { pathname: location.pathname, search: location.search },
      { replace: true, state: { ...location.state, interventionClosedSuccess: false } },
    )
  }, [interventionClosedFlag, location.pathname, location.search, location.state, navigate])

  useEffect(() => {
    if (!showInterventionClosedSuccess) return undefined
    const timer = window.setTimeout(() => setShowInterventionClosedSuccess(false), 4500)
    return () => window.clearTimeout(timer)
  }, [showInterventionClosedSuccess])

  // Status attention notification: triggered when the mission status changes, or when the
  // intervention status changes to a new non-empty value.
  const [lastAttention, setLastAttention] = useState({ status: '', interventionStatus: '', seq: 0 })
  if (status) {
    const interventionStatus = intervention?.status || ''
    const interventionChanged = Boolean(interventionStatus) && lastAttention.interventionStatus !== interventionStatus
    if (interventionChanged || lastAttention.status !== status) {
      setLastAttention({
        status,
        interventionStatus: interventionChanged ? interventionStatus : lastAttention.interventionStatus,
        seq: lastAttention.seq + 1,
      })
      setStatusAttentionText(`Statut actuel : ${status}`)
      setShowStatusAttention(true)
    }
  }

  useEffect(() => {
    if (!showStatusAttention) return undefined
    const timer = window.setTimeout(() => setShowStatusAttention(false), 3500)
    return () => window.clearTimeout(timer)
  }, [showStatusAttention, lastAttention.seq])

  // ── Unauthenticated preview (notification flow) ──────────────────────────────
  if (!isAuthenticated && allowUnauthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6">
        <LoginRequiredModal
          isOpen={showLoginModal}
          onLoginSuccess={handleModalLoginSuccess}
          message="Connectez-vous pour accéder aux détails complets de cette mission."
        />
        <div className="ui-card w-full max-w-md p-6 text-center sm:p-8">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
            <ClipboardList size={26} aria-hidden="true" />
          </span>
          <h1 className="font-display text-xl font-bold text-ink">Nouvelle mission reçue</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Vous avez reçu une notification pour la mission <span className="font-mono font-semibold text-ink-soft">#{id}</span>.
          </p>
          <ul className="my-6 flex flex-col gap-3 rounded-xl border border-line bg-canvas p-4 text-left text-sm text-ink-soft">
            <li className="flex items-center gap-3"><Hash size={14} aria-hidden="true" className="text-ink-faint" />Référence : #{id}</li>
            <li className="flex items-center gap-3"><Calendar size={14} aria-hidden="true" className="text-ink-faint" />Date : {new Date().toLocaleDateString('fr-FR')}</li>
            <li className="flex items-center gap-3"><AlertTriangle size={14} aria-hidden="true" className="text-amber-500" />Connectez-vous pour voir tous les détails</li>
          </ul>
          <button type="button" onClick={() => setShowLoginModal(true)} className="ui-btn-primary h-12 w-full">
            Se connecter pour voir les détails
          </button>
        </div>
      </div>
    )
  }

  // Loading and error states
  if (!mission && !isLoadingMission) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-ink-faint ring-1 ring-inset ring-line">
          <AlertTriangle size={30} aria-hidden="true" />
        </span>
        <p className="font-display text-lg font-bold text-ink">{missionActionError || 'Mission introuvable'}</p>
        <button type="button" onClick={() => navigate(backPath)} className="ui-btn-primary">
          <ArrowLeft size={16} aria-hidden="true" /> Retour à {backLabel.toLowerCase()}
        </button>
      </div>
    )
  }
  if (!mission) return <MissionDetailsSkeleton />

  const priority = PRIORITY_CONFIG[mission.priority] || PRIORITY_CONFIG['Moyenne']
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG['À faire']
  const teamMembers = buildTeamMembers(mission, groupedEmployeesDisplay || mission.employee)

  const openIntervention = () => {
    if (intervention.status === 'CLOSED') setShowInterventionPreview(true)
    else navigate(`/interventions/${intervention.id}`, { state: { assignedTechnicianName: mission.employee, missionId: mission.id, fromMissionDetails: true } })
  }

  const openDocument = (doc) => setDocViewer({
    open: true,
    url: doc.viewUrl || doc.url,
    type: doc.type,
    name: doc.name,
    isPdf: doc.isPdf,
    downloadUrl: doc.downloadUrl,
    publicId: doc.publicId,
  })

  return (
    <div className="min-h-screen bg-canvas pb-10">
      <p className="sr-only" role="status" aria-live="polite">{showStatusAttention ? statusAttentionText : ''}</p>

      {showSaveToast && (
        <div className="fixed left-1/2 top-4 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-in fade-in slide-in-from-top-4" role="status">
          <div className="flex items-center gap-3 rounded-xl bg-navy-900 px-4 py-3 text-white shadow-raised">
            <CheckCircle2 size={18} aria-hidden="true" className="shrink-0 text-emerald-400" />
            <span className="text-sm font-semibold">{typeof showSaveToast === 'string' ? showSaveToast : 'Modifications enregistrées'}</span>
          </div>
        </div>
      )}

      {showInterventionClosedSuccess && (
        <div className="fixed left-1/2 top-4 z-[130] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-in fade-in slide-in-from-top-4" role="status">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-raised">
            <CheckCircle2 size={18} aria-hidden="true" className="shrink-0 text-emerald-600" />
            <span className="flex-1 text-sm font-semibold text-ink">L’intervention a été clôturée avec succès.</span>
            <button type="button" onClick={() => setShowInterventionClosedSuccess(false)} aria-label="Fermer" className="rounded-md p-1 text-ink-muted hover:bg-canvas">
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <MissionHero
        mission={mission}
        status={status}
        statusCfg={statusCfg}
        priority={priority}
        teamSize={teamMembers.length}
        onBack={() => navigate(backPath)}
        backLabel={backLabel}
      />

      <main className="mx-auto -mt-4 grid max-w-6xl grid-cols-1 gap-4 px-4 sm:px-6 lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-col gap-4 lg:col-span-5 lg:gap-6 xl:col-span-4">
          <div className="lg:sticky lg:top-4">
            <MissionActionPanel
              status={status}
              onStatusChange={onStatusChange}
              pendingStatus={pendingStatus}
              statusJustChangedTo={statusJustChangedTo}
              missionActionError={missionActionError}
              onDismissError={() => setMissionActionError('')}
              vehicle={mission.vehicle}
              vehicleKilometrageDepart={vehicleKilometrageDepart}
              setVehicleKilometrageDepart={setVehicleKilometrageDepart}
              vehicleKilometrageRetour={vehicleKilometrageRetour}
              setVehicleKilometrageRetour={setVehicleKilometrageRetour}
              vehicleMileageError={vehicleMileageError}
              mileageEditingRef={mileageEditingRef}
              showStatusAttention={showStatusAttention}
            />
          </div>
          <div className="hidden flex-col gap-4 lg:flex lg:gap-6">
            <MissionTeamCard members={teamMembers} vehicle={mission.vehicle} currentUserId={currentUser?.id} />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-7 lg:gap-6 xl:col-span-8">
          <MissionInfoCard mission={mission} status={status} priority={priority} />
          <div className={`grid grid-cols-1 gap-4 lg:gap-6 ${intervention ? 'xl:grid-cols-2' : ''}`}>
            <MissionClientCard mission={mission} intervention={intervention} />
            {intervention && <MissionInterventionCard intervention={intervention} onOpen={openIntervention} />}
            <div className="lg:hidden">
              <MissionTeamCard members={teamMembers} vehicle={mission.vehicle} currentUserId={currentUser?.id} />
            </div>
          </div>
          <MissionNotesCard notes={notes} setNotes={setNotes} onSave={handleSave} isSaving={isSaving} />
          <MissionDocumentsCard attachments={attachments} onView={openDocument} />
        </div>
      </main>

      {showInterventionPreview && intervention && (
        <InterventionClosedDialog
          interventionId={intervention.id}
          onClose={() => setShowInterventionPreview(false)}
          onGoToHistory={() => {
            setShowInterventionPreview(false)
            navigate(`/employees/${mission?.employeeId || 'me'}/history?highlight=${encodeURIComponent(intervention.id)}`)
          }}
        />
      )}

      {docViewer.open && <DocumentViewer doc={docViewer} onClose={() => setDocViewer(CLOSED_DOC_VIEWER)} />}
    </div>
  )
}
