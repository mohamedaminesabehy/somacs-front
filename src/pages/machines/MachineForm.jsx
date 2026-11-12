import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import { ChevronLeft, ChevronDown, Save, Loader2, Upload, X, FileText, Image as ImageIcon, AlertCircle, Cpu, Truck, ClipboardCheck, Shield, CheckCircle2, ImagePlus, Hash, Calendar, Tag, Package, Clock } from 'lucide-react'

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
  { id: 1, title: 'Origine', description: 'Fournisseur', icon: Truck },
  { id: 2, title: 'Machine', description: 'Identification', icon: Cpu },
  { id: 3, title: 'Contrôle', description: 'Avant livraison', icon: ClipboardCheck },
  { id: 4, title: 'Médias', description: 'Images & docs', icon: ImagePlus },
]

const EMPTY_FORM = { code: '', designation: '', brand: '', model: '', serialNumber: '', year: '', category: '', status: 'En stock', supplier: '', referenceFournisseur: '', receptionDate: '', purchaseOrderNumber: '', warrantyEndDate: '', dureeGarantie: '', etatReception: '', observationsReception: '', etatGeneral: '', testFonctionnement: '', accessoiresPresents: '', documentsPresents: '', problemeConstate: '', descriptionProbleme: '', actionRecommandee: '', valideParControle: '', dateControle: '', emplacementInterne: '' }

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
    if (!form.code.trim()) errs.code = 'Obligatoire'
    if (!form.designation.trim()) errs.designation = 'Obligatoire'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Only allow submission from the final step
    if (activeStep < STEPS.length) return
    setError(null)
    if (!validate()) { setError('Champs obligatoires manquants.'); return }
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
      navigate('/machines', { state: { toast: { type: 'success', message: 'OK' } } })
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  const totalDocs = existingDocs.length + docFiles.length
  const totalImages = existingImages.length + imageFiles.length

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-label="Chargement" />
    </div>
  )

  const current = STEPS[activeStep - 1]

  return (
    <div className="min-h-screen overflow-x-hidden bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <button type="button" onClick={() => navigate('/machines')} className="ui-btn-ghost h-10 w-10 shrink-0 px-0" aria-label="Retour au parc machines">
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="ui-eyebrow">Parc machines</p>
            <h1 className="truncate font-display text-lg font-bold text-ink sm:text-xl">
              {isEdit ? `Modifier ${form.designation || 'la machine'}` : 'Nouvelle machine'}
            </h1>
          </div>
          <button type="button" onClick={() => navigate('/machines')} className="ui-btn-secondary hidden sm:inline-flex">Annuler</button>
          <button form="machine-form" type="submit" disabled={saving || activeStep < STEPS.length} className="ui-btn-primary">
            {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
            <span className="hidden sm:inline">Enregistrer</span>
          </button>
        </div>
        <nav aria-label="Étapes du formulaire" className="mx-auto max-w-6xl px-4 pb-3 sm:px-6">
          <ol className="grid grid-cols-4 gap-1.5">
            {STEPS.map((step) => {
              const isActive = activeStep === step.id
              const isCompleted = activeStep > step.id
              const Icon = step.icon
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    aria-current={isActive ? 'step' : undefined}
                    className={`flex w-full min-w-0 items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors sm:px-3 ${isActive ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isActive ? 'bg-brand-600 text-white' : isCompleted ? 'bg-teal-600 text-white' : 'bg-slate-100 text-ink-faint'
                    }`}>
                      {isCompleted ? <CheckCircle2 size={15} aria-hidden="true" /> : <Icon size={15} aria-hidden="true" />}
                    </span>
                    <span className="hidden min-w-0 sm:block">
                      <span className={`block truncate text-sm font-semibold ${isActive ? 'text-brand-800' : 'text-ink'}`}>{step.title}</span>
                      <span className="block truncate text-xs text-ink-faint">{step.description}</span>
                    </span>
                  </button>
                  <span className={`mt-1 block h-1 rounded-full ${isActive || isCompleted ? 'bg-brand-600' : 'bg-slate-200'}`} aria-hidden="true" />
                </li>
              )
            })}
          </ol>
          <p className="mt-2 text-xs font-medium text-ink-muted sm:hidden">Étape {activeStep} sur {STEPS.length} · {current.title}</p>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
            <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        <form id="machine-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          {activeStep === 1 && <Step1 form={form} handleChange={handleChange} />}
          {activeStep === 2 && <Step2 form={form} handleChange={handleChange} fieldErrors={fieldErrors} />}
          {activeStep === 3 && <Step3 form={form} handleChange={handleChange} />}
          {activeStep === 4 && (
            <Step4
              imagePreviews={imagePreviews} existingImages={existingImages}
              imageInputRef={imageInputRef} handleImageChange={handleImageChange} clearImage={clearImage}
              totalImages={totalImages}
              totalDocs={totalDocs} existingDocs={existingDocs} docFiles={docFiles}
              removeExistingDoc={removeExistingDoc} removeNewDoc={removeNewDoc}
              docInputRef={docInputRef} handleDocChange={handleDocChange}
              isEdit={isEdit} traceability={traceability}
            />
          )}
          <Nav activeStep={activeStep} setActiveStep={setActiveStep} saving={saving} />
        </form>
      </main>
    </div>
  )
}

