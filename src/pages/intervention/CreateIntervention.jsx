import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import {
  ChevronRight, ChevronLeft, Check, User, Settings, AlertCircle, ClipboardCheck,
  Building2, Phone, MapPin, Cpu, Hash, Mail, Calendar, Eye, Users, PhoneCall,
  Pencil, RefreshCw, AlertTriangle, CheckCircle2, Barcode, Tag, Layers, ShieldCheck,
} from 'lucide-react'
import logo from '../../assets/logo.jpg'
import FicheViewport from './components/FicheViewport'
import MobileFichePreviewModal from '../../components/intervention/MobileFichePreviewModal'
import ClientSelectionModal from '../../components/client/ClientSelectionModal'
import ClientMachineSelector from '../../components/machine/ClientMachineSelector'
import AddClientMachineModal from '../../components/machine/AddClientMachineModal'
import HorizontalStepper from '../../components/common/HorizontalStepper'
import VerticalStepper from '../../components/common/VerticalStepper'
import { useZoomDetection } from './hooks/useZoomDetection'
import {
  DossierSection, FieldGroup, FormField, DataTile, InterventionTypePicker, ConfirmDialog,
} from './components/interventionUi'
import { getInterventionType } from './components/interventionTypes'

const steps = [
  { id: 1, title: 'Client', description: 'Identification', icon: User },
  { id: 2, title: 'Machine', description: 'Fiche technique', icon: Settings },
  { id: 3, title: 'Diagnostic', description: 'Analyse initiale', icon: AlertCircle },
  { id: 4, title: 'Validation', description: 'Récapitulatif', icon: ClipboardCheck },
]

function generateFicheNumber() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function initialsOf(name) {
  return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
}

/** Règles de validation par étape — mêmes exigences que l'ancien contrôle à la création. */
function validateStep(step, data) {
  const errors = {}
  if (step === 1 && !data.clientId) errors.clientId = 'Sélectionnez le client concerné.'
  if (step === 2 && !data.machineId) errors.machineId = 'Sélectionnez l’équipement concerné.'
  if (step === 3) {
    if (!data.interventionType) errors.interventionType = 'Choisissez un type d’intervention.'
    if (!String(data.problemDescription || '').trim()) errors.problemDescription = 'Décrivez le type de panne.'
  }
  return errors
}

function SelectionPrompt({ icon, title, description, actionLabel, onAction, error }) {
  const Icon = icon
  return (
    <div className={`flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-6 py-10 text-center ${error ? 'border-red-300 bg-red-50/40' : 'border-brand-200 bg-brand-50/30'}`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-card ring-1 ring-inset ring-line">
        <Icon size={24} aria-hidden="true" />
      </span>
      <div className="max-w-sm">
        <p className="font-display text-base font-bold text-ink">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
      </div>
      <button type="button" onClick={onAction} className="ui-btn-primary">
        <Icon size={16} aria-hidden="true" /> {actionLabel}
      </button>
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
          <AlertTriangle size={13} aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  )
}

function IdentityCard({ badge, title, subtitle, avatar, meta, onChange, changeLabel }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-navy text-white shadow-raised">
      <div className="ui-blueprint pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 font-display text-lg font-bold ring-1 ring-inset ring-white/20">
          {avatar}
        </span>
        <div className="min-w-0 flex-1">
          {badge && <span className="mb-1.5 inline-flex rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-brand-100 ring-1 ring-inset ring-white/15">{badge}</span>}
          <p className="truncate font-display text-lg font-bold leading-tight sm:text-xl">{title}</p>
          {subtitle && <p className="mt-0.5 truncate text-sm text-brand-100/80">{subtitle}</p>}
          {meta && <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-brand-50/90">{meta}</div>}
        </div>
        <button
          type="button"
          onClick={onChange}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-navy transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
        >
          <RefreshCw size={15} aria-hidden="true" /> {changeLabel}
        </button>
      </div>
    </div>
  )
}

function MetaItem({ icon, children }) {
  const Icon = icon
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Icon size={13} className="shrink-0 text-brand-300" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </span>
  )
}

