/**
 * MachineClientWizard — Wizard 4 étapes réutilisable pour création/modification Machine Client.
 *
 * Peut être utilisé :
 * - En page normale (Gestion Machines)
 * - Dans une Modal (Création Intervention)
 *
 * Props:
 * - preselectedClient: Client déjà sélectionné (optionnel, peut être verrouillé)
 * - lockClient: boolean - Si true, empêche de changer le client
 * - onSuccess: (machine) => void - Callback après enregistrement réussi
 * - onCancel: () => void - Callback d'annulation
 * - isModal: boolean - Mode d'affichage (true = compact pour modal)
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import {
  AlertCircle, AlertTriangle, Barcode, Building2, Check, ChevronLeft, ChevronRight,
  Cpu, FileText, Hash, Image as ImageIcon, ImagePlus, Loader2, Mail,
  MapPin, Phone, RefreshCw, Save, Search, Shield, Tag, Upload, User, Wrench, X,
} from 'lucide-react'

// ─── Constantes ────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['En service', 'En panne', 'En maintenance', 'Hors service']
const CATEGORY_OPTIONS = ['Compresseur', 'Pompe', 'Moteur', 'Groupe électrogène', 'Climatisation', 'Autre']
const WORKSHOP_OPTIONS = [
  { value: '', label: 'Non précisé' },
  { value: 'AT_CLIENT_SITE', label: 'Sur site client' },
  { value: 'IN_WORKSHOP', label: 'En atelier SOMACS' },
]

const STEPS = [
  { id: 1, title: 'Client', description: 'Propriétaire', icon: User },
  { id: 2, title: 'Identification', description: 'Désignation & référence', icon: Cpu },
  { id: 3, title: 'Localisation', description: 'Site & contact', icon: MapPin },
  { id: 4, title: 'Médias', description: 'Photos & documents', icon: ImagePlus },
]

const EMPTY_FORM = {
  designation: '',
  brand: '',
  model: '',
  serialNumber: '',
  year: '',
  category: '',
  status: 'En service',
  notes: '',
  clientSite: '',
  clientContact: '',
  clientContactPhone: '',
  workshopStatus: '',
  workshopReceivedAt: '',
  workshopReturnedAt: '',
  workshopNotes: '',
  ownerType: 'CLIENT',
}

// ─── Composants UI ─────────────────────────────────────────────────────────

function FormPanel({ title, icon: Icon, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-white">
      <header className="flex items-center gap-2 border-b border-line bg-slate-50/60 px-4 py-2.5 sm:px-5">
        {Icon && <Icon size={13} className="text-brand-700" aria-hidden="true" />}
        <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">{title}</h3>
      </header>
      <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-2">{children}</div>
    </section>
  )
}

function Field({ label, name, value, onChange, placeholder, type = 'text', required, error, mono, hint, wide }) {
  return (
    <div className={`flex flex-col gap-1.5 ${wide ? 'md:col-span-2' : ''}`}>
      <label htmlFor={`field-${name}`} className="text-xs font-semibold text-ink-soft">
        {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
      </label>
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
      <input
        id={`field-${name}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        aria-invalid={Boolean(error)}
        className={[
          'ui-input',
          mono ? 'font-mono tracking-wide' : '',
          error ? 'border-red-300 ring-4 ring-red-100' : '',
        ].join(' ')}
      />
      {error && <p id={`${name}-err`} role="alert" className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

function SelectField({ label, name, value, onChange, options, wide }) {
  return (
    <div className={`flex flex-col gap-1.5 ${wide ? 'md:col-span-2' : ''}`}>
      <label htmlFor={`sel-${name}`} className="text-xs font-semibold text-ink-soft">{label}</label>
      <select id={`sel-${name}`} name={name} value={value} onChange={onChange} className="ui-select">
        {options.map((o) =>
          typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>,
        )}
      </select>
    </div>
  )
}

function TextareaField({ label, name, value, onChange, placeholder, wide }) {
  return (
    <div className={`flex flex-col gap-1.5 ${wide ? 'md:col-span-2' : ''}`}>
      <label htmlFor={`ta-${name}`} className="text-xs font-semibold text-ink-soft">{label}</label>
      <textarea
        id={`ta-${name}`}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        className="ui-textarea"
      />
    </div>
  )
}

function ClientCard({ client, onClear, locked }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-navy text-white shadow-raised">
      <div className="ui-blueprint pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="relative flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 font-display text-xl font-bold ring-1 ring-inset ring-white/20">
          {String(client.name || '').charAt(0).toUpperCase() || '?'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-200">Client propriétaire</p>
          <p className="mt-0.5 truncate font-display text-lg font-bold">{client.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-100/80">
            <span className="font-mono font-semibold">{client.code}</span>
            {client.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone size={11} aria-hidden="true" /> {client.phone}
              </span>
            )}
            {(client.city || client.address) && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} aria-hidden="true" /> {client.city || client.address}
              </span>
            )}
          </div>
        </div>
        {!locked && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-navy transition-colors hover:bg-brand-50"
          >
            <RefreshCw size={14} aria-hidden="true" /> Changer
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Étapes ────────────────────────────────────────────────────────────────

function ClientStep({ selectedClient, onSelect, fieldError, locked }) {
  const [query, setQuery] = useState('')
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef(null)

  const searchClients = useCallback(async (q) => {
    setLoading(true)
    setSearched(false)
    try {
      const res = await apiFetch(`/clients?search=${encodeURIComponent(q)}&limit=20`, { auth: true })
      if (!res.ok) return
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.items || data.data || [])
      setClients(list)
    } catch { /* silent */ } finally {
      setLoading(false)
      setSearched(true)
    }
  }, [])

  useEffect(() => {
    if (!locked) searchClients('')
  }, [searchClients, locked])

  const handleQueryChange = (e) => {
    const v = e.target.value
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchClients(v), 280)
  }

  if (selectedClient) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
          <Shield size={15} className="mt-0.5 shrink-0 text-brand-700" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-brand-800">
            Une <strong>Machine Client</strong> reste la propriété du client même lorsqu'elle est
            temporairement en atelier SOMACS pour réparation.
          </p>
        </div>
        <ClientCard client={selectedClient} onClear={() => onSelect(null)} locked={locked} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
        <Shield size={15} className="mt-0.5 shrink-0 text-brand-700" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-brand-800">
          Sélectionnez le client propriétaire de cette machine.
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-line bg-white">
        <header className="flex items-center gap-2 border-b border-line bg-slate-50/60 px-4 py-2.5 sm:px-5">
          <User size={13} className="text-brand-700" aria-hidden="true" />
          <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">
            Client propriétaire <span className="text-red-500 normal-case">*</span>
          </h3>
        </header>
        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={handleQueryChange}
                placeholder="Rechercher par nom, code, ville…"
                className="ui-input pl-10"
              />
            </div>

            {fieldError && (
              <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                <AlertTriangle size={13} aria-hidden="true" /> {fieldError}
              </p>
            )}

            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={20} className="animate-spin text-brand-600" />
              </div>
            )}

            {!loading && searched && clients.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Building2 size={22} className="text-ink-faint" aria-hidden="true" />
                <p className="text-sm font-medium text-ink">Aucun client trouvé</p>
              </div>
            )}

            {!loading && clients.length > 0 && (
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line max-h-64 overflow-y-auto">
                {clients.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(c)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50/60"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-navy font-display text-sm font-bold text-white">
                        {String(c.name || '').charAt(0).toUpperCase() || '?'}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">{c.name}</span>
                        <span className="block text-xs text-ink-muted">
                          <span className="font-mono">{c.code}</span>
                          {c.city ? ` · ${c.city}` : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function IdentificationStep({ form, handleChange, fieldErrors, duplicate }) {
  return (
    <>
      {duplicate && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Machine potentiellement existante</p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-700">
              Une machine avec ce numéro de série existe déjà pour ce client.
            </p>
          </div>
        </div>
      )}

      <FormPanel title="Identité de la machine" icon={Cpu}>
        <Field
          label="Désignation"
          name="designation"
          value={form.designation}
          onChange={handleChange}
          placeholder="Ex : Compresseur à vis 15 kW"
          required
          error={fieldErrors.designation}
          wide
        />
        <Field label="Marque" name="brand" value={form.brand} onChange={handleChange} placeholder="Atlas Copco" required error={fieldErrors.brand} />
        <Field label="Modèle" name="model" value={form.model} onChange={handleChange} placeholder="GA 15" />
        <Field label="Numéro de série" name="serialNumber" value={form.serialNumber} onChange={handleChange} placeholder="SN-XXXXXXX" mono />
        <Field label="Année" name="year" value={form.year} onChange={handleChange} type="number" placeholder="2023" />
        <SelectField label="Catégorie" name="category" value={form.category} onChange={handleChange} options={['', ...CATEGORY_OPTIONS]} />
        <SelectField label="Statut" name="status" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} />
      </FormPanel>

      <FormPanel title="Observations" icon={FileText}>
        <TextareaField
          label="Informations complémentaires"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="Particularités techniques, historique…"
          wide
        />
      </FormPanel>
    </>
  )
}

function LocalisationStep({ form, handleChange, selectedClient }) {
  const fillFromClient = () => {
    if (!selectedClient) return
    handleChange({ target: { name: 'clientSite', value: selectedClient.address || selectedClient.city || '' } })
    handleChange({ target: { name: 'clientContactPhone', value: selectedClient.phone || '' } })
  }

  return (
    <>
      <div className="flex items-start gap-3 rounded-xl border border-line bg-slate-50/60 px-4 py-3">
        <MapPin size={15} className="mt-0.5 shrink-0 text-brand-700" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-ink-muted">
          Indiquez <strong>l'emplacement habituel</strong> de la machine chez son propriétaire.
        </p>
      </div>

      <FormPanel title="Site habituel du client" icon={MapPin}>
        <div className="flex flex-col gap-3 md:col-span-2">
          <Field
            label="Site / adresse"
            name="clientSite"
            value={form.clientSite}
            onChange={handleChange}
            placeholder="Atelier principal, rue…"
            wide
          />
          {selectedClient && (
            <button
              type="button"
              onClick={fillFromClient}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-brand-200 hover:text-brand-700"
            >
              <RefreshCw size={12} aria-hidden="true" />
              Reprendre l'adresse du client
            </button>
          )}
        </div>
        <Field label="Contact sur site" name="clientContact" value={form.clientContact} onChange={handleChange} placeholder="Nom du responsable" />
        <Field label="Téléphone contact" name="clientContactPhone" value={form.clientContactPhone} onChange={handleChange} placeholder="+216 XXXXXXXX" type="tel" />
      </FormPanel>
    </>
  )
}

function MediaStep({ imageFiles, setImageFiles, docFiles, setDocFiles }) {
  const imageInputRef = useRef(null)
  const docInputRef = useRef(null)

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    setImageFiles((prev) => [...prev, ...files])
  }

  const handleDocChange = (e) => {
    const files = Array.from(e.target.files || [])
    setDocFiles((prev) => [...prev, ...files])
  }

  return (
    <>
      <FormPanel title="Photos de la machine" icon={ImageIcon}>
        <div className="flex flex-col gap-3 md:col-span-2">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/40 px-4 py-8 text-brand-700 hover:border-brand-300 hover:bg-brand-50"
          >
            <ImagePlus size={20} aria-hidden="true" />
            <span className="text-sm font-semibold">Ajouter des photos</span>
          </button>
          {imageFiles.length > 0 && (
            <ul className="space-y-2">
              {imageFiles.map((file, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm">
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </FormPanel>

      <FormPanel title="Documents techniques" icon={FileText}>
        <div className="flex flex-col gap-3 md:col-span-2">
          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            multiple
            onChange={handleDocChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-ink-muted hover:border-slate-300 hover:bg-slate-100"
          >
            <Upload size={20} aria-hidden="true" />
            <span className="text-sm font-semibold">Ajouter des documents</span>
          </button>
          {docFiles.length > 0 && (
            <ul className="space-y-2">
              {docFiles.map((file, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm">
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setDocFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </FormPanel>
    </>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────

export default function MachineClientWizard({
  preselectedClient = null,
  lockClient = false,
  onSuccess,
  onCancel,
  isModal = false,
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedClient, setSelectedClient] = useState(preselectedClient)
  const [form, setForm] = useState(EMPTY_FORM)
  const [imageFiles, setImageFiles] = useState([])
  const [docFiles, setDocFiles] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  const [duplicate, setDuplicate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (preselectedClient) {
      setSelectedClient(preselectedClient)
    }
  }, [preselectedClient])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const validateStep = (step) => {
    const errors = {}
    if (step === 1 && !selectedClient) errors.client = 'Sélectionnez le client propriétaire.'
    if (step === 2) {
      if (!form.designation.trim()) errors.designation = 'La désignation est obligatoire.'
      if (!form.brand.trim()) errors.brand = 'La marque est obligatoire.'
    }
    return errors
  }

  const nextStep = () => {
    const errors = validateStep(currentStep)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setCurrentStep((s) => Math.min(s + 1, STEPS.length))
  }

  const prevStep = () => {
    setCurrentStep((s) => Math.max(s - 1, 1))
  }

  const handleSubmit = async () => {
    // Valider toutes les étapes
    for (let i = 1; i <= 2; i++) {
      const errors = validateStep(i)
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        setCurrentStep(i)
        return
      }
    }

    setSaving(true)
    setServerError('')

    try {
      const autoCode = `CLI-${selectedClient.id}-${Date.now().toString(36).toUpperCase()}`
      const fd = new FormData()
      fd.append('code', autoCode)
      fd.append('ownerType', 'CLIENT')
      fd.append('clientId', String(selectedClient.id))

      // Ajouter les champs du formulaire SAUF ownerType (déjà ajouté ci-dessus)
      Object.entries(form).forEach(([key, value]) => {
        if (value && key !== 'ownerType') fd.append(key, value)
      })

      imageFiles.forEach((file) => fd.append('images', file))
      docFiles.forEach((file) => fd.append('documents', file))

      const res = await apiFetch('/machines', { method: 'POST', body: fd, auth: true })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setServerError(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Erreur serveur')
        return
      }

      const created = await res.json()
      onSuccess(created)
    } catch (err) {
      setServerError('Impossible de créer la machine.')
    } finally {
      setSaving(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ClientStep selectedClient={selectedClient} onSelect={setSelectedClient} fieldError={fieldErrors.client} locked={lockClient} />
      case 2:
        return <IdentificationStep form={form} handleChange={handleChange} fieldErrors={fieldErrors} duplicate={duplicate} />
      case 3:
        return <LocalisationStep form={form} handleChange={handleChange} selectedClient={selectedClient} />
      case 4:
        return <MediaStep imageFiles={imageFiles} setImageFiles={setImageFiles} docFiles={docFiles} setDocFiles={setDocFiles} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stepper horizontal */}
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((step, idx) => {
          const Icon = step.icon
          const isActive = step.id === currentStep
          const isCompleted = step.id < currentStep
          return (
            <div key={step.id} className="flex flex-1 items-center gap-2">
              <div className={`flex items-center gap-2 ${isActive ? '' : 'opacity-50'}`}>
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isActive ? 'bg-brand-600 text-white' : isCompleted ? 'bg-teal-600 text-white' : 'bg-slate-200 text-ink-muted'}`}>
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : step.id}
                </span>
                <span className={`hidden sm:block text-xs font-semibold ${isActive ? 'text-ink' : 'text-ink-muted'}`}>
                  {step.title}
                </span>
              </div>
              {idx < STEPS.length - 1 && <div className="h-px flex-1 bg-line" />}
            </div>
          )
        })}
      </div>

      {/* Contenu de l'étape */}
      <div className="animate-fade-up">
        {renderStep()}
      </div>

      {/* Erreur serveur */}
      {serverError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} disabled={saving} className="ui-btn-secondary">
              Annuler
            </button>
          )}
          {currentStep > 1 && (
            <button type="button" onClick={prevStep} disabled={saving} className="ui-btn-secondary">
              <ChevronLeft size={16} aria-hidden="true" />
              Précédent
            </button>
          )}
        </div>
        <div className="text-xs font-medium text-ink-muted">
          Étape {currentStep} sur {STEPS.length}
        </div>
        <div>
          {currentStep < STEPS.length ? (
            <button type="button" onClick={nextStep} disabled={saving} className="ui-btn-primary">
              Suivant
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={saving} className="ui-btn-primary">
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Check size={16} />
                  Créer la machine
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
