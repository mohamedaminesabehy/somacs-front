import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import {
  AlertCircle, Check, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, Clock, Cpu, FileText, Hash,
  Image as ImageIcon, ImagePlus, Loader2, Package, Save, Shield, Tag, Truck, Upload, X,
} from 'lucide-react'

const STATUS_OPTIONS = ['En stock', 'Disponible', 'En utilisation', 'En maintenance', 'Hors service']
const CATEGORY_OPTIONS = ['Compresseur', 'Pompe', 'Moteur', 'Groupe electrogene', 'Climatisation', 'Autre']
const ETAT_RECEPTION_OPTIONS = ['Neuf', 'Occasion', 'A verifier', 'Endommage']
const ETAT_GENERAL_OPTIONS = ['Conforme', 'A verifier', 'Non conforme']
const TEST_OPTIONS = ['Non teste', 'Teste OK', 'Teste avec remarque', 'Echec test']
const OUI_NON_PARTIEL = ['Oui', 'Non', 'Partiel']
const OUI_NON = ['Oui', 'Non']
const ACTION_OPTIONS = ['Prete a livrer', 'Reparation necessaire', 'Verification technique', 'Pieces manquantes']
const EMPLACEMENT_OPTIONS = ['Magasin', 'Showroom 1', 'Showroom 2']

const STEPS = [
  { id: 1, title: 'Origine', description: 'Fournisseur & garantie', icon: Truck, heading: 'Origine & réception', intro: 'Provenance de l’équipement, documents d’achat et conditions de garantie.' },
  { id: 2, title: 'Identification', description: 'Code, modèle, statut', icon: Cpu, heading: 'Identification de la machine', intro: 'Le code interne et la désignation sont obligatoires : ils identifient la machine dans tout le système.' },
  { id: 3, title: 'Contrôle', description: 'Avant livraison', icon: ClipboardCheck, heading: 'Contrôle avant livraison', intro: 'Vérifications techniques et décision avant affectation au client.' },
  { id: 4, title: 'Médias', description: 'Photos & documents', icon: ImagePlus, heading: 'Photos & documents', intro: 'La première photo sert de couverture sur la fiche machine.' },
]

const EMPTY_FORM = { code: '', designation: '', brand: '', model: '', serialNumber: '', year: '', category: '', status: 'En stock', supplier: '', referenceFournisseur: '', receptionDate: '', purchaseOrderNumber: '', warrantyEndDate: '', dureeGarantie: '', etatReception: '', observationsReception: '', etatGeneral: '', testFonctionnement: '', accessoiresPresents: '', documentsPresents: '', problemeConstate: '', descriptionProbleme: '', actionRecommandee: '', valideParControle: '', dateControle: '', emplacementInterne: '' }

const TRACKED_FIELDS = ['code', 'designation', 'brand', 'model', 'serialNumber', 'year', 'category', 'supplier', 'receptionDate', 'warrantyEndDate', 'etatReception', 'etatGeneral', 'testFonctionnement', 'emplacementInterne', 'valideParControle', 'dateControle']

