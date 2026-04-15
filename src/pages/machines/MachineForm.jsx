import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import { gsap } from 'gsap'
import {
  ChevronLeft, Save, Loader2, Settings, Upload, X, FileText,
  Image as ImageIcon, AlertCircle, Truck, CalendarDays,
} from 'lucide-react'

const CATEGORY_OPTIONS = ['Compresseur', 'Pompe', 'Moteur', 'Groupe electrogene', 'Climatisation', 'Autre']

const EMPTY_FORM = {
  code: '', designation: '', brand: '', model: '', serialNumber: '',
  year: '', supplier: '', receptionDate: '', purchaseOrderNumber: '', warrantyEndDate: '', unitAmount: '',
  category: '',
  notes: '',
}

function getFileIcon(name) {
  const ext = name?.split('.').pop()?.toLowerCase()
  if (['jpg','jpeg','png','webp','gif'].includes(ext)) return { type: 'image', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
  if (ext === 'pdf') return { type: 'pdf', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' }
  return { type: 'file', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' }
}

function DocPreviewCard({ name, url, isNew, onRemove, localFile }) {
  const [imgSrc, setImgSrc] = useState(null)
  const info = getFileIcon(name)
  const isImage = info.type === 'image'

  useEffect(() => {
    if (isImage) {
      if (localFile) {
        const src = URL.createObjectURL(localFile)
        setImgSrc(src)
        return () => URL.revokeObjectURL(src)
      } else if (url) {
        setImgSrc(url)
      }
    }
  }, [isImage, localFile, url])

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="h-24 bg-slate-50 flex items-center justify-center overflow-hidden">
        {isImage && imgSrc ? (
          <img src={imgSrc} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-10 h-12 rounded-lg border flex items-center justify-center ${info.bg}`}>
            <FileText size={18} className={info.color} />
          </div>
        )}
      </div>
      <div className="px-3 py-2">
        <p className="text-xs font-semibold text-slate-700 truncate">{name}</p>
        {isNew && <span className="text-[10px] font-bold text-blue-400">Nouveau</span>}
      </div>
      <button type="button" onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-6 h-6 bg-slate-900/75 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all">
        <X size={12} className="text-white" />
      </button>
    </div>
  )
}

function ImagePreviewCard({ image, localFile, onRemove }) {
  const [imgSrc, setImgSrc] = useState(null)

  useEffect(() => {
    if (localFile) {
      const src = URL.createObjectURL(localFile)
      setImgSrc(src)
      return () => URL.revokeObjectURL(src)
    }
    if (image?.url) {
      setImgSrc(image.url)
    }
  }, [image?.url, localFile])

  return (
    <div className="group relative w-28 h-28 rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-blue-300 transition-all">
      {imgSrc
        ? <img src={imgSrc} alt={image?.name || localFile?.name || 'image'} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={24} className="text-slate-300" /></div>
      }
      <button type="button" onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-6 h-6 bg-slate-900/75 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all">
        <X size={12} className="text-white" />
      </button>
    </div>
  )
}

export default function MachineForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const headerRef = useRef(null)

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [imageFiles, setImageFiles] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [imagesToRemove, setImagesToRemove] = useState([])
  const imageInputRef = useRef()

  const [docFiles, setDocFiles] = useState([])
  const [existingDocs, setExistingDocs] = useState([])
  const [docsToRemove, setDocsToRemove] = useState([])
  const docInputRef = useRef()

  const totalImagesCount = existingImages.length + imageFiles.length
  const totalDocsCount = existingDocs.length + docFiles.length
  const filledCoreFields = [form.code, form.designation, form.brand, form.model, form.serialNumber, form.year, form.category]
    .filter((value) => String(value || '').trim()).length

  useEffect(() => {
    if (!headerRef.current) return
    gsap.fromTo(headerRef.current, { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
  }, [])

  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    apiFetch(`/machines/${id}`, { auth: true })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setForm({
          code: data.code || '', designation: data.designation || '',
          brand: data.brand || '', model: data.model || '',
          serialNumber: data.serialNumber || '', year: data.year || '',
          supplier: data.supplier || '',
          receptionDate: data.receptionDate || '',
          purchaseOrderNumber: data.purchaseOrderNumber || '',
          warrantyEndDate: data.warrantyEndDate || '',
          unitAmount: data.unitAmount ?? '',
          category: data.category || '',
          notes: data.notes || '',
        })
        if (data.imagesJson) {
          try { setExistingImages(JSON.parse(data.imagesJson)) } catch {}
        } else if (data.imageUrl) {
          setExistingImages([
            {
              publicId: data.imagePublicId || null,
              url: data.imageUrl,
              name: data.designation ? `Image - ${data.designation}` : 'Image machine',
            },
          ])
        }
        if (data.documentsJson) {
          try { setExistingDocs(JSON.parse(data.documentsJson)) } catch {}
        }
      })
      .catch(() => setError('Impossible de charger la machine.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    const imageOnly = files.filter((f) => f.type.startsWith('image/'))
    setImageFiles((prev) => [...prev, ...imageOnly])
    e.target.value = ''
  }

  const removeNewImage = (idx) => setImageFiles((prev) => prev.filter((_, i) => i !== idx))

  const removeExistingImage = (img) => {
    const key = img.publicId || `url:${img.url}`
    setImagesToRemove((prev) => [...prev, key])
    setExistingImages((prev) => prev.filter((it) => (it.publicId || `url:${it.url}`) !== key))
  }

  const handleDocChange = (e) => {
    const files = Array.from(e.target.files || [])
    const pdfOnly = files.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    setDocFiles(prev => [...prev, ...pdfOnly])
    e.target.value = ''
  }

  const removeNewDoc = (idx) => setDocFiles(prev => prev.filter((_, i) => i !== idx))

  const removeExistingDoc = (publicId) => {
    setDocsToRemove(prev => [...prev, publicId])
    setExistingDocs(prev => prev.filter(d => d.publicId !== publicId))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.code.trim() || !form.designation.trim()) {
      setError('Le code et la designation sont obligatoires.')
      return
    }
    setSaving(true)
    setError(null)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
    imageFiles.forEach((f) => fd.append('images', f))
    if (imagesToRemove.length) fd.append('removeImages', JSON.stringify(imagesToRemove))
    docFiles.forEach(f => fd.append('documents', f))
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
        state: { toast: { type: 'success', message: isEdit ? 'Machine mise a jour.' : 'Machine creee avec succes.' } },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-slate-900">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-20 right-10 w-[34rem] h-[34rem] bg-blue-100/60 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-cyan-100/40 rounded-full blur-3xl" />
      </div>

      <header ref={headerRef} className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/machines')}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Settings size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900">{isEdit ? 'Modifier la machine' : 'Nouvelle machine'}</h1>
              <p className="text-[11px] text-slate-500">{isEdit ? `ID #${id}` : 'Enregistrement d une machine a reception'}</p>
            </div>
          </div>
          <button
            form="machine-form"
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-60 shadow-lg shadow-blue-200"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm mb-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_46%),radial-gradient(circle_at_bottom_left,_rgba(6,182,212,0.12),_transparent_40%)]" />
          <div className="relative p-6 sm:p-8 lg:p-9 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-[11px] font-black text-blue-700 uppercase tracking-[0.24em]">Configuration machine</p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
                {isEdit ? 'Modifier une machine avec une interface claire et structurée' : 'Créer une machine avec un flux de saisie rapide et professionnel'}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-6 max-w-2xl">
                Centralisez les informations principales, les fichiers visuels et les documents techniques dans une interface conçue pour une exploitation SaaS moderne.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 min-w-0 lg:min-w-[360px]">
              <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur px-4 py-3 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Images</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{totalImagesCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur px-4 py-3 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">PDF</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{totalDocsCount}</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-blue-100 bg-blue-50/80 backdrop-blur px-4 py-3 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Conseil</p>
                <p className="mt-1 text-sm font-medium text-blue-900/90">Renseignez d’abord les champs essentiels, puis ajoutez les images et le manuel PDF.</p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form id="machine-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_360px] gap-6 items-start">
            <div className="space-y-6 min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard label="Champs essentiels complétés" value={`${filledCoreFields}/7`} hint="Identité et classification" tone="blue" />
                <SummaryCard label="Images" value={String(totalImagesCount)} hint="Visuels joints" tone="green" />
                <SummaryCard label="PDF" value={String(totalDocsCount)} hint="Manuels importés" tone="slate" />
              </div>

              <Section title="Identité machine" accent="blue" description="Les informations de base sont regroupées ici dans une logique de saisie rapide.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Code *" name="code" value={form.code} onChange={handleChange} placeholder="EX-001" />
                  <Field label="Designation *" name="designation" value={form.designation} onChange={handleChange} placeholder="Compresseur d air" />
                  <Field label="Marque" name="brand" value={form.brand} onChange={handleChange} placeholder="Atlas Copco" />
                  <Field label="Modele" name="model" value={form.model} onChange={handleChange} placeholder="GA 15" />
                  <Field label="N de serie" name="serialNumber" value={form.serialNumber} onChange={handleChange} placeholder="SN-XXXXXXXX" mono />
                  <Field label="Annee" name="year" value={form.year} onChange={handleChange} placeholder="2020" />
                  <SelectField label="Categorie" name="category" value={form.category} onChange={handleChange} options={CATEGORY_OPTIONS} placeholder="Selectionner..." />
                  <Field label="Montant unitaire (DA)" name="unitAmount" type="number" value={form.unitAmount} onChange={handleChange} placeholder="0" />
                </div>
              </Section>

              <Section title="Réception & traçabilité" accent="teal" description="Informations d’achat et de réception pour la gestion opérationnelle.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Fournisseur" name="supplier" value={form.supplier} onChange={handleChange} placeholder="Nom du fournisseur" icon={<Truck size={13} />} />
                  <Field label="Date de reception" name="receptionDate" type="date" value={form.receptionDate} onChange={handleChange} icon={<CalendarDays size={13} />} />
                  <Field label="Bon de commande" name="purchaseOrderNumber" value={form.purchaseOrderNumber} onChange={handleChange} placeholder="BC-2026-0145" />
                  <Field label="Fin de garantie" name="warrantyEndDate" type="date" value={form.warrantyEndDate} onChange={handleChange} />
                </div>
              </Section>

              <Section title="Commentaires" accent="slate" description="Espace libre pour les observations techniques et remarques de terrain.">
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Notes, observations, remarques..."
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all resize-none"
                />
              </Section>

              <Section title="Médias et documents" accent="green" description="Ajoutez les visuels et le manuel pour une fiche machine complète.">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Images</p>
                        <p className="text-sm text-slate-500 mt-1">Photos d’identification et vues détaillées.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-700 transition-colors"
                      >
                        <Upload size={13} /> Ajouter
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {existingImages.map((img) => (
                        <ImagePreviewCard
                          key={img.publicId || img.url}
                          image={img}
                          onRemove={() => removeExistingImage(img)}
                        />
                      ))}
                      {imageFiles.map((file, i) => (
                        <ImagePreviewCard
                          key={`${file.name}-${i}`}
                          localFile={file}
                          onRemove={() => removeNewImage(i)}
                        />
                      ))}
                      {existingImages.length === 0 && imageFiles.length === 0 && (
                        <div className="w-28 h-28 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                          <ImageIcon size={28} className="text-slate-300" />
                        </div>
                      )}
                    </div>
                    <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">PDF</p>
                        <p className="text-sm text-slate-500 mt-1">Manuels et notices techniques.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => docInputRef.current?.click()}
                        className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-500 transition-colors"
                      >
                        <Upload size={13} /> Ajouter
                      </button>
                    </div>
                    {(existingDocs.length > 0 || docFiles.length > 0) ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {existingDocs.map((doc) => (
                          <DocPreviewCard
                            key={doc.publicId}
                            name={doc.name}
                            url={doc.url}
                            isNew={false}
                            onRemove={() => removeExistingDoc(doc.publicId)}
                          />
                        ))}
                        {docFiles.map((file, i) => (
                          <DocPreviewCard
                            key={i}
                            name={file.name}
                            localFile={file}
                            isNew={true}
                            onRemove={() => removeNewDoc(i)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                        <FileText size={28} className="mx-auto text-slate-300" />
                        <p className="mt-2 text-sm font-semibold text-slate-600">Aucun document ajouté</p>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500 mt-3">Ajoutez le manuel PDF, idéalement avec une table des matières structurée.</p>
                    <input ref={docInputRef} type="file" multiple accept=".pdf" className="hidden" onChange={handleDocChange} />
                  </div>
                </div>
              </Section>
            </div>

            <aside className="xl:sticky xl:top-24 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400 mb-4">Synthèse</p>
                <div className="space-y-3">
                  <MiniStat label="État" value={isEdit ? 'Modification' : 'Création'} tone="slate" />
                  <MiniStat label="Champs saisis" value={`${filledCoreFields}/7`} tone="blue" />
                  <MiniStat label="Médias" value={`${totalImagesCount + totalDocsCount}`} tone="green" />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-900 p-5 text-white shadow-lg">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-300 mb-3">Flux conseillé</p>
                <ol className="space-y-3 text-sm text-slate-200 leading-6">
                  <li>1. Saisir l’identité de la machine.</li>
                  <li>2. Renseigner la réception et la garantie.</li>
                  <li>3. Ajouter les médias et la documentation PDF.</li>
                </ol>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 mb-2">Aide rapide</p>
                <p className="text-sm text-blue-900/90 leading-6">
                  Gardez des libellés courts et homogènes pour faciliter les recherches, les filtres et la maintenance future.
                </p>
              </div>
            </aside>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/machines')}
              className="px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-60 shadow-lg shadow-blue-200"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

function MiniStat({ label, value, tone = 'slate' }) {
  const styles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  }

  return (
    <div className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${styles[tone]}`}>
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      <span className="text-sm font-black">{value}</span>
    </div>
  )
}

function Section({ title, accent = 'blue', description, children }) {
  const accents = {
    blue: 'border-blue-200 from-blue-50/90',
    teal: 'border-cyan-200 from-cyan-50/90',
    amber: 'border-amber-200 from-amber-50/90',
    green: 'border-emerald-200 from-emerald-50/90',
    slate: 'border-slate-200 from-slate-50/90',
  }

  return (
    <div className={`bg-gradient-to-br ${accents[accent]} to-white border rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-sm`}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.24em]">{title}</h2>
          {description && <p className="mt-2 text-sm text-slate-600 leading-6 max-w-2xl">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function SummaryCard({ label, value, hint, tone = 'slate' }) {
  const styles = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    green: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    slate: 'border-slate-200 bg-white text-slate-700',
  }

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${styles[tone]}`}>
      <p className="text-[11px] font-black uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{hint}</p>
    </div>
  )
}

function Field({ label, name, value, onChange, placeholder, type = 'text', mono, icon }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>}
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
          className={`w-full ${icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all ${mono ? 'font-mono' : ''}`} />
      </div>
    </div>
  )
}

function SelectField({ label, name, value, onChange, options, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <select name={name} value={value} onChange={onChange}
        className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all appearance-none cursor-pointer">
        {placeholder && <option value="" className="bg-white">{placeholder}</option>}
        {options.map(o => <option key={o} value={o} className="bg-white">{o}</option>)}
      </select>
    </div>
  )
}