/* ─── Step 1: Origine & Fournisseur ─── */
function Step1({ form, handleChange }) {
  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <SectionHeader
        icon={Truck}
        title="Origine & Fournisseur"
        desc="Provenance, réception et informations de garantie"
      />

      <div className="ui-card p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Fournisseur" icon={Package} name="supplier" value={form.supplier} onChange={handleChange} placeholder="Nom du fournisseur" />
          <Field label="Référence fournisseur" icon={Hash} name="referenceFournisseur" value={form.referenceFournisseur} onChange={handleChange} placeholder="REF-XXX" />
          <Field label="Date d'arrivée" icon={Calendar} name="receptionDate" type="date" value={form.receptionDate} onChange={handleChange} />
          <Field label="Facture / BL" icon={FileText} name="purchaseOrderNumber" value={form.purchaseOrderNumber} onChange={handleChange} placeholder="N° document" />
          <Field label="Fin de garantie" icon={Calendar} name="warrantyEndDate" type="date" value={form.warrantyEndDate} onChange={handleChange} />
          <Field label="Durée garantie" icon={Clock} name="dureeGarantie" value={form.dureeGarantie} onChange={handleChange} placeholder="12 mois" />
          <SelectField label="État réception" name="etatReception" value={form.etatReception} onChange={handleChange} options={ETAT_RECEPTION_OPTIONS} />
        </div>

        <div className="mt-6">
          <TextareaField label="Observations" name="observationsReception" value={form.observationsReception} onChange={handleChange} placeholder="Remarques à la réception..." />
        </div>
      </div>
    </div>
  )
}

/* ─── Step 2: Identification Machine ─── */
function Step2({ form, handleChange, fieldErrors }) {
  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <SectionHeader
        icon={Cpu}
        title="Identification Machine"
        desc="Code interne, caractéristiques techniques et statut"
      />

      <div className="ui-card p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Code interne" icon={Hash} name="code" value={form.code} onChange={handleChange} placeholder="MACH-001" required error={fieldErrors.code} />
          <Field label="Désignation" icon={Tag} name="designation" value={form.designation} onChange={handleChange} placeholder="Compresseur à vis" required error={fieldErrors.designation} />
          <Field label="Marque" icon={Package} name="brand" value={form.brand} onChange={handleChange} placeholder="Atlas Copco" />
          <Field label="Modèle" name="model" value={form.model} onChange={handleChange} placeholder="GA 15" />
          <Field label="N° de série" icon={Cpu} name="serialNumber" value={form.serialNumber} onChange={handleChange} placeholder="SN-XXX" mono />
          <Field label="Année" icon={Calendar} name="year" value={form.year} onChange={handleChange} placeholder="2024" type="number" />
          <SelectField label="Catégorie" name="category" value={form.category} onChange={handleChange} options={CATEGORY_OPTIONS} />
          <SelectField label="Statut" name="status" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4">
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-brand-700" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-brand-900"><span className="font-semibold">Champs obligatoires.</span> Le code interne et la désignation identifient la machine dans le système.</p>
      </div>
    </div>
  )
}

