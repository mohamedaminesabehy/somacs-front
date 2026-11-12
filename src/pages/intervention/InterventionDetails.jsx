import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import { 
  ChevronLeft, 
  AlertCircle, 
  Save,
  Calendar,
  Building2,
  Package,
  Printer,
  ClipboardCheck,
  ChevronRight,
  Eye,
  XCircle,
  PenTool,
  FileText
} from 'lucide-react'
import logo from '../../assets/logo.jpg'
import FicheContent from '../../components/intervention/FicheContent'
import MobileFichePreviewModal from '../../components/intervention/MobileFichePreviewModal'
import SignatureCropModal from '../../components/intervention/SignatureCropModal'
import HorizontalStepper from '../../components/common/HorizontalStepper'
import VerticalStepper from '../../components/common/VerticalStepper'
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
import { useZoomDetection } from './hooks/useZoomDetection'
import { useInterventionSave } from './hooks/useInterventionSave'


const SIGNATURE_TYPES = {
  technician: 'TECHNICIAN_SIGNATURE',
  client: 'CLIENT_SIGNATURE_STAMP',
}

const sections = [
  { id: 1, title: 'Informations', description: 'Client & Équipement', icon: Building2 },
  { id: 2, title: 'Diagnostic', description: 'Analyse & Expertise', icon: AlertCircle },
  { id: 3, title: 'Articles', description: 'Pièces utilisées', icon: Package },
  { id: 4, title: 'Clôture', description: 'Signatures & Validation', icon: ClipboardCheck },
]

