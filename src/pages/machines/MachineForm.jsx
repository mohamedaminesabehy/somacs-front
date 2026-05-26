import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import {
  ChevronLeft,
  ChevronDown,
  Save,
  Loader2,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Info,
} from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const STATUS_OPTIONS = ['Actif', 'Inactif', 'En panne', 'Maintenance']
const CATEGORY_OPTIONS = [
  'Compresseur',
  'Pompe',
  'Moteur',
  'Groupe électrogène',
  'Climatisation',
  'Autre',
]

const STATUS_TONE = {
  Actif: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactif: 'bg-slate-100 text-slate-600 border-slate-200',
  'En panne': 'bg-red-50 text-red-700 border-red-200',
  Maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
}

const EMPTY_FORM = {
  code: '',
  designation: '',
  brand: '',
  model: '',
  serialNumber: '',
  year: '',
  client: '',
  site: '',
  service: '',
  unitAmount: '',
  status: 'Actif',
  category: '',
  location: '',
  commissioningDate: '',
  lastMaintenanceDate: '',
  nextMaintenanceDate: '',
  notes: '',
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function MachineForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const imageInputRef = useRef()

  const [docFiles, setDocFiles] = useState([])
  const [existingDocs, setExistingDocs] = useState([])
  const [docsToRemove, setDocsToRemove] = useState([])
  const docInputRef = useRef()

  /* ----------------------------- Data loading ---------------------------- */

  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    apiFetch(`/machines/${id}`, { auth: true })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setForm({
          code: data.code || '',
          designation: data.designation || '',
          brand: data.brand || '',
          model: data.model || '',
          serialNumber: data.serialNumber || '',
          year: data.year || '',
          client: data.client || '',
          site: data.site || '',
          service: data.service || '',
          unitAmount: data.unitAmount ?? '',
          status: data.status || 'Actif',
          category: data.category || '',
          location: data.location || '',
          commissioningDate: data.commissioningDate || '',
          lastMaintenanceDate: data.lastMaintenanceDate || '',
          nextMaintenanceDate: data.nextMaintenanceDate || '',
          notes: data.notes || '',
        })
        if (data.imageUrl) setExistingImageUrl(data.imageUrl)
        if (data.documentsJson) {
          try { setExistingDocs(JSON.parse(data.documentsJson)) } catch { /* ignore */ }
        }
      })
      .catch(() => setError('Impossible de charger la machine.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  /* ------------------------------ Handlers ------------------------------- */

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[name]; return next })
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setExistingImageUrl(null)
  }

  const handleDocChange = (e) => {
    const files = Array.from(e.target.files || [])
    setDocFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }

  const removeNewDoc = (idx) => setDocFiles((prev) => prev.filter((_, i) => i !== idx))

  const removeExistingDoc = (publicId) => {
    setDocsToRemove((prev) => [...prev, publicId])
    setExistingDocs((prev) => prev.filter((d) => d.publicId !== publicId))
  }

  const validate = () => {
    const errs = {}
    if (!form.code.trim()) errs.code = 'Le code est obligatoire.'
    if (!form.designation.trim()) errs.designation = 'La désignation est obligatoire.'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!validate()) { setError('Veuillez corriger les champs en erreur.'); return }
    setSaving(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
    if (imageFile) fd.append('image', imageFile)
    docFiles.forEach((f) => fd.append('documents', f))
    if (docsToRemove.length) fd.append('removeDocuments', JSON.stringify(docsToRemove))
    try {
      const res = await apiFetch(isEdit ? `/machines/${id}` : '/machines', {
        method: isEdit ? 'PATCH' : 'POST',
        body: fd,
        auth: true,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Erreur lors de la sauvegarde.')
      }
      navigate('/machines', {
        state: {
          toast: {
            type: 'success',
            message: isEdit ? 'Machine mise à jour.' : 'Machine créée avec succès.',
          },
        },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  /* ---------------------------- Derived data ----------------------------- */

  const totalDocs = existingDocs.length + docFiles.length

  const summaryItems = useMemo(
    () => [
      { label: 'Code', value: form.code || '—' },
      { label: 'Catégorie', value: form.category || '—' },
      { label: 'Statut', value: form.status || '—', isStatus: true },
      { label: 'Documents', value: totalDocs },
    ],
    [form.code, form.category, form.status, totalDocs],
  )

  /* ------------------------------ Loading -------------------------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#0052CC]" />
      </div>
    )
  }

  /* ------------------------------- Render -------------------------------- */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Sticky top bar ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/machines')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
              aria-label="Retour à la liste"
            >
              <ChevronLeft size={18} />
            </button>
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0" aria-label="Fil d'Ariane">
              <button
                type="button"
                onClick={() => navigate('/machines')}
                className="hover:text-slate-700 transition-colors"
              >
                Machines
              </button>
              <span className="text-slate-300" aria-hidden="true">/</span>
              <span className="text-slate-800 font-medium truncate">
                {isEdit ? `Modifier #${id}` : 'Nouvelle machine'}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/machines')}
              className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              form="machine-form"
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#0052CC] text-white text-sm font-medium hover:bg-[#0042a3] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Page title row */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 border-t border-slate-100">
          <h1 className="text-base font-semibold text-slate-900">
            {isEdit ? 'Modifier la machine' : 'Nouvelle machine'}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {isEdit
              ? "Mettez à jour les informations de l'équipement."
              : "Renseignez les informations principales pour créer un équipement."}
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 px-3.5 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          id="machine-form"
          onSubmit={handleSubmit}
          noValidate
          className="grid grid-cols-1 xl:grid-cols-3 gap-5"
        >
          {/* ── Main column ── */}
          <div className="xl:col-span-2 space-y-5">

            {/* Section 1 — Identification */}
            <Section
              title="Identification"
              description="Code unique, désignation et caractéristiques techniques."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Code"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="EX-001"
                  required
                  error={fieldErrors.code}
                />
                <Field
                  label="Désignation"
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  placeholder="Compresseur d'air"
                  required
                  error={fieldErrors.designation}
                />
                <Field
                  label="Marque"
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="Atlas Copco"
                />
                <Field
                  label="Modèle"
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  placeholder="GA 15"
                />
                <Field
                  label="N° de série"
                  name="serialNumber"
                  value={form.serialNumber}
                  onChange={handleChange}
                  placeholder="SN-XXXXXXXX"
                />
                <Field
                  label="Année de fabrication"
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  placeholder="2020"
                  type="number"
                />
                <SelectField
                  label="Statut"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  options={STATUS_OPTIONS}
                />
                <SelectField
                  label="Catégorie"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  options={CATEGORY_OPTIONS}
                  placeholder="Sélectionner…"
                />
              </div>
            </Section>

            {/* Section 2 — Affectation */}
            <Section
              title="Affectation & localisation"
              description="Client, site d'installation et valeur de l'équipement."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Client"
                  name="client"
                  value={form.client}
                  onChange={handleChange}
                  placeholder="Nom du client"
                />
                <Field
                  label="Site"
                  name="site"
                  value={form.site}
                  onChange={handleChange}
                  placeholder="Site d'installation"
                />
                <Field
                  label="Service"
                  name="service"
                  value={form.service}
                  onChange={handleChange}
                  placeholder="Service concerné"
                />
                <Field
                  label="Localisation précise"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Bâtiment A, Salle 3"
                />
                <Field
                  label="Valeur unitaire"
                  name="unitAmount"
                  type="number"
                  value={form.unitAmount}
                  onChange={handleChange}
                  placeholder="0"
                  hint="Montant en DA"
                />
              </div>
            </Section>

            {/* Section 3 — Maintenance */}
            <Section
              title="Suivi de maintenance"
              description="Dates clés pour la planification des interventions périodiques."
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field
                  label="Mise en service"
                  name="commissioningDate"
                  type="date"
                  value={form.commissioningDate}
                  onChange={handleChange}
                />
                <Field
                  label="Dernière maintenance"
                  name="lastMaintenanceDate"
                  type="date"
                  value={form.lastMaintenanceDate}
                  onChange={handleChange}
                />
                <Field
                  label="Prochaine maintenance"
                  name="nextMaintenanceDate"
                  type="date"
                  value={form.nextMaintenanceDate}
                  onChange={handleChange}
                />
              </div>
            </Section>

            {/* Section 4 — Notes */}
            <Section
              title="Observations"
              description="Notes internes, remarques techniques ou contextuelles."
            >
              <label htmlFor="notes" className="sr-only">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Notes, observations, remarques…"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] outline-none transition-colors resize-y"
              />
            </Section>
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-4 xl:sticky xl:top-[5.5rem] xl:self-start">

            {/* Summary */}
            <Section title="Récapitulatif" compact>
              <dl className="divide-y divide-slate-100">
                {summaryItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2.5">
                    <dt className="text-xs text-slate-500">{item.label}</dt>
                    <dd className="text-sm font-medium text-slate-900 truncate max-w-[60%] text-right">
                      {item.isStatus ? (
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                            STATUS_TONE[item.value] || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.value}
                        </span>
                      ) : (
                        item.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </Section>

            {/* Image */}
            <Section
              title="Image principale"
              description="JPG, PNG, WEBP — max 5 Mo"
              compact
            >
              <div className="flex items-start gap-3">
                <div className="w-20 h-20 rounded-md border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  {imagePreview || existingImageUrl ? (
                    <img
                      src={imagePreview || existingImageUrl}
                      alt="Aperçu de l'équipement"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={20} className="text-slate-300" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
                  >
                    <Upload size={12} />
                    {imagePreview || existingImageUrl ? 'Remplacer' : 'Téléverser'}
                  </button>
                  {(imagePreview || existingImageUrl) && (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X size={12} /> Supprimer
                    </button>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
            </Section>

            {/* Documents */}
            <Section
              title="Documents"
              description="Fiches techniques, manuels, certificats…"
              compact
              action={
                totalDocs > 0 ? (
                  <span className="text-[11px] font-medium text-slate-500">
                    {totalDocs} fichier{totalDocs > 1 ? 's' : ''}
                  </span>
                ) : null
              }
            >
              <div className="space-y-2">
                {existingDocs.length === 0 && docFiles.length === 0 && (
                  <EmptyState icon={FileText} text="Aucun document attaché." />
                )}
                {existingDocs.map((doc) => (
                  <DocRow
                    key={doc.publicId}
                    name={doc.name}
                    href={doc.url}
                    onRemove={() => removeExistingDoc(doc.publicId)}
                  />
                ))}
                {docFiles.map((f, i) => (
                  <DocRow
                    key={`new-${i}`}
                    name={f.name}
                    isNew
                    onRemove={() => removeNewDoc(i)}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-dashed border-slate-300 text-xs font-medium text-slate-600 hover:border-[#0052CC] hover:text-[#0052CC] transition-colors"
                >
                  <Upload size={12} /> Ajouter un document
                </button>
                <input
                  ref={docInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
                  className="hidden"
                  onChange={handleDocChange}
                />
              </div>
            </Section>

            {/* Required fields notice */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-500">
              <Info size={13} className="mt-0.5 shrink-0 text-slate-400" />
              <p>
                Les champs marqués d&apos;un{' '}
                <span className="text-red-500 font-medium">*</span> sont obligatoires.
              </p>
            </div>
          </aside>
        </form>

        {/* Mobile sticky footer */}
        <div className="xl:hidden sticky bottom-0 -mx-4 sm:-mx-6 mt-6 px-4 sm:px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/machines')}
            className="inline-flex items-center px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            form="machine-form"
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#0052CC] text-white text-sm font-medium hover:bg-[#0042a3] disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </main>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Subcomponents                                                             */
/* -------------------------------------------------------------------------- */

function Section({ title, description, action, compact = false, children }) {
  return (
    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <header
        className={`flex items-start justify-between gap-3 border-b border-slate-100 ${
          compact ? 'px-4 py-3' : 'px-5 py-4'
        }`}
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
        {action}
      </header>
      <div className={compact ? 'px-4 py-4' : 'px-5 py-5'}>{children}</div>
    </section>
  )
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  error,
  hint,
}) {
  const id = `field-${name}`
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-xs font-medium text-slate-700 flex items-center gap-0.5"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
        )}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        required={required}
        className={`px-3 py-2 bg-white border rounded-md text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors ${
          error
            ? 'border-red-300 focus:ring-2 focus:ring-red-100 focus:border-red-400'
            : 'border-slate-200 focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]'
        }`}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[11px] text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[11px] text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function SelectField({ label, name, value, onChange, options, placeholder }) {
  const id = `field-${name}`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2 pr-8 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] outline-none transition-colors appearance-none cursor-pointer"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

function DocRow({ name, href, isNew, onRemove }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md">
      <div className="flex items-center gap-2 min-w-0">
        <FileText size={13} className="text-slate-400 shrink-0" />
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-slate-700 hover:text-[#0052CC] truncate"
          >
            {name}
          </a>
        ) : (
          <span className="text-xs font-medium text-slate-700 truncate">{name}</span>
        )}
        {isNew && (
          <span className="shrink-0 inline-flex items-center rounded-full bg-blue-50 text-[#0052CC] border border-blue-100 px-1.5 py-0.5 text-[10px] font-medium">
            Nouveau
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
        aria-label={`Supprimer ${name}`}
      >
        <X size={13} />
      </button>
    </div>
  )
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-5 text-slate-400">
      <Icon size={18} />
      <p className="text-xs">{text}</p>
    </div>
  )
}