/* ─── Step 3: Contrôle avant livraison ─── */
function Step3({ form, handleChange }) {
  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <SectionHeader
        icon={ClipboardCheck}
        title="Contrôle Avant Livraison"
        desc="Vérification technique et validation avant affectation"
      />

      <div className="ui-card p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField label="Emplacement machine" name="emplacementInterne" value={form.emplacementInterne} onChange={handleChange} options={EMPLACEMENT_OPTIONS} />
          <SelectField label="État général" name="etatGeneral" value={form.etatGeneral} onChange={handleChange} options={ETAT_GENERAL_OPTIONS} />
          <SelectField label="Test fonctionnement" name="testFonctionnement" value={form.testFonctionnement} onChange={handleChange} options={TEST_OPTIONS} />
          <SelectField label="Accessoires présents" name="accessoiresPresents" value={form.accessoiresPresents} onChange={handleChange} options={OUI_NON_PARTIEL} />
          <SelectField label="Documents présents" name="documentsPresents" value={form.documentsPresents} onChange={handleChange} options={OUI_NON_PARTIEL} />
          <SelectField label="Problème constaté" name="problemeConstate" value={form.problemeConstate} onChange={handleChange} options={OUI_NON} />
          <SelectField label="Action recommandée" name="actionRecommandee" value={form.actionRecommandee} onChange={handleChange} options={ACTION_OPTIONS} />
          <Field label="Validé par" icon={Shield} name="valideParControle" value={form.valideParControle} onChange={handleChange} placeholder="Responsable" />
          <Field label="Date contrôle" icon={Calendar} name="dateControle" type="date" value={form.dateControle} onChange={handleChange} />
        </div>

        {form.problemeConstate === 'Oui' && (
          <div className="mt-6">
            <TextareaField label="Description du problème" name="descriptionProbleme" value={form.descriptionProbleme} onChange={handleChange} placeholder="Décrivez le problème constaté..." />
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Step 4: Images & Documents ─── */
function Step4({ imagePreviews, existingImages, imageInputRef, handleImageChange, clearImage, totalImages, totalDocs, existingDocs, docFiles, removeExistingDoc, removeNewDoc, docInputRef, handleDocChange, isEdit, traceability }) {
  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <SectionHeader
        icon={ImagePlus}
        title="Images & Documents"
        desc="Photos de la machine et fichiers techniques associés"
      />

      {/* Images */}
      <div className="ui-card p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
            <ImageIcon size={16} />
          </div>
          <div>
            <h3 className="font-display text-[15px] font-bold text-ink">Images de la machine</h3>
            <p className="text-xs text-ink-muted">JPG, PNG, WEBP — max 5 Mo par image — jusqu'à 10 images</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Grid of existing + new images */}
          {totalImages > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {existingImages.map((img, idx) => (
                <div key={img.publicId || idx} className="relative group">
                  <div className="w-full aspect-square rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-50">
                    <img src={img.url} alt={img.name || 'image'} className="w-full h-full object-cover" />
                  </div>
                  <button type="button" onClick={() => clearImage(idx, 'existing')} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity shadow-lg hover:bg-red-600">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {imagePreviews.map((src, idx) => (
                <div key={'new-' + idx} className="relative group">
                  <div className="w-full aspect-square rounded-2xl border-2 border-blue-200 overflow-hidden bg-blue-50">
                    <img src={src} alt="nouvelle image" className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute top-2 left-2 rounded-full bg-blue-500 text-white px-2 py-0.5 text-[9px] font-black uppercase">Nouveau</span>
                  <button type="button" onClick={() => clearImage(idx, 'new')} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity shadow-lg hover:bg-red-600">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {totalImages === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
              <ImageIcon size={28} />
              <p className="text-sm font-medium">Aucune image ajoutée</p>
            </div>
          )}

          <button type="button" onClick={() => imageInputRef.current?.click()} className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl border-2 border-dashed border-line text-sm font-semibold text-ink-muted hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50/40 transition-all">
            <Upload size={16} /> Ajouter des images
          </button>
          <input ref={imageInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
        </div>
      </div>

      {/* Documents */}
      <div className="ui-card p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
            <FileText size={16} />
          </div>
          <div>
            <h3 className="font-display text-[15px] font-bold text-ink">Documents techniques</h3>
            <p className="text-xs text-ink-muted">Fiches techniques, manuels, certificats — PDF, Word, Excel</p>
          </div>
        </div>

        <div className="space-y-3">
          {totalDocs === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
              <FileText size={28} />
              <p className="text-sm font-medium">Aucun document ajouté</p>
            </div>
          )}
          {existingDocs.map((doc) => <DocRow key={doc.publicId} name={doc.name} href={doc.url} onRemove={() => removeExistingDoc(doc.publicId)} />)}
          {docFiles.map((f, i) => <DocRow key={'new-' + i} name={f.name} isNew onRemove={() => removeNewDoc(i)} />)}
          <button type="button" onClick={() => docInputRef.current?.click()} className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl border-2 border-dashed border-line text-sm font-semibold text-ink-muted hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50/40 transition-all">
            <Upload size={16} /> Ajouter un document
          </button>
          <input ref={docInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={handleDocChange} />
        </div>
      </div>

      {/* Traçabilité */}
      {isEdit && (
        <div className="ui-card p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Shield size={16} />
            </div>
            <div>
              <h3 className="font-display text-[15px] font-bold text-ink">Traçabilité</h3>
              <p className="text-xs text-ink-muted">Informations automatiques</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ReadOnlyField label="Créé par" value={traceability.createdBy || '—'} />
            <ReadOnlyField label="Ajouté le" value={traceability.createdAt ? new Date(traceability.createdAt).toLocaleString('fr-FR') : '—'} />
            <ReadOnlyField label="Modifié par" value={traceability.updatedBy || '—'} />
            <ReadOnlyField label="Modifié le" value={traceability.updatedAt ? new Date(traceability.updatedAt).toLocaleString('fr-FR') : '—'} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Navigation ─── */
function Nav({ activeStep, setActiveStep, saving }) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
      <button type="button" onClick={() => setActiveStep((s) => Math.max(1, s - 1))} disabled={activeStep === 1} className="ui-btn-secondary">
        <ChevronLeft size={16} aria-hidden="true" /> Précédent
      </button>
      {activeStep < STEPS.length ? (
        <button type="button" onClick={(e) => { e.preventDefault(); setActiveStep((s) => Math.min(STEPS.length, s + 1)) }} className="ui-btn-primary">
          Étape suivante <ChevronLeft size={16} className="rotate-180" aria-hidden="true" />
        </button>
      ) : (
        <button form="machine-form" type="submit" disabled={saving} className="ui-btn-primary">
          {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />} Enregistrer la machine
        </button>
      )}
    </div>
  )
}

/* ─── Section Header ─── */
function SectionHeader({ icon, title, desc }) {
  const SectionIcon = icon
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
        <SectionIcon size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2 className="font-display text-lg font-bold text-ink sm:text-xl">{title}</h2>
        <p className="text-sm leading-relaxed text-ink-muted">{desc}</p>
      </div>
    </div>
  )
}

/* ─── Field Components ─── */
function Field({ label, icon: Icon, name, value, onChange, placeholder, type = 'text', required, error, mono }) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="ui-label">
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" size={16} aria-hidden="true" />}
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          aria-invalid={error ? true : undefined}
          className={`ui-input ${Icon ? 'pl-10' : ''} ${mono ? 'font-mono' : ''} ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''}`}
        />
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">{error}</p>}
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

function TextareaField({ label, name, value, onChange, placeholder }) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="ui-label">{label}</label>
      <textarea id={name} name={name} value={value} onChange={onChange} rows={3} placeholder={placeholder} className="ui-textarea" />
    </div>
  )
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 px-4 py-3">
      <span className="block text-xs font-medium text-ink-muted">{label}</span>
      <span className="mt-0.5 block break-words text-sm font-semibold text-ink">{value}</span>
    </div>
  )
}

function DocRow({ name, href, isNew, onRemove }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><FileText size={15} aria-hidden="true" /></span>
        {href
          ? <a href={href} target="_blank" rel="noreferrer" className="truncate text-sm font-semibold text-ink hover:text-brand-700">{name}</a>
          : <span className="truncate text-sm font-semibold text-ink">{name}</span>}
        {isNew && <span className="ui-badge shrink-0 bg-brand-50 text-brand-700 ring-brand-200">Nouveau</span>}
      </div>
      <button type="button" onClick={onRemove} className="rounded-lg p-2 text-ink-faint hover:bg-red-50 hover:text-red-600" aria-label={`Retirer ${name}`}>
        <X size={16} />
      </button>
    </div>
  )
}