function RecapBlock({ icon, title, step, onEdit, status, children }) {
  const Icon = icon
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-slate-50/70 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 ring-1 ring-inset ring-line">
            <Icon size={15} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Étape {step}</p>
            <p className="truncate text-sm font-bold text-ink">{title}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {status === 'ok'
            ? <CheckCircle2 size={16} className="text-teal-600" aria-label="Complet" />
            : <AlertTriangle size={16} className="text-red-600" aria-label="Incomplet" />}
          <button type="button" onClick={onEdit} className="ui-btn-ghost ui-btn-sm">
            <Pencil size={13} aria-hidden="true" /> Modifier
          </button>
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 p-4 sm:grid-cols-2">{children}</dl>
    </div>
  )
}

function RecapItem({ label, value, full, mono }) {
  const empty = value == null || String(value).trim() === ''
  return (
    <div className={`min-w-0 ${full ? 'sm:col-span-2' : ''}`}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className={`mt-0.5 break-words text-sm ${empty ? 'italic text-ink-faint' : 'font-medium text-ink'} ${mono && !empty ? 'font-mono' : ''}`}>
        {empty ? '—' : value}
      </dd>
    </div>
  )
}

const INITIAL_FORM = () => ({
  clientId: '',
  clientName: '',
  clientCode: '',
  clientPhone: '',
  clientEmail: '',
  clientAddress: '',
  siteName: '',
  requestorName: '',
  machineId: '',
  machineType: '',
  machineBrand: '',
  machineModel: '',
  serialNumber: '',
  problemDescription: '',
  telephoneDiagnostic: '',
  interventionDetail: '',
  interventionType: 'Réparation',
  interventionDate: new Date().toISOString().split('T')[0],
  totalTime: '',
  ficheNumber: generateFicheNumber(),
  technicianName: '',
  numEssai: '',
  essaiConcluant: null,
  laborPrice: '',
})