function NavigationLeftButtons({ activeSection, setActiveSection, setShowMobilePreview }) {
  return (
    <div className="flex items-center gap-3 w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setActiveSection(prev => Math.max(prev - 1, 1))}
        disabled={activeSection === 1}
        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all ${
          activeSection === 1
            ? 'text-slate-300 cursor-not-allowed'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 shadow-sm hover:shadow-md border border-slate-200 sm:border-none'
        }`}
      >
        <ChevronLeft size={18} />
        <span className="sm:inline">Précédent</span>
      </button>

      <button
        onClick={() => setShowMobilePreview(true)}
        className="xl:hidden flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
      >
        <Eye size={18} />
        Aperçu
      </button>
    </div>
  )
}

// ── Shared fiche content (identical layout for both desktop preview and mobile modal) ──

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
  const uiZoomPercent = useZoomDetection()
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
  const [interventionData, setInterventionData] = useState(() => mapRawToInterventionData(dbEntry, assignedMissionEmployees || assignedTechnicianName))
  const signatureInputRefs = useRef({})

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
    setDbEntry, setStatus, setIsEditing, navigate,
  })

  const computeTotalTime = useCallback((start, end) => {
    if (!start || !end) return ''
    const [sh, sm] = String(start).split(':').map((v) => Number(v))
    const [eh, em] = String(end).split(':').map((v) => Number(v))
    if (![sh, sm, eh, em].every((n) => Number.isFinite(n))) return ''
    const startMinutes = sh * 60 + sm
    const endMinutes = eh * 60 + em
    let diff = endMinutes - startMinutes
    if (diff < 0) diff += 24 * 60
    const hours = Math.floor(diff / 60)
    const minutes = diff % 60
    return `${hours}h${String(minutes).padStart(2, '0')}m`
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setInterventionData(prev => ({ ...prev, [name]: value }))
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
        (String(selectedMachine.model || '').trim()
          ? selectedMachine.model
          : selectedMachine.year) || prev.machineModel,
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

  const useHorizontalProgress = uiZoomPercent > 80

  const addPart = () => {
    setParts([...parts, { id: Date.now(), reference: '', designation: '', quantity: 1 }])
  }

  const removePart = (partId) => {
    setParts(parts.filter(p => p.id !== partId))
  }

  const updatePart = (partId, field, value) => {
    setParts(parts.map(p => p.id === partId ? { ...p, [field]: value } : p))
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=960,height=700')
    if (!printWindow) {
      alert("Impossible d'ouvrir la fenetre d'impression.")
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
        alert('Erreur lors du telechargement du PDF.')
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
      alert('Impossible de telecharger le PDF.')
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const getSignatureByType = useCallback((type) => (
    signatures.find((signature) => signature?.type === type && signature?.isActive !== false)
  ), [signatures])

  const technicianSignatureUrl = useMemo(
    () => getSignatureByType(SIGNATURE_TYPES.technician)?.url || '',
    [getSignatureByType],
  )
  const clientSignatureUrl = useMemo(
    () => getSignatureByType(SIGNATURE_TYPES.client)?.url || '',
    [getSignatureByType],
  )

  const canManageSignatures = isEditing && !isReadOnlyView && status !== 'CLOSED'

  const buildSignaturePayloadMeta = (type) => {
    if (type === SIGNATURE_TYPES.technician) {
      return {
        signerName: interventionData.technicianName || assignedMissionEmployees || 'Technicien',
        signerRole: 'Technicien',
      }
    }
    return {
      signerName: interventionData.requestorName || interventionData.clientName || 'Client',
      signerRole: 'Client',
    }
  }

  const handleSignatureFileChange = (type, event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type?.startsWith('image/')) {
      alert('Veuillez selectionner une image de signature.')
      return
    }
    const title =
      type === SIGNATURE_TYPES.technician
        ? 'Signature du Technicien'
        : 'Signature et Cachet Client'
    // Open the crop step before uploading.
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
      const response = await apiFetch(`/interventions/${id}/signatures`, {
        method: 'POST',
        body: formData,
        timeoutMs: 60_000,
      })
      if (!response.ok) {
        alert("Erreur lors de l'enregistrement de la signature.")
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
      alert('Impossible de joindre le serveur pour la signature.')
    } finally {
      setUploadingSignatureType(null)
    }
  }

  const handleDeleteSignature = async (signature) => {
    if (!signature?.id || !canManageSignatures) return
    const confirmed = window.confirm('Supprimer cette signature ?')
    if (!confirmed) return

    setUploadingSignatureType(signature.type)
    try {
      const response = await apiFetch(`/interventions/${id}/signatures/${signature.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        alert('Erreur lors de la suppression de la signature.')
        return
      }
      setSignatures((prev) => prev.filter((item) => item?.id !== signature.id))
    } catch {
      alert('Impossible de joindre le serveur pour supprimer la signature.')
    } finally {
      setUploadingSignatureType(null)
    }
  }

  const renderSection1 = () => (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="pb-4 sm:pb-6 border-b-2 border-slate-100">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
          <Building2 className="text-brand-600" size={24} />
          Informations Client & \u00c9quipement
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">Coordonnées du client et identification de l'équipement concerné</p>
      </div>
      <ClientInfoFields
        interventionData={interventionData}
        selectedClient={selectedClient}
        clients={clients}
        isReadOnly={Boolean(isEmployeeHistoryEditFlow || isReadOnlyView)}
        handleChange={handleChange}
      />
      <EquipmentInfoFields
        interventionData={interventionData}
        selectedMachine={selectedMachine}
        machines={machines}
        isReadOnly={Boolean(isEmployeeHistoryEditFlow || isReadOnlyView)}
        handleChange={handleChange}
      />
    </div>
  )


  const renderSection2 = () => (
    <SectionDiagnostic interventionData={interventionData} handleChange={handleChange} setInterventionData={setInterventionData} />
  )


  const renderSection3 = () => (
    <SectionArticles parts={parts} addPart={addPart} removePart={removePart} updatePart={updatePart} laborPrice={laborPrice} setLaborPrice={setLaborPrice} />
  )

  const renderSection4 = () => (
    <SectionSignatures
      getSignatureByType={getSignatureByType}
      uploadingSignatureType={uploadingSignatureType}
      canManageSignatures={canManageSignatures}
      signatureInputRefs={signatureInputRefs}
      handleSignatureFileChange={handleSignatureFileChange}
      handleDeleteSignature={handleDeleteSignature}
    />
  )


  const sectionRenderers = {
    1: renderSection1,
    2: renderSection2,
    3: renderSection3,
    4: renderSection4,
  }

  const renderSectionContent = () => {
    const renderer = sectionRenderers[activeSection]
    return renderer ? renderer() : null
  }


  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-canvas">
      {/* --- HEADER --- */}
      <header className="z-30 flex shrink-0 items-center justify-between gap-3 border-b border-line bg-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3 sm:gap-6">
          <button 
            onClick={() => {
              if (isEmployeeHistoryEditFlow && returnTo) {
                navigate(returnTo)
                return
              }
              if (location.state?.fromMissionDetails && missionId) {
                navigate(`/missions/${missionId}`)
                return
              }
              navigate('/interventions')
            }}
            className="ui-icon-btn h-10 w-10 shrink-0"
          >
            <ChevronLeft size={20} className="sm:hidden" strokeWidth={2.5} />
            <ChevronLeft size={24} className="hidden sm:block" strokeWidth={2.5} />
          </button>
          <div className="min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight truncate">
                <span className="hidden sm:inline">Dossier </span>{interventionData.ficheNumber}
              </h1>
              <span className={`ui-badge w-fit ${statusConfig[status].color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[status].dot}`}></span>
                {statusConfig[status].label}
              </span>
            </div>
            <p className="text-slate-500 text-[10px] sm:text-sm font-semibold mt-0.5 flex items-center gap-2 truncate">
              <Calendar size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span className="truncate">Gestion du dossier SAV</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden lg:flex flex-col items-end text-right mr-4 pr-4 border-r-2 border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Technicien</span>
            <span className="text-sm font-black text-slate-700">{interventionData.technicianName || 'Non assigné'}</span>
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="ui-btn-secondary px-3 sm:px-4"
            >
              <Printer size={18} />
              <span className="hidden md:inline">Imprimer</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="ui-btn-primary px-3 sm:px-4 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileText size={16} />
              <span>{isDownloadingPdf ? 'Generation...' : 'PDF'}</span>
            </button>
          </div>
          
          {isEmployeeHistoryEditFlow ? (
            <>
              <button
                type="button"
                onClick={() => handleSave({ exitEdit: true, returnTo })}
                disabled={isSaving}
                className="ui-btn-primary px-3 sm:px-5"
              >
                <PenTool size={18} />
                <span className="hidden md:inline">Modifier</span>
              </button>
            </>
          ) : isReadOnlyView ? null : (
            <button
              onClick={() => {
                if (status === 'CLOSED') return
                handleSave()
              }}
              disabled={isSaving || status === 'CLOSED'}
className={`ui-btn-primary px-3 sm:px-5 ${status === 'CLOSED' ? 'opacity-70' : ''}`}
            >
              <Save size={18} />
              <span className="hidden md:inline">{status === 'CLOSED' ? 'Clôturée' : 'Enregistrer'}</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* --- HORIZONTAL STEPPER (MOBILE/TABLET) --- */}
        <HorizontalStepper steps={sections} currentStep={activeSection} alwaysVisible={useHorizontalProgress} />

        <div className="flex flex-1 overflow-hidden min-w-0">

        {/* --- SIDEBAR (DESKTOP) --- */}
        <VerticalStepper steps={sections} currentStep={activeSection} hidden={useHorizontalProgress} />

        {/* --- MAIN CONTENT --- */}
        <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto bg-canvas">
          <div className="mx-auto w-full max-w-4xl min-w-0 flex-1 px-4 py-5 sm:px-7 sm:py-7">
            <div className="h-full flex flex-col">
              <div className="flex-1">
<fieldset disabled={isReadOnlyView || (status === 'CLOSED' && !isEditing)} className="contents">
                  <div className="ui-card p-4 sm:p-6">{renderSectionContent()}</div>
                </fieldset>
              </div>

              {isEmployeeHistoryEditFlow && activeSection === sections.length ? (
                <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t-2 border-slate-200 flex flex-col gap-3 shrink-0">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <NavigationLeftButtons activeSection={activeSection} setActiveSection={setActiveSection} setShowMobilePreview={setShowMobilePreview} />
                  </div>

                  <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSave({ exitEdit: true, returnTo })}
                      disabled={isSaving}
                      className="w-full sm:w-72 flex items-center justify-center gap-2 px-8 sm:px-10 py-4 sm:py-4.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-brand-600 to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-200 hover:shadow-blue-300"
                    >
                      <PenTool size={18} />
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(returnTo)}
                      className="w-full sm:w-72 flex items-center justify-center gap-2 px-8 sm:px-10 py-4 sm:py-4.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-sm active:scale-95 bg-[#F7F3E8] hover:bg-[#F1E8D4] text-slate-700 border border-[#E9DEC4]"
                    >
                      <XCircle size={18} />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 flex shrink-0 flex-col items-center justify-between gap-3 border-t border-line pt-5 sm:flex-row">
                  <div className="order-2 sm:order-1">
                    <NavigationLeftButtons activeSection={activeSection} setActiveSection={setActiveSection} setShowMobilePreview={setShowMobilePreview} />
                  </div>
                  
                  {activeSection < sections.length ? (
                    <button
                      type="button"
                      onClick={() => setActiveSection(prev => Math.min(prev + 1, sections.length))}
                      className="w-full sm:w-auto order-1 sm:order-2 group flex items-center justify-center gap-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-brand-600 hover:to-blue-700 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl shadow-slate-300 hover:shadow-blue-300 active:scale-95"
                    >
                      Continuer
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                    </button>
                  ) : (
                    isReadOnlyView ? (
                      <button
                        type="button"
                        onClick={() => navigate('/interventions')}
                        className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-sm active:scale-95 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                      >
                        <ChevronLeft size={18} />
                        Retour
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (status === 'CLOSED') return
                          handleSave({ finalize: true })
                        }}
                        disabled={isSaving || status === 'CLOSED'}
                        className={`w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                          status === 'CLOSED'
                            ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-slate-300'
                            : 'bg-gradient-to-r from-brand-600 to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-200 hover:shadow-blue-300'
                        }`}
                      >
                        <Save size={18} />
                        {status === 'CLOSED' ? 'Clôturée' : 'Enregistrer'}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- DESKTOP PREVIEW --- */}
        <div className="hidden xl:flex w-[620px] bg-slate-100 border-l border-slate-200 flex-col items-center justify-start overflow-y-auto no-scrollbar py-8 px-6 min-w-0">
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Aperçu de la fiche officielle</h4>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-600"></div>
              </div>
            </div>
            
            <div className="w-full bg-white shadow-2xl rounded-none px-7 pt-5 pb-8 relative transition-all duration-700 overflow-hidden border border-slate-300 text-slate-900 leading-none" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
              <FicheContent
                interventionData={interventionData}
                parts={parts}
                laborPrice={laborPrice}
                logo={logo}
                technicianSignatureUrl={technicianSignatureUrl}
                clientSignatureUrl={clientSignatureUrl}
              />
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* --- MOBILE PREVIEW MODAL --- */}
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

      {/* --- SIGNATURE CROP MODAL --- */}
      {cropState && (
        <SignatureCropModal
          file={cropState.file}
          title={cropState.title}
          onCancel={() => setCropState(null)}
          onValidate={handleCropValidate}
        />
      )}
    </div>
  )
}
