import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import {
  ChevronLeft, ChevronRight, AlertCircle, Save, Calendar, Building2, Package, Printer,
  ClipboardCheck, Eye, XCircle, PenTool, FileText, Cpu, UserRound, Lock, RefreshCw, Check, Hash,
} from 'lucide-react'
import logo from '../../assets/logo.jpg'
import FicheViewport from './components/FicheViewport'
import MobileFichePreviewModal from '../../components/intervention/MobileFichePreviewModal'
import SignatureCropModal from '../../components/intervention/SignatureCropModal'
import {
  INTERVENTION_STATUS_CONFIG as statusConfig,
  INTERVENTION_STATUS_TO_SECTION as statusToSection,
  formatClientAddress,
  mapRawToInterventionData,
} from '../../utils/intervention'
import { buildFichePrintHtml } from './fichePrintTemplate'
import { ClientInfoFields, EquipmentInfoFields } from './sections/SectionInfoFields'
import SectionDiagnostic from './sections/SectionDiagnostic'
import SectionArticles from './sections/SectionArticles'
import SectionSignatures from './sections/SectionSignatures'
import { useInterventionData } from './hooks/useInterventionData'
import { useInterventionSave } from './hooks/useInterventionSave'
import { DossierSection, ConfirmDialog } from './components/interventionUi'
import ClosureChecklist, { buildClosureChecklist } from './components/ClosureChecklist'
import { getInterventionType } from './components/interventionTypes'

const SIGNATURE_TYPES = {
  technician: 'TECHNICIAN_SIGNATURE',
  client: 'CLIENT_SIGNATURE_STAMP',
}

// `sections` est aussi transmis à useInterventionSave : conserver id/title.
const sections = [
  { id: 1, title: 'Informations', description: 'Client & équipement', icon: Building2 },
  { id: 2, title: 'Diagnostic', description: 'Analyse & expertise', icon: AlertCircle },
  { id: 3, title: 'Articles', description: 'Pièces & main d’œuvre', icon: Package },
  { id: 4, title: 'Clôture', description: 'Signatures & validation', icon: ClipboardCheck },
]

const SECTION_COPY = {
  1: { title: 'Client & équipement', description: 'Coordonnées du client et identification de l’équipement concerné.' },
  2: { title: 'Diagnostic & travaux', description: 'Nature de la panne, solution apportée, essais et durée sur site.' },
  3: { title: 'Articles & tarification', description: 'Pièces consommées et coût de la main d’œuvre.' },
  4: { title: 'Clôture & signatures', description: 'Validation de l’intervention par le technicien et le client.' },
}