export default function CreateIntervention() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [maxReached, setMaxReached] = useState(1)
  const uiZoomPercent = useZoomDetection()
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false)
  const [showAddMachineModal, setShowAddMachineModal] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [confirmLeave, setConfirmLeave] = useState(false)

  const previewInterventionData = { ...formData, startTime: '', endTime: '' }
  const previewParts = []
  const previewLaborPrice = Number(formData.laborPrice) || ''
  const useHorizontalProgress = uiZoomPercent > 80

  const isDirty = Boolean(
    formData.clientId || formData.machineId || formData.problemDescription.trim()
    || formData.requestorName.trim() || formData.telephoneDiagnostic.trim(),
  )

  const stepStatus = useMemo(() => ({
    1: Object.keys(validateStep(1, formData)).length === 0,
    2: Object.keys(validateStep(2, formData)).length === 0,
    3: Object.keys(validateStep(3, formData)).length === 0,
  }), [formData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleClientSelect = (client) => {
    setFormData((prev) => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientCode: client.code,
      clientPhone: client.phone,
      clientEmail: client.email,
      clientAddress: String(client.address || '').trim()
        ? String(client.address || '').trim()
        : `${client.city}${client.zone ? `, ${client.zone}` : ''}`,
      // Réinitialiser la machine quand le client change
      machineId: '',
      machineType: '',
      machineBrand: '',
      machineModel: '',
      serialNumber: '',
      siteName: '',
    }))
    setErrors((prev) => ({ ...prev, clientId: undefined, machineId: undefined }))
    setIsClientModalOpen(false)
  }

  const handleClientCreated = (newClient) => {
    // Sélectionner automatiquement le client créé
    handleClientSelect(newClient)
    // Ouvrir automatiquement la modal d'ajout de machine
    setShowAddMachineModal(true)
  }

  const handleMachineSelect = (machine) => {
    setFormData((prev) => ({
      ...prev,
      machineId: machine.id,
      machineType: machine.designation,
      machineBrand: machine.brand,
      machineModel: String(machine.model || '').trim() ? machine.model : machine.year,
      serialNumber: machine.serialNumber,
      siteName: String(prev.siteName || '').trim() ? prev.siteName : (machine.site || ''),
    }))
    setErrors((prev) => ({ ...prev, machineId: undefined }))
  }

  const goToStep = (step) => {
    setCurrentStep(step)
    setMaxReached((m) => Math.max(m, step))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const nextStep = () => {
    const stepErrors = validateStep(currentStep, formData)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    goToStep(Math.min(currentStep + 1, steps.length))
  }
  const prevStep = () => goToStep(Math.max(currentStep - 1, 1))

  const requestLeave = () => {
    if (isDirty && !isSubmitting) setConfirmLeave(true)
    else navigate('/interventions')
  }

  const createIntervention = async () => {
    for (const step of [1, 2, 3]) {
      const stepErrors = validateStep(step, formData)
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors)
        goToStep(step)
        return
      }
    }
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const response = await apiFetch('/interventions', {
        method: 'POST',
        body: {
          status: 'PENDING',
          technicianName: formData.technicianName,
          interventionDate: formData.interventionDate,
          ficheNumber: formData.ficheNumber,
          totalTime: formData.totalTime,
          siteName: formData.siteName,
          requestorName: formData.requestorName,
          problemDescription: formData.problemDescription,
          telephoneDiagnostic: formData.telephoneDiagnostic,
          interventionType: formData.interventionType,
          interventionDetail: formData.interventionDetail,
          numEssai: formData.numEssai,
          essaiConcluant: formData.essaiConcluant,
          laborPrice: formData.laborPrice,
          clientId: formData.clientId || null,
          machineId: formData.machineId || null,
        },
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        setSubmitError(payload?.message || 'Erreur lors de la création du dossier.')
        return
      }
      const created = await response.json().catch(() => null)
      const createdId = created?.id
      const highlight = createdId ? `?highlight=${encodeURIComponent(createdId)}&toast=created` : '?toast=created'
      navigate(`/interventions${highlight}`, { state: { createdInterventionId: createdId } })
    } catch {
      setSubmitError('Impossible de joindre le serveur.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep1 = () => (
    <DossierSection
      index={1}
      icon={Building2}
      title="Informations du client"
      description="Identifiez le client, puis précisez le demandeur et le lieu d’intervention."
      actions={formData.clientId ? null : (
        <button type="button" onClick={() => setIsClientModalOpen(true)} className="ui-btn-secondary ui-btn-sm">
          <Users size={14} aria-hidden="true" /> Annuaire clients
        </button>
      )}
    >
      {formData.clientId ? (
        <IdentityCard
          badge={formData.clientCode}
          title={formData.clientName}
          subtitle={formData.clientAddress}
          avatar={initialsOf(formData.clientName)}
          onChange={() => setIsClientModalOpen(true)}
          changeLabel="Changer"
          meta={<>
            {formData.clientPhone && <MetaItem icon={Phone}>{formData.clientPhone}</MetaItem>}
            {formData.clientEmail && <MetaItem icon={Mail}>{formData.clientEmail}</MetaItem>}
          </>}
        />
      ) : (
        <SelectionPrompt
          icon={Users}
          title="Aucun client sélectionné"
          description="Recherchez un client existant dans l’annuaire ou créez-en un nouveau."
          actionLabel="Créer / Sélectionner un client"
          onAction={() => setIsClientModalOpen(true)}
          error={errors.clientId}
        />
      )}

      <FieldGroup title="Contact & localisation" icon={MapPin}>
        <FormField label="Demandeur" htmlFor="requestorName" icon={User} hint="Personne ayant signalé la demande.">
          <input id="requestorName" name="requestorName" value={formData.requestorName} onChange={handleChange} placeholder="Nom du responsable ou contact" className="ui-input w-full pl-10" />
        </FormField>
        <FormField label="Site / localisation" htmlFor="siteName" icon={MapPin} hint="Prérempli depuis la machine si disponible.">
          <input id="siteName" name="siteName" value={formData.siteName} onChange={handleChange} placeholder="Ex : Bloc opératoire, bâtiment B" className="ui-input w-full pl-10" />
        </FormField>
      </FieldGroup>

      {formData.clientId && (
        <FieldGroup title="Coordonnées enregistrées" icon={Hash} columns={3}>
          <DataTile label="Code client" value={formData.clientCode} mono icon={Hash} />
          <DataTile label="Téléphone" value={formData.clientPhone} icon={Phone} />
          <DataTile label="E-mail" value={formData.clientEmail} icon={Mail} />
          <DataTile label="Adresse d’intervention" value={formData.clientAddress} icon={MapPin} full />
        </FieldGroup>
      )}
    </DossierSection>
  )

  const renderStep2 = () => (
    <DossierSection
      index={2}
      icon={Cpu}
      title="Informations techniques"
      description={formData.clientId
        ? `Machines enregistrees pour ${formData.clientName || 'ce client'}. Selectionnez-en une ou ajoutez-en une nouvelle.`
        : "Revenez a l'etape precedente pour selectionner d'abord le client."}
    >
      <ClientMachineSelector
        clientId={formData.clientId}
        clientName={formData.clientName}
        selectedMachineId={formData.machineId}
        onSelect={(machine) => {
          if (!machine) {
            setFormData((prev) => ({
              ...prev,
              machineId: '', machineType: '', machineBrand: '',
              machineModel: '', serialNumber: '',
            }))
          } else {
            handleMachineSelect(machine)
          }
        }}
        error={errors.machineId}
        onRequestAddMachine={() => setShowAddMachineModal(true)}
      />

      {formData.machineId && (
        <FieldGroup title="Fiche technique" icon={Settings}>
          <DataTile label="Type de machine" value={formData.machineType} icon={Cpu} emphasis />
          <DataTile label="Marque" value={formData.machineBrand} icon={Tag} />
          <DataTile label="Modele" value={formData.machineModel} icon={Layers} />
          <DataTile label="Numero de serie" value={formData.serialNumber} icon={Barcode} mono />
        </FieldGroup>
      )}
    </DossierSection>
  )
  const renderStep3 = () => (
    <DossierSection
      index={3}
      icon={AlertCircle}
      title="Intervention & diagnostic"
      description="Qualifiez la demande : nature de l’intervention, panne signalée et premier diagnostic."
    >
      <InterventionTypePicker value={formData.interventionType} onChange={handleChange} />
      {errors.interventionType && <p role="alert" className="-mt-3 text-xs font-medium text-red-600">{errors.interventionType}</p>}

      <FieldGroup title="Panne signalée" icon={AlertTriangle} columns={1}>
        <FormField
          label="Type de panne"
          htmlFor="problemDescription"
          required
          error={errors.problemDescription}
          counter={`${formData.problemDescription.length} car.`}
        >
          <textarea
            id="problemDescription"
            name="problemDescription"
            value={formData.problemDescription}
            onChange={handleChange}
            aria-invalid={Boolean(errors.problemDescription)}
            placeholder="Décrivez précisément la panne constatée par le client…"
            className={`ui-textarea min-h-32 w-full resize-y leading-relaxed ${errors.problemDescription ? 'border-red-300 ring-4 ring-red-100' : ''}`}
          />
        </FormField>
        <FormField label="Diagnostic téléphonique" htmlFor="telephoneDiagnostic" icon={PhoneCall} hint="Facultatif — résumé de l’échange avant le déplacement.">
          <textarea
            id="telephoneDiagnostic"
            name="telephoneDiagnostic"
            value={formData.telephoneDiagnostic}
            onChange={handleChange}
            placeholder="Premières vérifications réalisées à distance…"
            className="ui-textarea min-h-24 w-full resize-y pl-10 leading-relaxed"
          />
        </FormField>
      </FieldGroup>

      <FieldGroup title="Planification" icon={Calendar}>
        <FormField label="Date d’intervention" htmlFor="interventionDate" icon={Calendar}>
          <input id="interventionDate" type="date" name="interventionDate" value={formData.interventionDate} onChange={handleChange} className="ui-input w-full pl-10" />
        </FormField>
        <DataTile label="N° de fiche (généré)" value={formData.ficheNumber} icon={Hash} mono />
      </FieldGroup>
    </DossierSection>
  )

  const renderStep4 = () => {
    const type = getInterventionType(formData.interventionType)
    const warnings = [
      !formData.requestorName.trim() && 'Aucun demandeur renseigné.',
      !formData.siteName.trim() && 'Aucun site / localisation précisé.',
      !formData.serialNumber && 'L’équipement n’a pas de numéro de série.',
    ].filter(Boolean)
    const blocking = [1, 2, 3].filter((s) => !stepStatus[s])

    return (
      <DossierSection
        index={4}
        icon={ClipboardCheck}
        title="Récapitulatif & validation"
        description="Vérifiez la synthèse du dossier avant sa création. Le statut initial sera « En attente »."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => goToStep(s)}
              className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-colors ${stepStatus[s] ? 'border-teal-200 bg-teal-50/60 hover:bg-teal-50' : 'border-red-200 bg-red-50/60 hover:bg-red-50'}`}
            >
              {stepStatus[s]
                ? <CheckCircle2 size={18} className="shrink-0 text-teal-600" aria-hidden="true" />
                : <AlertTriangle size={18} className="shrink-0 text-red-600" aria-hidden="true" />}
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{steps[s - 1].title}</span>
                <span className="block text-xs text-ink-muted">{stepStatus[s] ? 'Complet' : 'À compléter'}</span>
              </span>
            </button>
          ))}
        </div>

        <RecapBlock icon={Building2} title="Client" step={1} status={stepStatus[1] ? 'ok' : 'ko'} onEdit={() => goToStep(1)}>
          <RecapItem label="Client" value={formData.clientName} />
          <RecapItem label="Code client" value={formData.clientCode} mono />
          <RecapItem label="Demandeur" value={formData.requestorName} />
          <RecapItem label="Téléphone" value={formData.clientPhone} />
          <RecapItem label="Site" value={formData.siteName} />
          <RecapItem label="E-mail" value={formData.clientEmail} />
          <RecapItem label="Adresse" value={formData.clientAddress} full />
        </RecapBlock>

        <RecapBlock icon={Cpu} title="Machine" step={2} status={stepStatus[2] ? 'ok' : 'ko'} onEdit={() => goToStep(2)}>
          <RecapItem label="Type" value={formData.machineType} />
          <RecapItem label="Marque" value={formData.machineBrand} />
          <RecapItem label="Modèle" value={formData.machineModel} />
          <RecapItem label="N° de série" value={formData.serialNumber} mono />
        </RecapBlock>

        <RecapBlock icon={AlertCircle} title="Intervention & diagnostic" step={3} status={stepStatus[3] ? 'ok' : 'ko'} onEdit={() => goToStep(3)}>
          <RecapItem label="Type d’intervention" value={type?.label || formData.interventionType} />
          <RecapItem label="Date" value={formData.interventionDate} />
          <RecapItem label="Type de panne" value={formData.problemDescription} full />
          <RecapItem label="Diagnostic téléphonique" value={formData.telephoneDiagnostic} full />
          <RecapItem label="N° de fiche" value={formData.ficheNumber} mono />
          <RecapItem label="Technicien" value={formData.technicianName || 'Affecté plus tard via une mission'} />
        </RecapBlock>

        {blocking.length > 0 && (
          <div role="alert" className="flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3.5 ring-1 ring-inset ring-red-200">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
            <p className="text-sm font-medium text-red-800">
              Le dossier ne peut pas être créé : complétez {blocking.map((s) => `l’étape ${s}`).join(', ')}.
            </p>
          </div>
        )}
        {blocking.length === 0 && warnings.length > 0 && (
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3.5 ring-1 ring-inset ring-amber-200">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Points d’attention (non bloquants)</p>
              <ul className="mt-1 flex flex-col gap-0.5 text-xs text-amber-800">
                {warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </div>
          </div>
        )}
        {submitError && (
          <div role="alert" className="flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3.5 ring-1 ring-inset ring-red-200">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
            <p className="text-sm font-medium text-red-800">{submitError}</p>
          </div>
        )}
      </DossierSection>
    )
  }

  const stepRenderers = { 1: renderStep1, 2: renderStep2, 3: renderStep3, 4: renderStep4 }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-canvas">
      <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 border-b border-line bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={requestLeave} className="ui-icon-btn h-10 w-10 shrink-0" aria-label="Retour aux interventions">
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="ui-eyebrow hidden sm:block">Service après-vente · Nouveau dossier</p>
            <h1 className="truncate font-display text-lg font-bold tracking-tight text-ink sm:text-xl">Nouvelle intervention</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="ui-ref hidden md:inline-flex" title="Numéro de fiche">
            <Hash size={12} aria-hidden="true" /> {formData.ficheNumber}
          </span>
          <span className="hidden rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200 sm:inline-flex">
            Statut initial : En attente
          </span>
          <button type="button" onClick={() => setShowMobilePreview(true)} className="ui-btn-secondary ui-btn-sm xl:hidden">
            <Eye size={15} aria-hidden="true" /> <span className="hidden sm:inline">Aperçu</span>
          </button>
        </div>
      </header>

      <HorizontalStepper steps={steps} currentStep={currentStep} alwaysVisible={useHorizontalProgress} />

      <div className="flex min-w-0 flex-1 overflow-hidden">
        <VerticalStepper steps={steps} currentStep={currentStep} hidden={useHorizontalProgress} />

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-canvas">
          <div className="mx-auto w-full max-w-4xl min-w-0 flex-1 px-4 py-5 sm:px-7 sm:py-7">
            <form onSubmit={(e) => e.preventDefault()} className="flex h-full flex-col" noValidate>
              <div key={currentStep} className="flex-1 animate-fade-up">
                {stepRenderers[currentStep]?.()}
              </div>

              <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex shrink-0 items-center gap-2 border-t border-line bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:mt-6 sm:rounded-2xl sm:border sm:bg-white sm:px-4 sm:shadow-card">
                <button type="button" onClick={prevStep} disabled={currentStep === 1} className="ui-btn-secondary">
                  <ChevronLeft size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">Précédent</span>
                </button>
                <p className="hidden flex-1 text-center text-xs font-medium text-ink-muted sm:block">
                  Étape <span className="font-semibold text-ink tabular-nums">{currentStep}</span> sur {steps.length}
                  {maxReached > currentStep && <> · <button type="button" onClick={() => goToStep(maxReached)} className="font-semibold text-brand-700 hover:underline">reprendre à l’étape {maxReached}</button></>}
                </p>
                <div className="flex flex-1 justify-end gap-2 sm:flex-none">
                  <button type="button" onClick={() => setShowMobilePreview(true)} className="ui-btn-secondary xl:hidden" aria-label="Aperçu de la fiche">
                    <Eye size={16} aria-hidden="true" />
                  </button>
                  {currentStep < steps.length ? (
                    <button type="button" onClick={nextStep} className="ui-btn-primary flex-1 sm:flex-none">
                      Continuer <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  ) : (
                    <button type="button" onClick={createIntervention} disabled={isSubmitting} className="ui-btn-primary flex-1 sm:flex-none">
                      {isSubmitting ? <RefreshCw size={16} className="animate-spin" aria-hidden="true" /> : <Check size={16} strokeWidth={2.5} aria-hidden="true" />}
                      {isSubmitting ? 'Création…' : 'Créer le dossier'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        <aside className="hidden w-[440px] min-w-0 shrink-0 flex-col overflow-y-auto border-l border-line bg-slate-100/80 px-5 py-6 no-scrollbar xl:flex 2xl:w-[540px]" aria-label="Aperçu de la fiche">
          <FicheViewport
            reference={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-teal-700 ring-1 ring-inset ring-line">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" aria-hidden="true" /> Synchronisé
              </span>
            }
            interventionData={previewInterventionData}
            parts={previewParts}
            laborPrice={previewLaborPrice}
            logo={logo}
          />
        </aside>
      </div>

      {showMobilePreview && (
        <MobileFichePreviewModal
          onClose={() => setShowMobilePreview(false)}
          interventionData={previewInterventionData}
          parts={previewParts}
          laborPrice={previewLaborPrice}
          logo={logo}
        />
      )}

      <ClientSelectionModal 
        isOpen={isClientModalOpen} 
        onClose={() => setIsClientModalOpen(false)} 
        onSelect={handleClientSelect}
        onClientCreated={handleClientCreated}
      />
      
      <AddClientMachineModal
        isOpen={showAddMachineModal}
        onClose={() => setShowAddMachineModal(false)}
        preselectedClient={formData.clientId ? {
          id: formData.clientId,
          name: formData.clientName,
          code: formData.clientCode,
          phone: formData.clientPhone,
          email: formData.clientEmail,
          address: formData.clientAddress,
        } : null}
        onMachineCreated={handleMachineSelect}
      />

      <ConfirmDialog
        open={confirmLeave}
        tone="warning"
        title="Quitter sans enregistrer ?"
        message="Les informations saisies pour ce nouveau dossier seront perdues."
        confirmLabel="Quitter"
        cancelLabel="Continuer la saisie"
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => navigate('/interventions')}
      />
    </div>
  )
}