export default function MachineForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [activeStep, setActiveStep] = useState(1)
  const [traceability, setTraceability] = useState({ createdBy: '', updatedBy: '', createdAt: '', updatedAt: '' })
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const imageInputRef = useRef()
  const [docFiles, setDocFiles] = useState([])
  const [existingDocs, setExistingDocs] = useState([])
  const [docsToRemove, setDocsToRemove] = useState([])
  const [imagesToRemove, setImagesToRemove] = useState([])
  const docInputRef = useRef()

  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    apiFetch('/machines/' + id, { auth: true })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const f = {}
        Object.keys(EMPTY_FORM).forEach((k) => { f[k] = data[k] || '' })
        setForm(f)
        setTraceability({ createdBy: data.createdBy || '', updatedBy: data.updatedBy || '', createdAt: data.createdAt || '', updatedAt: data.updatedAt || '' })
        if (data.imagesJson) {
          try {
            const imgs = JSON.parse(data.imagesJson)
            if (Array.isArray(imgs)) setExistingImages(imgs)
          } catch {
            // Existing image metadata is optional.
          }
        } else if (data.imageUrl) {
          setExistingImages([{ publicId: data.imagePublicId || null, url: data.imageUrl, name: 'Image machine' }])
        }
        if (data.documentsJson) {
          try {
            setExistingDocs(JSON.parse(data.documentsJson))
          } catch {
            // Existing document metadata is optional.
          }
        }
      })
      .catch(() => setError('Impossible de charger la machine.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (fieldErrors[name]) setFieldErrors((p) => { const n = { ...p }; delete n[name]; return n })
  }
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setImageFiles((prev) => [...prev, ...files])
    setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
    e.target.value = ''
  }
  const clearImage = (index, type) => {
    if (type === 'existing') {
      const img = existingImages[index]
      const key = img.publicId || `url:${img.url}`
      setExistingImages((prev) => prev.filter((_, i) => i !== index))
      setImagesToRemove((prev) => [...prev, key])
    } else {
      setImageFiles((prev) => prev.filter((_, i) => i !== index))
      setImagePreviews((prev) => { URL.revokeObjectURL(prev[index]); return prev.filter((_, i) => i !== index) })
    }
  }
  const handleDocChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setDocFiles((p) => [...p, ...files])
    e.target.value = ''
  }
  const removeNewDoc = (idx) => setDocFiles((p) => p.filter((_, i) => i !== idx))
  const removeExistingDoc = (pid) => { setDocsToRemove((p) => [...p, pid]); setExistingDocs((p) => p.filter((d) => d.publicId !== pid)) }

  const validate = () => {
    const errs = {}
    if (!form.code.trim()) errs.code = 'Le code interne est obligatoire.'
    if (!form.designation.trim()) errs.designation = 'La désignation est obligatoire.'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Only allow submission from the final step
    if (activeStep < STEPS.length) return
    setError(null)
    if (!validate()) {
      setError('Champs obligatoires manquants à l’étape Identification.')
      setActiveStep(2)
      return
    }
    setSaving(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
    imageFiles.forEach((f) => fd.append('images', f))
    docFiles.forEach((f) => fd.append('documents', f))
    if (docsToRemove.length) fd.append('removeDocuments', JSON.stringify(docsToRemove))
    if (imagesToRemove.length) fd.append('removeImages', JSON.stringify(imagesToRemove))
    try {
      const url = isEdit ? '/machines/' + id : '/machines'
      const res = await apiFetch(url, { method: isEdit ? 'PATCH' : 'POST', body: fd, auth: true })
      if (!res.ok) { const r = await res.json().catch(() => ({})); throw new Error(r.message || 'Erreur') }
      navigate('/machines', { state: { toast: { type: 'success', message: isEdit ? 'Fiche machine mise à jour.' : 'Machine enregistrée dans le parc.' } } })
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  const totalDocs = existingDocs.length + docFiles.length
  const totalImages = existingImages.length + imageFiles.length

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <Loader2 className="size-8 animate-spin text-brand-600" aria-label="Chargement de la machine" />
    </div>
  )

  const current = STEPS[activeStep - 1]
  const filled = TRACKED_FIELDS.filter((k) => String(form[k] || '').trim() !== '').length
  const completion = Math.round((filled / TRACKED_FIELDS.length) * 100)
  const stepHasError = (stepId) => stepId === 2 && Boolean(fieldErrors.code || fieldErrors.designation)
  const backTo = isEdit ? `/machines/${id}` : '/machines'

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <button type="button" onClick={() => navigate(backTo)} className="ui-btn-ghost size-10 shrink-0 px-0" aria-label="Retour">
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-ink-muted">Parc machines · {isEdit ? 'Modification' : 'Nouvelle fiche'}</p>
            <h1 className="truncate font-display text-lg font-bold text-ink sm:text-xl">
              {isEdit ? (form.designation || 'Modifier la machine') : 'Enregistrer une machine'}
            </h1>
          </div>
          <button type="button" onClick={() => navigate(backTo)} className="ui-btn-secondary hidden sm:inline-flex">Annuler</button>
          <button form="machine-form" type="submit" disabled={saving} className="ui-btn-primary" onClick={() => setActiveStep(STEPS.length)}>
            {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
            <span className="hidden sm:inline">{isEdit ? 'Enregistrer' : 'Créer la fiche'}</span>
          </button>
        </div>
        <div className="h-0.5 bg-slate-100" aria-hidden="true">
          <div className="h-full bg-brand-600 transition-all duration-300" style={{ width: `${(activeStep / STEPS.length) * 100}%` }} />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_18rem]">
        <nav aria-label="Étapes de la fiche machine" className="lg:sticky lg:top-24 lg:self-start">
          <ol className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:pb-0">
            {STEPS.map((step) => {
              const isActive = activeStep === step.id
              const isDone = activeStep > step.id
              const hasError = stepHasError(step.id)
              const StepIcon = step.icon
              return (
                <li key={step.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    aria-current={isActive ? 'step' : undefined}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${isActive ? 'bg-white shadow-card ring-1 ring-line' : 'hover:bg-white/70'}`}
                  >
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-bold
                      ${hasError ? 'bg-red-600 text-white' : isActive ? 'bg-brand-600 text-white' : isDone ? 'bg-teal-600 text-white' : 'bg-slate-200 text-ink-muted'}`}>
                      {hasError ? <AlertCircle size={15} aria-hidden="true" /> : isDone ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : <StepIcon size={15} aria-hidden="true" />}
                    </span>
                    <span className="min-w-0">
                      <span className={`block whitespace-nowrap text-sm font-semibold ${isActive ? 'text-ink' : 'text-ink-soft'}`}>{step.title}</span>
                      <span className="hidden text-xs text-ink-faint lg:block">{step.description}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <main className="flex min-w-0 flex-col gap-5">
          {error && (
            <div className="flex items-start gap-3 rounded-lg bg-red-50 px-4 py-3 text-red-800 ring-1 ring-inset ring-red-200" role="alert">
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold tabular-nums text-brand-700">Étape {activeStep} / {STEPS.length}</p>
            <h2 className="mt-0.5 font-display text-xl font-bold text-ink text-balance">{current.heading}</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted text-pretty">{current.intro}</p>
          </div>

          <form id="machine-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {activeStep === 1 && <OriginStep form={form} handleChange={handleChange} />}
            {activeStep === 2 && <IdentityStep form={form} handleChange={handleChange} fieldErrors={fieldErrors} />}
            {activeStep === 3 && <ControlStep form={form} handleChange={handleChange} />}
            {activeStep === 4 && (
              <MediaStep
                imagePreviews={imagePreviews} existingImages={existingImages}
                imageInputRef={imageInputRef} handleImageChange={handleImageChange} clearImage={clearImage}
                totalImages={totalImages}
                totalDocs={totalDocs} existingDocs={existingDocs} docFiles={docFiles}
                removeExistingDoc={removeExistingDoc} removeNewDoc={removeNewDoc}
                docInputRef={docInputRef} handleDocChange={handleDocChange}
                isEdit={isEdit} traceability={traceability}
              />
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => setActiveStep((s) => Math.max(1, s - 1))} disabled={activeStep === 1} className="ui-btn-secondary">
                <ChevronLeft size={16} aria-hidden="true" /> Précédent
              </button>
              {activeStep < STEPS.length ? (
                <button type="button" onClick={(e) => { e.preventDefault(); setActiveStep((s) => Math.min(STEPS.length, s + 1)) }} className="ui-btn-primary">
                  Continuer : {STEPS[activeStep].title} <ChevronRight size={16} aria-hidden="true" />
                </button>
              ) : (
                <button type="submit" disabled={saving} className="ui-btn-primary">
                  {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                  {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer les modifications' : 'Créer la fiche machine'}
                </button>
              )}
            </div>
          </form>
        </main>

        <aside className="hidden xl:sticky xl:top-24 xl:block xl:self-start" aria-label="Aperçu de la fiche">
          <AssetPreview form={form} completion={completion} totalImages={totalImages} totalDocs={totalDocs} cover={existingImages[0]?.url || imagePreviews[0]} />
        </aside>
      </div>
    </div>
  )
}

/* ─── Aperçu live ─── */
function AssetPreview({ form, completion, totalImages, totalDocs, cover }) {
  const rows = [
    ['N° de série', form.serialNumber, true],
    ['Fournisseur', form.supplier],
    ['Réception', form.receptionDate],
    ['Emplacement', form.emplacementInterne],
    ['Test', form.testFonctionnement],
  ]
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="relative aspect-[16/10] bg-slate-100">
        {cover
          ? <img src={cover} alt="" className="size-full object-cover" />
          : <span className="flex size-full items-center justify-center text-ink-faint"><Cpu size={28} aria-hidden="true" /></span>}
        <span className="absolute left-3 top-3 rounded-md bg-navy px-2 py-1 font-mono text-[11px] font-bold tracking-wider text-white">{form.code || 'CODE'}</span>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div>
          <p className={`text-sm font-semibold text-pretty ${form.designation ? 'text-ink' : 'text-ink-faint'}`}>{form.designation || 'Désignation à saisir'}</p>
          <p className="mt-0.5 text-xs text-ink-muted">{[form.brand, form.model].filter(Boolean).join(' · ') || 'Marque · Modèle'}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {form.status && <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-800">{form.status}</span>}
            {form.category && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-ink-soft">{form.category}</span>}
          </div>
        </div>
        <dl className="flex flex-col divide-y divide-line border-y border-line">
          {rows.map(([label, value, mono]) => (
            <div key={label} className="flex items-center justify-between gap-3 py-1.5">
              <dt className="text-xs text-ink-muted">{label}</dt>
              <dd className={`truncate text-xs font-medium ${value ? 'text-ink' : 'text-ink-faint'} ${mono && value ? 'font-mono' : ''}`}>{value || '—'}</dd>
            </div>
          ))}
        </dl>
        <p className="flex items-center gap-3 text-xs text-ink-muted">
          <span className="flex items-center gap-1"><ImageIcon size={12} aria-hidden="true" /> {totalImages} photo{totalImages > 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1"><FileText size={12} aria-hidden="true" /> {totalDocs} document{totalDocs > 1 ? 's' : ''}</span>
        </p>
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-ink-soft">Complétude de la fiche</span>
            <span className="font-semibold tabular-nums text-ink">{completion}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100} aria-label="Complétude de la fiche">
            <div className={`h-full rounded-full transition-all ${completion >= 75 ? 'bg-teal-600' : 'bg-brand-600'}`} style={{ width: `${completion}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Étapes ─── */
function PanelTitle({ icon: PanelIcon, children, count }) {
  return (
    <h3 className="flex items-center justify-between gap-2 border-b border-line bg-slate-50/60 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-ink-muted sm:px-5">
      <span className="flex items-center gap-2">{PanelIcon && <PanelIcon size={13} aria-hidden="true" />} {children}</span>
      {count != null && <span className="tabular-nums normal-case tracking-normal">{count}</span>}
    </h3>
  )
}

function FormPanel({ title, icon, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-white">
      <PanelTitle icon={icon}>{title}</PanelTitle>
      <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-2">{children}</div>
    </section>
  )
}

function OriginStep({ form, handleChange }) {
  return (
    <>
      <FormPanel title="Fournisseur" icon={Package}>
        <Field label="Fournisseur" name="supplier" value={form.supplier} onChange={handleChange} placeholder="Nom du fournisseur" />
        <Field label="Référence fournisseur" name="referenceFournisseur" value={form.referenceFournisseur} onChange={handleChange} placeholder="REF-XXX" mono />
        <Field label="Facture / BL" name="purchaseOrderNumber" value={form.purchaseOrderNumber} onChange={handleChange} placeholder="N° de document" mono />
        <Field label="Date d’arrivée" name="receptionDate" type="date" value={form.receptionDate} onChange={handleChange} />
      </FormPanel>
      <FormPanel title="Garantie" icon={Shield}>
        <Field label="Fin de garantie" name="warrantyEndDate" type="date" value={form.warrantyEndDate} onChange={handleChange} />
        <Field label="Durée de garantie" name="dureeGarantie" value={form.dureeGarantie} onChange={handleChange} placeholder="12 mois" />
      </FormPanel>
      <FormPanel title="État à la réception" icon={ClipboardCheck}>
        <ChoiceField label="État réception" name="etatReception" value={form.etatReception} onChange={handleChange} options={ETAT_RECEPTION_OPTIONS} wide />
        <TextareaField label="Observations" name="observationsReception" value={form.observationsReception} onChange={handleChange} placeholder="Remarques à la réception…" />
      </FormPanel>
    </>
  )
}

function IdentityStep({ form, handleChange, fieldErrors }) {
  return (
    <>
      <FormPanel title="Identifiants" icon={Hash}>
        <Field label="Code interne" name="code" value={form.code} onChange={handleChange} placeholder="MACH-001" required error={fieldErrors.code} mono hint="Identifiant unique dans le parc" />
        <Field label="Désignation" name="designation" value={form.designation} onChange={handleChange} placeholder="Compresseur à vis" required error={fieldErrors.designation} />
        <Field label="N° de série" name="serialNumber" value={form.serialNumber} onChange={handleChange} placeholder="SN-XXX" mono />
        <Field label="Année" name="year" value={form.year} onChange={handleChange} placeholder="2024" type="number" />
      </FormPanel>
      <FormPanel title="Caractéristiques" icon={Tag}>
        <Field label="Marque" name="brand" value={form.brand} onChange={handleChange} placeholder="Atlas Copco" />
        <Field label="Modèle" name="model" value={form.model} onChange={handleChange} placeholder="GA 15" />
        <SelectField label="Catégorie" name="category" value={form.category} onChange={handleChange} options={CATEGORY_OPTIONS} />
        <SelectField label="Statut" name="status" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} />
      </FormPanel>
    </>
  )
}

function ControlStep({ form, handleChange }) {
  return (
    <>
      <FormPanel title="Vérifications" icon={ClipboardCheck}>
        <ChoiceField label="Test de fonctionnement" name="testFonctionnement" value={form.testFonctionnement} onChange={handleChange} options={TEST_OPTIONS} wide />
        <ChoiceField label="État général" name="etatGeneral" value={form.etatGeneral} onChange={handleChange} options={ETAT_GENERAL_OPTIONS} />
        <ChoiceField label="Accessoires présents" name="accessoiresPresents" value={form.accessoiresPresents} onChange={handleChange} options={OUI_NON_PARTIEL} />
        <ChoiceField label="Documents présents" name="documentsPresents" value={form.documentsPresents} onChange={handleChange} options={OUI_NON_PARTIEL} />
        <ChoiceField label="Problème constaté" name="problemeConstate" value={form.problemeConstate} onChange={handleChange} options={OUI_NON} />
        {form.problemeConstate === 'Oui' && (
          <TextareaField label="Description du problème" name="descriptionProbleme" value={form.descriptionProbleme} onChange={handleChange} placeholder="Décrivez le problème constaté…" />
        )}
      </FormPanel>
      <FormPanel title="Décision & validation" icon={Shield}>
        <SelectField label="Action recommandée" name="actionRecommandee" value={form.actionRecommandee} onChange={handleChange} options={ACTION_OPTIONS} />
        <SelectField label="Emplacement machine" name="emplacementInterne" value={form.emplacementInterne} onChange={handleChange} options={EMPLACEMENT_OPTIONS} />
        <Field label="Validé par" name="valideParControle" value={form.valideParControle} onChange={handleChange} placeholder="Responsable du contrôle" />
        <Field label="Date du contrôle" name="dateControle" type="date" value={form.dateControle} onChange={handleChange} />
      </FormPanel>
    </>
  )
}

function DropZone({ onClick, icon: ZoneIcon, title, hint }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-5 py-7 text-center transition hover:border-brand-500 hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20">
      <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><ZoneIcon size={18} aria-hidden="true" /></span>
      <span className="text-sm font-semibold text-ink">{title}</span>
      <span className="text-xs text-ink-muted text-pretty">{hint}</span>
    </button>
  )
}

function MediaStep({ imagePreviews, existingImages, imageInputRef, handleImageChange, clearImage, totalImages, totalDocs, existingDocs, docFiles, removeExistingDoc, removeNewDoc, docInputRef, handleDocChange, isEdit, traceability }) {
  return (
    <>
      <section className="overflow-hidden rounded-xl border border-line bg-white">
        <PanelTitle icon={ImageIcon} count={`${totalImages} / 10`}>Photos</PanelTitle>
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          {totalImages > 0 && (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {existingImages.map((img, idx) => (
                <li key={img.publicId || idx} className="relative aspect-square overflow-hidden rounded-lg border border-line bg-slate-50">
                  <img src={img.url} alt={img.name || `Photo ${idx + 1}`} className="size-full object-cover" />
                  {idx === 0 && <span className="absolute bottom-1.5 left-1.5 rounded bg-ink/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">Couverture</span>}
                  <button type="button" onClick={() => clearImage(idx, 'existing')} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-md bg-white/95 text-red-600 shadow-card hover:bg-red-50" aria-label={`Retirer la photo ${idx + 1}`}>
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
              {imagePreviews.map((src, idx) => (
                <li key={'new-' + idx} className="relative aspect-square overflow-hidden rounded-lg border-2 border-brand-300 bg-brand-50">
                  <img src={src} alt={`Nouvelle photo ${idx + 1}`} className="size-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Nouvelle</span>
                  <button type="button" onClick={() => clearImage(idx, 'new')} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-md bg-white/95 text-red-600 shadow-card hover:bg-red-50" aria-label={`Retirer la nouvelle photo ${idx + 1}`}>
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <DropZone onClick={() => imageInputRef.current?.click()} icon={Upload} title="Ajouter des photos" hint="JPG, PNG, WEBP · 5 Mo max par image · 10 images max" />
          <input ref={imageInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={handleImageChange} />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-white">
        <PanelTitle icon={FileText} count={totalDocs}>Documents techniques</PanelTitle>
        <div className="flex flex-col gap-3 p-4 sm:p-5">
          {totalDocs > 0 && (
            <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
              {existingDocs.map((doc) => <DocRow key={doc.publicId} name={doc.name} href={doc.url} onRemove={() => removeExistingDoc(doc.publicId)} />)}
              {docFiles.map((f, i) => <DocRow key={'new-' + i} name={f.name} isNew onRemove={() => removeNewDoc(i)} />)}
            </ul>
          )}
          <DropZone onClick={() => docInputRef.current?.click()} icon={FileText} title="Ajouter des documents" hint="Manuels, certificats, fiches techniques · PDF, Word, Excel, PowerPoint" />
          <input ref={docInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={handleDocChange} />
        </div>
      </section>

      {isEdit && (
        <section className="overflow-hidden rounded-xl border border-line bg-white">
          <PanelTitle icon={Clock}>Traçabilité</PanelTitle>
          <dl className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0">
            {[
              ['Créé par', traceability.createdBy || '—'],
              ['Ajouté le', traceability.createdAt ? new Date(traceability.createdAt).toLocaleString('fr-FR') : '—'],
              ['Modifié par', traceability.updatedBy || '—'],
              ['Modifié le', traceability.updatedAt ? new Date(traceability.updatedAt).toLocaleString('fr-FR') : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                <dt className="text-xs text-ink-muted">{label}</dt>
                <dd className="truncate text-sm font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </>
  )
}

/* ─── Champs ─── */
function Field({ label, name, value, onChange, placeholder, type = 'text', required, error, mono, hint }) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="ui-label">
        {label}
        {required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}
      </label>
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`ui-input ${mono ? 'font-mono tracking-wide' : ''} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`}
      />
      {error
        ? <p id={`${name}-error`} className="mt-1.5 text-xs font-medium text-red-700">{error}</p>
        : hint && <p id={`${name}-hint`} className="mt-1.5 text-xs text-ink-faint">{hint}</p>}
    </div>
  )
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="ui-label">{label}</label>
      <div className="relative">
        <select id={name} name={name} value={value} onChange={onChange} className="ui-select appearance-none pr-10">
          <option value="">Sélectionner…</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
      </div>
    </div>
  )
}

const CHOICE_TONE = {
  Oui: 'bg-teal-600 text-white', 'Teste OK': 'bg-teal-600 text-white', Conforme: 'bg-teal-600 text-white', Neuf: 'bg-teal-600 text-white',
  Non: 'bg-red-600 text-white', 'Echec test': 'bg-red-600 text-white', 'Non conforme': 'bg-red-600 text-white', Endommage: 'bg-red-600 text-white',
}

function ChoiceField({ label, name, value, onChange, options, wide }) {
  const select = (v) => onChange({ target: { name, value: value === v ? '' : v } })
  return (
    <fieldset className={`min-w-0 ${wide ? 'md:col-span-2' : ''}`}>
      <legend className="ui-label">{label}</legend>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((o) => {
          const active = value === o
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => select(o)}
              className={`min-h-9 rounded-md px-3 text-sm font-medium ring-1 ring-inset transition-colors
                ${active ? `${CHOICE_TONE[o] || 'bg-brand-600 text-white'} ring-transparent` : 'bg-white text-ink-soft ring-line hover:bg-slate-50'}`}
            >
              {o}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function TextareaField({ label, name, value, onChange, placeholder }) {
  return (
    <div className="min-w-0 md:col-span-2">
      <label htmlFor={name} className="ui-label">{label}</label>
      <textarea id={name} name={name} value={value} onChange={onChange} rows={3} placeholder={placeholder} className="ui-textarea" />
    </div>
  )
}

function DocRow({ name, href, isNew, onRemove }) {
  const ext = name?.split('.').pop()?.toUpperCase().slice(0, 4) || 'DOC'
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-9 w-8 shrink-0 items-end justify-center rounded pb-1 text-[9px] font-bold ${ext === 'PDF' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-ink-muted'}`}>{ext}</span>
        {href
          ? <a href={href} target="_blank" rel="noreferrer" className="truncate text-sm font-medium text-ink hover:text-brand-700">{name}</a>
          : <span className="truncate text-sm font-medium text-ink">{name}</span>}
        {isNew && <span className="shrink-0 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-800">Nouveau</span>}
      </div>
      <button type="button" onClick={onRemove} className="grid size-8 shrink-0 place-items-center rounded-md text-ink-faint hover:bg-red-50 hover:text-red-600" aria-label={`Retirer ${name}`}>
        <X size={15} aria-hidden="true" />
      </button>
    </li>
  )
}