const STATUS_FLOW = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'TESTING', 'CLOSED']

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function StatusProgress({ status }) {
  const currentIndex = Math.max(0, STATUS_FLOW.indexOf(status))
  return (
    <ol className="flex items-center gap-1" aria-label="Progression du statut">
      {STATUS_FLOW.map((s, i) => {
        const done = i <= currentIndex
        return (
          <li key={s} className="flex flex-1 flex-col gap-1.5" aria-current={i === currentIndex ? 'step' : undefined}>
            <span className={`h-1.5 rounded-full ${done ? (s === 'CLOSED' ? 'bg-teal-400' : 'bg-brand-400') : 'bg-white/15'}`} />
            <span className={`hidden truncate text-[10px] font-semibold sm:block ${i === currentIndex ? 'text-white' : done ? 'text-brand-100/80' : 'text-brand-100/40'}`}>
              {statusConfig[s]?.label || s}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function SummaryItem({ icon, label, value, sub }) {
  const Icon = icon
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-200 ring-1 ring-inset ring-white/15">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-100/60">{label}</p>
        <p className={`truncate text-sm font-semibold ${value ? 'text-white' : 'italic text-brand-100/50'}`}>{value || 'Non renseigné'}</p>
        {sub && <p className="truncate text-xs text-brand-100/70">{sub}</p>}
      </div>
    </div>
  )
}

export default function InterventionDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const assignedTechnicianName = location.state?.assignedTechnicianName?.trim?.() || ''
  const missionId = location.state?.missionId
  const returnTo = location.state?.returnTo
  const isEmployeeHistoryEditFlow = Boolean(returnTo)
  const isReadOnlyView = Boolean(location.state?.readOnly)

  const {
    dbEntry, setDbEntry,
    clients, machines,
    signatures, setSignatures,
    assignedMissionEmployees,
  } = useInterventionData({ id, missionId, assignedTechnicianName })

  const [completedUpTo, setCompletedUpTo] = useState(() => (dbEntry?.completedUpToSection || 1))
  const [activeSection, setActiveSection] = useState(() => statusToSection[dbEntry?.status] || 1)
  const [status, setStatus] = useState(dbEntry?.status || 'PENDING')
  const [isEditing, setIsEditing] = useState(() => {
    if (isReadOnlyView) return false
    if (isEmployeeHistoryEditFlow) return true
    return (dbEntry?.status || 'PENDING') !== 'CLOSED'
  })
  const [laborPrice, setLaborPrice] = useState(dbEntry?.laborPrice || 0)
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [uploadingSignatureType, setUploadingSignatureType] = useState(null)
  const [cropState, setCropState] = useState(null) // { file, type, title }
  const [notice, setNotice] = useState(null) // { tone, title, message }
  const [signatureToDelete, setSignatureToDelete] = useState(null)
  const [interventionData, setInterventionData] = useState(() => mapRawToInterventionData(dbEntry, assignedMissionEmployees || assignedTechnicianName))
  const signatureInputRefs = useRef({})

  const showError = (message, title = 'Une erreur est survenue') => setNotice({ tone: 'danger', title, message })

  const selectedClient = useMemo(
    () => clients.find((c) => String(c.id) === String(interventionData.clientId)),
    [clients, interventionData.clientId],
  )
  const selectedMachine = useMemo(
    () => machines.find((m) => String(m.id) === String(interventionData.machineId)),
    [machines, interventionData.machineId],
  )

  const [parts, setParts] = useState(dbEntry?.parts || [])

  const { isSaving, handleSave } = useInterventionSave({
    id, interventionData, parts, laborPrice, status, completedUpTo, sections, missionId,
    setDbEntry, setStatus, setIsEditing, navigate, onError: showError,
  })
  const [showClosureChecklist, setShowClosureChecklist] = useState(false)

  const computeTotalTime = useCallback((start, end) => {
    if (!start || !end) return ''
    const [sh, sm] = String(start).split(':').map((v) => Number(v))
    const [eh, em] = String(end).split(':').map((v) => Number(v))
    if (![sh, sm, eh, em].every((n) => Number.isFinite(n))) return ''
    let diff = (eh * 60 + em) - (sh * 60 + sm)
    if (diff < 0) diff += 24 * 60
    return `${Math.floor(diff / 60)}h${String(diff % 60).padStart(2, '0')}m`
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setInterventionData((prev) => ({ ...prev, [name]: value }))
  }

  useEffect(() => {
    setCompletedUpTo(dbEntry?.completedUpToSection || 1)
    setActiveSection(statusToSection[dbEntry?.status] || 1)
    setStatus(dbEntry?.status || 'PENDING')
    setLaborPrice(dbEntry?.laborPrice || 0)
    setParts(Array.isArray(dbEntry?.parts) ? dbEntry.parts : [])
    setInterventionData(mapRawToInterventionData(dbEntry, assignedMissionEmployees || assignedTechnicianName))
  }, [dbEntry, assignedMissionEmployees, assignedTechnicianName])

  useEffect(() => {
    if (!selectedClient) return
    setInterventionData((prev) => ({
      ...prev,
      clientName: selectedClient.name || prev.clientName,
      clientCode: selectedClient.code || prev.clientCode,
      clientPhone: selectedClient.phone || prev.clientPhone,
      clientEmail: selectedClient.email || prev.clientEmail,
      clientAddress: formatClientAddress(selectedClient) || prev.clientAddress,
    }))
  }, [selectedClient])

  useEffect(() => {
    if (!selectedMachine) return
    setInterventionData((prev) => ({
      ...prev,
      machineType: selectedMachine.designation || prev.machineType,
      machineBrand: selectedMachine.brand || prev.machineBrand,
      machineModel:
        (String(selectedMachine.model || '').trim() ? selectedMachine.model : selectedMachine.year) || prev.machineModel,
      serialNumber: selectedMachine.serialNumber || prev.serialNumber,
      siteName: prev.siteName || selectedMachine.site,
    }))
  }, [selectedMachine])

  useEffect(() => {
    const computed = computeTotalTime(interventionData.startTime, interventionData.endTime)
    if (computed !== interventionData.totalTime) {
      setInterventionData((prev) => ({ ...prev, totalTime: computed }))
    }
  }, [computeTotalTime, interventionData.startTime, interventionData.endTime, interventionData.totalTime])

  const addPart = () => setParts([...parts, { id: Date.now(), reference: '', designation: '', quantity: 1 }])
  const removePart = (partId) => setParts(parts.filter((p) => p.id !== partId))
  const updatePart = (partId, field, value) => setParts(parts.map((p) => (p.id === partId ? { ...p, [field]: value } : p)))

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=960,height=700')
    if (!printWindow) {
      showError('Le navigateur a bloqué la fenêtre d’impression. Autorisez les fenêtres pop-up pour ce site puis réessayez.', 'Impression impossible')
      return
    }
    printWindow.document.open()
    printWindow.document.write(buildFichePrintHtml({ interventionData, parts, laborPrice, logo }))
    printWindow.document.close()
    printWindow.focus()
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true)
    try {
      const response = await apiFetch(`/interventions/${id}/pdf`, { method: 'GET' })
      if (!response.ok) {
        showError('Le serveur n’a pas pu générer la fiche PDF.', 'Téléchargement impossible')
        return
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `fiche-intervention-${id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      showError('Impossible de joindre le serveur pour télécharger le PDF.', 'Téléchargement impossible')
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const getSignatureByType = useCallback((type) => (
    signatures.find((signature) => signature?.type === type && signature?.isActive !== false)
  ), [signatures])

  const technicianSignatureUrl = useMemo(() => getSignatureByType(SIGNATURE_TYPES.technician)?.url || '', [getSignatureByType])
  const clientSignatureUrl = useMemo(() => getSignatureByType(SIGNATURE_TYPES.client)?.url || '', [getSignatureByType])

  const canManageSignatures = isEditing && !isReadOnlyView && status !== 'CLOSED'
  const isLocked = isReadOnlyView || (status === 'CLOSED' && !isEditing)

  const buildSignaturePayloadMeta = (type) => {
    if (type === SIGNATURE_TYPES.technician) {
      return { signerName: interventionData.technicianName || assignedMissionEmployees || 'Technicien', signerRole: 'Technicien' }
    }
    return { signerName: interventionData.requestorName || interventionData.clientName || 'Client', signerRole: 'Client' }
  }

  const handleSignatureFileChange = (type, event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type?.startsWith('image/')) {
      showError('Le fichier choisi n’est pas une image. Sélectionnez une photo ou un scan de la signature.', 'Format non pris en charge')
      return
    }
    const title = type === SIGNATURE_TYPES.technician ? 'Signature du technicien' : 'Signature et cachet client'
    setCropState({ file, type, title })
  }

  const handleCropValidate = async (result) => {
    const crop = cropState
    setCropState(null)
    if (!crop || !result?.blob) return
    const { type } = crop

    const meta = buildSignaturePayloadMeta(type)
    const formData = new FormData()
    formData.append('type', type)
    formData.append('signerName', meta.signerName)
    formData.append('signerRole', meta.signerRole)
    formData.append('signedAt', new Date().toISOString())
    formData.append('image', result.blob, `${type}.png`)

    setUploadingSignatureType(type)
    try {
      const response = await apiFetch(`/interventions/${id}/signatures`, { method: 'POST', body: formData, timeoutMs: 60_000 })
      if (!response.ok) {
        showError('La signature n’a pas pu être enregistrée.', 'Signature non enregistrée')
        return
      }
      const apiResult = await response.json().catch(() => null)
      const nextSignature = apiResult?.signature || apiResult
      if (nextSignature?.id) {
        setSignatures((prev) => [
          nextSignature,
          ...prev.filter((signature) => signature?.id !== nextSignature.id && signature?.type !== type),
        ])
      } else {
        const reload = await apiFetch(`/interventions/${id}/signatures`, { cache: 'no-store' })
        if (reload.ok) {
          const data = await reload.json().catch(() => [])
          setSignatures(Array.isArray(data) ? data : [])
        }
      }
    } catch {
      showError('Impossible de joindre le serveur pour enregistrer la signature.', 'Signature non enregistrée')
    } finally {
      setUploadingSignatureType(null)
    }
  }

  const requestDeleteSignature = (signature) => {
    if (!signature?.id || !canManageSignatures) return
    setSignatureToDelete(signature)
  }

  const confirmDeleteSignature = async () => {
    const signature = signatureToDelete
    if (!signature) return
    setUploadingSignatureType(signature.type)
    try {
      const response = await apiFetch(`/interventions/${id}/signatures/${signature.id}`, { method: 'DELETE' })
      if (!response.ok) {
        showError('La signature n’a pas pu être supprimée.', 'Suppression impossible')
        return
      }
      setSignatures((prev) => prev.filter((item) => item?.id !== signature.id))
    } catch {
      showError('Impossible de joindre le serveur pour supprimer la signature.', 'Suppression impossible')
    } finally {
      setUploadingSignatureType(null)
      setSignatureToDelete(null)
    }
  }

  const goBack = () => {
    if (isEmployeeHistoryEditFlow && returnTo) return navigate(returnTo)
    if (location.state?.fromMissionDetails && missionId) return navigate(`/missions/${missionId}`)
    return navigate('/interventions')
  }

  const goToSection = (sectionId) => {
    setActiveSection(sectionId)
    document.getElementById('dossier-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const isReadOnlyInfo = Boolean(isEmployeeHistoryEditFlow || isReadOnlyView)
  const sectionRenderers = {
    1: () => (
      <div className="flex flex-col gap-7">
        <ClientInfoFields interventionData={interventionData} selectedClient={selectedClient} clients={clients} isReadOnly={isReadOnlyInfo} handleChange={handleChange} />
        <EquipmentInfoFields interventionData={interventionData} selectedMachine={selectedMachine} machines={machines} isReadOnly={isReadOnlyInfo} handleChange={handleChange} />
      </div>
    ),
    2: () => <SectionDiagnostic interventionData={interventionData} handleChange={handleChange} setInterventionData={setInterventionData} />,
    3: () => <SectionArticles parts={parts} addPart={addPart} removePart={removePart} updatePart={updatePart} laborPrice={laborPrice} setLaborPrice={setLaborPrice} />,
    4: () => (
      <SectionSignatures
        getSignatureByType={getSignatureByType}
        uploadingSignatureType={uploadingSignatureType}
        canManageSignatures={canManageSignatures}
        signatureInputRefs={signatureInputRefs}
        handleSignatureFileChange={handleSignatureFileChange}
        handleDeleteSignature={requestDeleteSignature}
      />
    ),
  }

  const currentStatus = statusConfig[status] || statusConfig.PENDING
  const typeInfo = getInterventionType(interventionData.interventionType)
  const TypeIcon = typeInfo?.icon || FileText
  const activeCopy = SECTION_COPY[activeSection]
  const ActiveIcon = sections[activeSection - 1]?.icon

  const sectionDone = {
    1: Boolean(interventionData.clientName && interventionData.machineType),
    2: Boolean(String(interventionData.interventionDetail || '').trim()),
    3: parts.length > 0 || Number(laborPrice) > 0,
    4: Boolean(technicianSignatureUrl && clientSignatureUrl),
  }

  const closureItems = buildClosureChecklist({ interventionData, technicianSignatureUrl, clientSignatureUrl })
  const closureReady = closureItems.every((item) => item.done)
  const sectionTitles = Object.fromEntries(sections.map((section) => [section.id, section.title]))
  const confirmClosure = async () => {
    const ok = await handleSave({ finalize: true })
    if (ok) setShowClosureChecklist(false)
  }
  const goToSectionFromChecklist = (sectionId) => {
    setShowClosureChecklist(false)
    goToSection(sectionId)
  }

  const saveButton = isEmployeeHistoryEditFlow ? (
    <button type="button" onClick={() => handleSave({ exitEdit: true, returnTo })} disabled={isSaving} className="ui-btn-primary">
      {isSaving ? <RefreshCw size={16} className="animate-spin" aria-hidden="true" /> : <PenTool size={16} aria-hidden="true" />}
      <span className="hidden md:inline">Modifier</span>
    </button>
  ) : isReadOnlyView ? null : (
    <button type="button" onClick={() => status !== 'CLOSED' && handleSave()} disabled={isSaving || status === 'CLOSED'} className="ui-btn-primary">
      {status === 'CLOSED' ? <Lock size={16} aria-hidden="true" /> : isSaving ? <RefreshCw size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
      <span className="hidden md:inline">{status === 'CLOSED' ? 'Clôturée' : isSaving ? 'Enregistrement…' : 'Enregistrer'}</span>
    </button>
  )

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 border-b border-line bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={goBack} className="ui-icon-btn h-10 w-10 shrink-0" aria-label="Retour">
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="ui-eyebrow hidden sm:block">Dossier SAV</p>
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate font-display text-lg font-bold tracking-tight text-ink sm:text-xl">{interventionData.ficheNumber || 'Intervention'}</h1>
              <span className={`ui-badge hidden shrink-0 sm:inline-flex ${currentStatus.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.dot}`} aria-hidden="true" />
                {currentStatus.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={handlePrint} className="ui-btn-secondary" aria-label="Imprimer la fiche">
            <Printer size={16} aria-hidden="true" /> <span className="hidden lg:inline">Imprimer</span>
          </button>
          <button type="button" onClick={handleDownloadPdf} disabled={isDownloadingPdf} className="ui-btn-secondary" aria-label="Télécharger le PDF">
            {isDownloadingPdf ? <RefreshCw size={16} className="animate-spin" aria-hidden="true" /> : <FileText size={16} aria-hidden="true" />}
            <span className="hidden lg:inline">{isDownloadingPdf ? 'Génération…' : 'PDF'}</span>
          </button>
          {saveButton}
        </div>
      </header>

      <div className="flex min-w-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-1 flex-col gap-5 px-4 py-5 sm:px-7 sm:py-7">
            {/* Synthèse du dossier */}
            <section aria-label="Synthèse du dossier" className="relative overflow-hidden rounded-2xl bg-navy text-white shadow-raised">
              <div className="ui-blueprint pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
              <div className="relative flex flex-col gap-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 ring-1 ring-inset ring-white/20">
                      <TypeIcon size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-display text-lg font-bold leading-tight">{typeInfo?.label || interventionData.interventionType || 'Intervention'}</p>
                      <p className="flex items-center gap-1.5 text-xs text-brand-100/70">
                        <Calendar size={12} aria-hidden="true" /> {formatDate(interventionData.interventionDate) || 'Date non planifiée'}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-inset ring-white/15 sm:hidden">
                    <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.dot}`} aria-hidden="true" /> {currentStatus.label}
                  </span>
                  {isLocked && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-inset ring-white/15">
                      <Lock size={12} aria-hidden="true" /> Lecture seule
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                  <SummaryItem icon={Building2} label="Client" value={interventionData.clientName} sub={interventionData.siteName} />
                  <SummaryItem icon={Cpu} label="Équipement" value={interventionData.machineType} sub={interventionData.serialNumber ? `S/N ${interventionData.serialNumber}` : interventionData.machineBrand} />
                  <SummaryItem icon={UserRound} label="Technicien" value={interventionData.technicianName} sub={interventionData.totalTime ? `Durée ${interventionData.totalTime}` : null} />
                </div>
                <StatusProgress status={status} />
              </div>
            </section>

            {/* Navigation entre sections */}
            <nav aria-label="Sections du dossier">
              <div role="tablist" className="grid grid-cols-4 gap-1 rounded-2xl border border-line bg-white p-1.5 shadow-card">
                {sections.map((section) => {
                  const active = section.id === activeSection
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      type="button"
                      role="tab"
                      id={`tab-${section.id}`}
                      aria-selected={active}
                      aria-controls="dossier-content"
                      onClick={() => goToSection(section.id)}
                      className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1.5 py-2 text-center transition-colors md:flex-row md:gap-2.5 md:px-3 md:py-2.5 md:text-left xl:flex-col xl:gap-1.5 xl:text-center 2xl:flex-row 2xl:gap-2.5 2xl:text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 ${active ? 'bg-navy text-white' : 'text-ink-muted hover:bg-slate-50 hover:text-ink'}`}
                    >
                      <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-white/10' : 'bg-slate-100'}`}>
                        <Icon size={15} aria-hidden="true" />
                        {sectionDone[section.id] && (
                          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-teal-500 text-white ring-2 ring-white" aria-label="Section renseignée">
                            <Check size={8} strokeWidth={3.5} aria-hidden="true" />
                          </span>
                        )}
                      </span>
                      <span className="w-full min-w-0">
                        <span className="block truncate text-xs font-semibold sm:text-sm">{section.title}</span>
                        <span className={`hidden truncate text-[11px] md:block xl:hidden 2xl:block ${active ? 'text-brand-100/80' : 'text-ink-faint'}`}>{section.description}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </nav>

            <div id="dossier-content" role="tabpanel" aria-labelledby={`tab-${activeSection}`} className="scroll-mt-20">
              <fieldset disabled={isLocked} className="contents">
                <DossierSection
                  key={activeSection}
                  index={activeSection}
                  icon={ActiveIcon}
                  title={activeCopy.title}
                  description={activeCopy.description}
                  className="animate-fade-up"
                >
                  {sectionRenderers[activeSection]?.()}
                </DossierSection>
              </fieldset>
            </div>

            <div className="sticky bottom-0 z-10 -mx-4 mt-auto flex items-center gap-2 border-t border-line bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:bg-white sm:shadow-card">
              <button type="button" onClick={() => goToSection(Math.max(activeSection - 1, 1))} disabled={activeSection === 1} className="ui-btn-secondary">
                <ChevronLeft size={16} aria-hidden="true" /> <span className="hidden sm:inline">Précédent</span>
              </button>
              <button type="button" onClick={() => setShowMobilePreview(true)} className="ui-btn-secondary xl:hidden" aria-label="Aperçu de la fiche">
                <Eye size={16} aria-hidden="true" /> <span className="hidden sm:inline">Aperçu</span>
              </button>
              <p className="hidden flex-1 text-center text-xs font-medium text-ink-muted md:block xl:hidden 2xl:block">
                Section <span className="font-semibold text-ink tabular-nums">{activeSection}</span> sur {sections.length}
              </p>
              <div className="flex flex-1 justify-end gap-2 md:flex-none">
                {activeSection < sections.length ? (
                  <button type="button" onClick={() => goToSection(Math.min(activeSection + 1, sections.length))} className="ui-btn-primary flex-1 sm:flex-none">
                    {sections[activeSection]?.title} <ChevronRight size={16} aria-hidden="true" />
                  </button>
                ) : isEmployeeHistoryEditFlow ? (
                  <>
                    <button type="button" onClick={() => navigate(returnTo)} className="ui-btn-secondary">
                      <XCircle size={16} aria-hidden="true" /> Annuler
                    </button>
                    <button type="button" onClick={() => handleSave({ exitEdit: true, returnTo })} disabled={isSaving} className="ui-btn-primary">
                      <PenTool size={16} aria-hidden="true" /> Modifier
                    </button>
                  </>
                ) : isReadOnlyView ? (
                  <button type="button" onClick={() => navigate('/interventions')} className="ui-btn-secondary">
                    <ChevronLeft size={16} aria-hidden="true" /> Retour à la liste
                  </button>
                ) : (
                  <button type="button" onClick={() => status !== 'CLOSED' && setShowClosureChecklist(true)} disabled={isSaving || status === 'CLOSED'} className="ui-btn-primary flex-1 sm:flex-none">
                    {status === 'CLOSED' ? <Lock size={16} aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                    {status === 'CLOSED' ? 'Dossier clôturé' : 'Clôturer le dossier'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        <aside className="hidden w-[500px] min-w-0 shrink-0 border-l border-line bg-slate-100/80 xl:block 2xl:w-[600px]" aria-label="Aperçu de la fiche">
          <div className="sticky top-[4.375rem] flex h-[calc(100dvh-8.375rem)] w-full flex-col px-5 py-5 2xl:px-6">
            <FicheViewport
              fitHeight
              reference={<span className="ui-ref hidden 2xl:inline-flex"><Hash size={12} aria-hidden="true" /> {interventionData.ficheNumber}</span>}
              interventionData={interventionData}
              parts={parts}
              laborPrice={laborPrice}
              logo={logo}
              technicianSignatureUrl={technicianSignatureUrl}
              clientSignatureUrl={clientSignatureUrl}
            />
          </div>
        </aside>
      </div>

      {showMobilePreview && (
        <MobileFichePreviewModal
          onClose={() => setShowMobilePreview(false)}
          interventionData={interventionData}
          parts={parts}
          laborPrice={laborPrice}
          logo={logo}
          technicianSignatureUrl={technicianSignatureUrl}
          clientSignatureUrl={clientSignatureUrl}
        />
      )}

      {cropState && (
        <SignatureCropModal file={cropState.file} title={cropState.title} onCancel={() => setCropState(null)} onValidate={handleCropValidate} />
      )}

      <ConfirmDialog
        open={Boolean(signatureToDelete)}
        tone="danger"
        title="Supprimer cette signature ?"
        message="La signature sera retirée de la fiche. Elle devra être capturée à nouveau pour clôturer le dossier."
        confirmLabel="Supprimer"
        busy={Boolean(uploadingSignatureType)}
        busyLabel="Suppression…"
        onClose={() => !uploadingSignatureType && setSignatureToDelete(null)}
        onConfirm={confirmDeleteSignature}
      />
      <ConfirmDialog
        open={showClosureChecklist && !notice}
        tone={closureReady ? 'info' : 'warning'}
        title={closureReady ? 'Clôturer ce dossier ?' : 'Dossier incomplet'}
        confirmLabel="Clôturer définitivement"
        busy={isSaving}
        busyLabel="Clôture…"
        onClose={() => !isSaving && setShowClosureChecklist(false)}
        onConfirm={closureReady ? confirmClosure : undefined}
      >
        <ClosureChecklist items={closureItems} sectionTitles={sectionTitles} onGoToSection={goToSectionFromChecklist} />
      </ConfirmDialog>
      <ConfirmDialog
        open={Boolean(notice)}
        tone={notice?.tone}
        title={notice?.title}
        message={notice?.message}
        onClose={() => setNotice(null)}
      />
    </div>
  )
}
