import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import PdfViewer from '../../components/PdfViewer'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Edit2, Settings, FileText, AlertCircle,
  Cpu, Download, Eye, Truck, CalendarDays, ShieldCheck, Image as ImageIcon,
  Trash2, Building2, Hash, Layers3, Bot, Lightbulb, Wrench, Sparkles,
} from 'lucide-react'

const tabs = [
  { key: 'general', label: 'Informations' },
  { key: 'documents', label: 'Documents' },
  { key: 'gallery', label: 'Galerie' },
  { key: 'intervention', label: 'Historique' },
  { key: 'assistant', label: 'Assistant IA' },
]

function normalizeRole(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getStoredRole() {
  if (typeof window === 'undefined') return ''
  const stored = window.localStorage.getItem('auth_user')
  if (!stored) return ''
  try {
    return JSON.parse(stored)?.role || ''
  } catch {
    return ''
  }
}

function formatDate(value) {
  if (!value) return 'Non renseignee'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('fr-FR')
}

function DetailField({ label, value, mono = false }) {
  const display = value === null || value === undefined || value === '' ? '—' : value
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className={`mt-0.5 break-words text-sm font-semibold text-ink ${mono ? 'break-all font-mono' : ''}`}>{display}</p>
    </div>
  )
}

function TabButton({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`-mb-px border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
        active ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  )
}

function DocCard({ doc, onPreview, active }) {
  const isPdf = doc.name?.toLowerCase().endsWith('.pdf') || doc.format === 'pdf'
  const ext = doc.name?.split('.').pop()?.toUpperCase() || 'FILE'

  const extColors = {
    PDF: 'bg-red-50 text-red-600 border-red-100',
    DOC: 'bg-blue-50 text-blue-600 border-blue-100',
    DOCX: 'bg-blue-50 text-blue-600 border-blue-100',
    XLS: 'bg-green-50 text-green-600 border-green-100',
    XLSX: 'bg-green-50 text-green-600 border-green-100',
  }
  const colorClass = extColors[ext] || 'bg-slate-50 text-slate-600 border-slate-100'

  return (
    <div className={`flex items-center gap-3 p-3 bg-white border rounded-xl hover:border-blue-200 hover:shadow-sm transition-all group ${active ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'}`}>
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${colorClass}`}>
        <FileText size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${colorClass}`}>{ext}</span>
          {doc.bytes && <span className="text-[10px] text-slate-400 font-medium">{(doc.bytes / 1024).toFixed(0)} Ko</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        {isPdf && (
          <button onClick={() => onPreview(doc)} title="Afficher"
            className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all">
            <Eye size={15} />
          </button>
        )}
        <a href={doc.url} download={doc.name} target="_blank" rel="noreferrer" title="Telecharger"
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all">
          <Download size={15} />
        </a>
      </div>
    </div>
  )
}

export default function MachineDetails({ currentUser }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const [machine, setMachine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [activeTab, setActiveTab] = useState('general')
  const [deleting, setDeleting] = useState(false)
  const [interventions, setInterventions] = useState([])
  const [interventionsLoading, setInterventionsLoading] = useState(false)
  const [interventionsError, setInterventionsError] = useState(null)
  const [historyPage, setHistoryPage] = useState(1)
  const [issueInput, setIssueInput] = useState('')
  const [assistantResult, setAssistantResult] = useState(null)
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [assistantError, setAssistantError] = useState(null)
  const normalizedRole = normalizeRole(currentUser?.role || getStoredRole())
  const canManageMachines = !normalizedRole || normalizedRole !== 'technicien'

  useEffect(() => {
    apiFetch(`/machines/${id}`, { auth: true })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setMachine)
      .catch(() => setError('Machine introuvable.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    setInterventionsLoading(true)
    setInterventionsError(null)
    apiFetch(`/interventions/machine/${id}`, { auth: true })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((rows) => setInterventions(Array.isArray(rows) ? rows : []))
      .catch(() => setInterventionsError('Impossible de charger les interventions liées à cette machine.'))
      .finally(() => setInterventionsLoading(false))
  }, [id])

  const docs = useMemo(() => {
    try {
      return machine?.documentsJson ? JSON.parse(machine.documentsJson) : []
    } catch {
      return []
    }
  }, [machine?.documentsJson])

  const pdfDocs = useMemo(
    () => docs.filter((doc) => doc.name?.toLowerCase().endsWith('.pdf') || doc.format === 'pdf'),
    [docs],
  )

  const images = useMemo(() => {
    try {
      if (machine?.imagesJson) {
        const parsed = JSON.parse(machine.imagesJson)
        if (Array.isArray(parsed) && parsed.length) return parsed
      }
    } catch {
      // fallback to legacy field
    }
    if (machine?.imageUrl) {
      return [{ url: machine.imageUrl, publicId: machine.imagePublicId || 'legacy-image', name: 'Image machine' }]
    }
    return []
  }, [machine?.imagesJson, machine?.imageUrl, machine?.imagePublicId])

  useEffect(() => {
    if (!images.length) {
      setSelectedImage(null)
      return
    }
    setSelectedImage((current) => {
      if (current && images.some((img) => (img.publicId || img.url) === (current.publicId || current.url))) return current
      return images[0]
    })
  }, [images])

  useEffect(() => {
    if (!pdfDocs.length) {
      setPdfDoc(null)
      return
    }
    setPdfDoc((current) => {
      if (current && pdfDocs.some((doc) => doc.publicId === current.publicId)) return current
      return pdfDocs[0]
    })
  }, [pdfDocs])

  const docCount = docs.length
  const imageCount = images.length
  const createdAtLabel = machine?.createdAt ? new Date(machine.createdAt).toLocaleDateString('fr-FR') : '—'
  const updatedAtLabel = machine?.updatedAt ? new Date(machine.updatedAt).toLocaleDateString('fr-FR') : '—'

  const warrantyActive = useMemo(() => {
    if (!machine?.warrantyEndDate) return null
    return new Date(machine.warrantyEndDate) >= new Date()
  }, [machine?.warrantyEndDate])

  function getWarrantyLabel() {
    if (warrantyActive === null) return 'Non défini'
    return warrantyActive ? 'Oui' : 'Non'
  }
  const warrantyLabel = getWarrantyLabel()

  const interventionCards = useMemo(() => {
    return interventions.map((entry) => ({
      id: entry.id,
      date: entry.interventionDate || entry.date || 'Non renseignée',
      status: entry.status || 'PENDING',
      typeOfFault: entry.problemDescription || entry.request || entry.type || 'Non renseigné',
      telephoneDiagnostic: entry.telephoneDiagnostic || '',
      interventionSolution: entry.interventionDetail || '',
      technician: entry.technicianName || entry.assignee || entry.assignedTo || '',
      priority: entry.priority || '',
    }))
  }, [interventions])

  const historyPageSize = 5
  const historyTotalItems = interventionCards.length
  const historyTotalPages = Math.max(1, Math.ceil(historyTotalItems / historyPageSize))
  const safeHistoryPage = Math.min(historyPage, historyTotalPages)
  const historyStartIndex = (safeHistoryPage - 1) * historyPageSize
  const historyEndIndex = historyStartIndex + historyPageSize
  const paginatedHistory = interventionCards.slice(historyStartIndex, historyEndIndex)

  const nextImage = () => {
    if (!images.length || !selectedImage) return
    const currentIdx = images.findIndex((img) => (img.publicId || img.url) === (selectedImage.publicId || selectedImage.url))
    const nextIdx = currentIdx < images.length - 1 ? currentIdx + 1 : 0
    setSelectedImage(images[nextIdx])
  }

  const previousImage = () => {
    if (!images.length || !selectedImage) return
    const currentIdx = images.findIndex((img) => (img.publicId || img.url) === (selectedImage.publicId || selectedImage.url))
    const nextIdx = currentIdx > 0 ? currentIdx - 1 : images.length - 1
    setSelectedImage(images[nextIdx])
  }

  const handleDelete = async () => {
    if (!machine?.id || deleting) return
    if (!window.confirm(`Supprimer la machine "${machine.designation}" ?`)) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/machines/${machine.id}`, { method: 'DELETE', auth: true })
      if (!res.ok) throw new Error('Suppression echouee')
      navigate('/machines', { replace: true, state: { toast: { type: 'success', message: 'Machine supprimee avec succes.' } } })
    } catch {
      setDeleting(false)
      setError('Suppression impossible pour le moment.')
    }
  }

  const analyzeIssue = async () => {
    const descriptionPanne = issueInput.trim()
    if (!descriptionPanne) {
      setAssistantResult(null)
      setAssistantError(null)
      return
    }
    if (assistantLoading) return

    setAssistantLoading(true)
    setAssistantError(null)
    setAssistantResult(null)

    try {
      const response = await apiFetch('/machines/diagnostic-ai', {
        method: 'POST',
        auth: true,
        body: {
          machineId: Number(id),
          descriptionPanne,
        },
      })

      if (!response.ok) {
        let message = 'Erreur API lors de l analyse.'
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const maybe = await response.json().catch(() => null)
          if (maybe?.message) message = String(maybe.message)
        } else {
          const text = await response.text().catch(() => '')
          if (text) message = text
        }
        throw new Error(message)
      }

      const data = await response.json()
      const causesPossibles = Array.isArray(data?.causesPossibles) ? data.causesPossibles : []
      const solutionsRecommandees = Array.isArray(data?.solutionsRecommandees) ? data.solutionsRecommandees : []

      const causes = [...new Set(causesPossibles.map((v) => String(v).trim()).filter(Boolean))]
      const solutions = [...new Set(solutionsRecommandees.map((v) => String(v).trim()).filter(Boolean))]

      if (!causes.length && !solutions.length) {
        setAssistantError('Aucune reponse IA exploitable n a ete retournee.')
        return
      }

      setAssistantResult({ causes, solutions })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue.'
      setAssistantError(msg || 'Erreur inconnue.')
    } finally {
      setAssistantLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" role="status" aria-label="Chargement" />
      </div>
    )
  }

  if (error || !machine) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-slate-600 font-semibold">{error || 'Machine introuvable.'}</p>
          <button onClick={() => navigate('/machines')} className="ui-btn-primary">
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas overflow-x-hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <Motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={() => navigate('/machines')} className="ui-btn-ghost -ml-2 px-2">
              <ChevronLeft size={16} aria-hidden="true" /> Parc machines
            </button>
            {canManageMachines && (
              <div className="flex items-center gap-2">
                <button onClick={handleDelete} disabled={deleting} className="ui-btn-secondary text-red-600 hover:border-red-200 hover:bg-red-50">
                  <Trash2 size={15} aria-hidden="true" /> {deleting ? 'Suppression…' : 'Supprimer'}
                </button>
                <button onClick={() => navigate(`/machines/${id}/edit`)} className="ui-btn-primary">
                  <Edit2 size={15} aria-hidden="true" /> Modifier
                </button>
              </div>
            )}
          </div>

          <div className="ui-card overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="min-w-0 border-b border-line lg:col-span-5 lg:border-b-0 lg:border-r">
                <div className="relative flex aspect-[4/3] items-center justify-center bg-slate-50 p-4">
                  {selectedImage?.url
                    ? <img src={selectedImage.url} alt={machine.designation} className="max-h-full max-w-full rounded-lg object-contain" />
                    : <Cpu size={56} className="text-slate-300" aria-hidden="true" />}
                  {images.length > 1 && (
                    <>
                      <button onClick={previousImage} aria-label="Image précédente" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 text-ink shadow-sm ring-1 ring-line hover:bg-white">
                        <ChevronLeft size={16} />
                      </button>
                      <button onClick={nextImage} aria-label="Image suivante" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 text-ink shadow-sm ring-1 ring-line hover:bg-white">
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-6 gap-2 border-t border-line p-3">
                    {images.slice(0, 6).map((img) => {
                      const active = (selectedImage?.publicId || selectedImage?.url) === (img.publicId || img.url)
                      return (
                        <button
                          key={img.publicId || img.url}
                          onClick={() => setSelectedImage(img)}
                          aria-label={`Afficher ${img.name || 'image'}`}
                          aria-pressed={active}
                          className={`aspect-square overflow-hidden rounded-lg ring-2 ${active ? 'ring-brand-600' : 'ring-transparent hover:ring-line'}`}
                        >
                          <img src={img.url} alt="" className="h-full w-full object-cover" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-6 p-5 sm:p-7 lg:col-span-7">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="ui-badge bg-ink font-mono text-white ring-ink">{machine.code}</span>
                    <span className="ui-badge bg-slate-100 text-ink-muted ring-line">{machine.category || 'Catégorie non renseignée'}</span>
                    {warrantyActive !== null && (
                      <span className={`ui-badge ${warrantyActive ? 'bg-teal-50 text-teal-700 ring-teal-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
                        <ShieldCheck size={12} aria-hidden="true" /> Garantie {warrantyActive ? 'active' : 'expirée'}
                      </span>
                    )}
                  </div>
                  <h1 className="mt-3 break-words font-display text-2xl font-bold tracking-tight text-ink text-balance sm:text-3xl">{machine.designation}</h1>
                  {(machine.brand || machine.model) && (
                    <p className="mt-1 text-sm text-ink-muted">{[machine.brand, machine.model].filter(Boolean).join(' · ')}</p>
                  )}
                </div>

                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                  {[
                    { icon: Building2, label: 'Fournisseur', value: machine.supplier || 'Non renseigné' },
                    { icon: CalendarDays, label: 'Réception', value: formatDate(machine.receptionDate) },
                    { icon: Hash, label: 'Référence', value: machine.purchaseOrderNumber || machine.serialNumber || 'Non renseignée' },
                  ].map((item) => (
                    <div key={item.label} className="min-w-0">
                      <dt className="flex items-center gap-1.5 text-xs font-medium text-ink-muted"><item.icon size={13} aria-hidden="true" /> {item.label}</dt>
                      <dd className="mt-1 break-words text-sm font-semibold text-ink">{item.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-auto grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line ring-1 ring-line sm:grid-cols-4">
                  {[
                    { label: 'Images', value: imageCount },
                    { label: 'Documents', value: docCount },
                    { label: 'Créée le', value: createdAtLabel },
                    { label: 'Mise à jour', value: updatedAtLabel },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white px-3 py-3">
                      <p className="text-xs text-ink-muted">{label}</p>
                      <p className="mt-0.5 truncate font-display text-base font-bold text-ink">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Motion.section>

        <nav aria-label="Sections de la fiche machine" className="-mx-4 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-1">
            {tabs.map((tab) => (
              <TabButton key={tab.key} label={tab.label} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} />
            ))}
          </div>
        </nav>

        <AnimatePresence mode="wait">
          {activeTab === 'general' && (
            <Motion.section
              key="general"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Identification Machine */}
              <div className="ui-card p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                    <Cpu size={16} />
                  </div>
                  <div>
                    <h3 className="font-display text-[15px] font-bold text-ink">Identification Machine</h3>
                    <p className="text-xs text-ink-muted">Code interne, caractéristiques et statut</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <DetailField label="Code interne" value={machine.code} mono />
                  <DetailField label="Désignation" value={machine.designation} />
                  <DetailField label="Marque" value={machine.brand} />
                  <DetailField label="Modèle" value={machine.model} />
                  <DetailField label="N° de série" value={machine.serialNumber} mono />
                  <DetailField label="Année" value={machine.year} />
                  <DetailField label="Catégorie" value={machine.category} />
                  <DetailField label="Statut" value={machine.status} />
                </div>
              </div>

              {/* Origine & Fournisseur */}
              <div className="ui-card p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                    <Truck size={16} />
                  </div>
                  <div>
                    <h3 className="font-display text-[15px] font-bold text-ink">Origine & Fournisseur</h3>
                    <p className="text-xs text-ink-muted">Provenance, réception et garantie</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <DetailField label="Fournisseur" value={machine.supplier} />
                  <DetailField label="Réf. fournisseur" value={machine.referenceFournisseur} mono />
                  <DetailField label="Date de réception" value={formatDate(machine.receptionDate)} />
                  <DetailField label="Facture / BL" value={machine.purchaseOrderNumber} mono />
                  <DetailField label="Fin de garantie" value={formatDate(machine.warrantyEndDate)} />
                  <DetailField label="Durée garantie" value={machine.dureeGarantie} />
                  <DetailField label="État réception" value={machine.etatReception} />
                  <DetailField label="Garantie active" value={warrantyLabel} />
                </div>
                {machine.observationsReception && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Observations réception</p>
                    <p className="mt-1.5 text-sm font-medium text-slate-700 whitespace-pre-wrap">{machine.observationsReception}</p>
                  </div>
                )}
              </div>

              {/* Contrôle avant livraison */}
              <div className="ui-card p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h3 className="font-display text-[15px] font-bold text-ink">Contrôle Avant Livraison</h3>
                    <p className="text-xs text-ink-muted">Vérification technique et validation</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <DetailField label="Emplacement" value={machine.emplacementInterne} />
                  <DetailField label="État général" value={machine.etatGeneral} />
                  <DetailField label="Test fonctionnement" value={machine.testFonctionnement} />
                  <DetailField label="Accessoires présents" value={machine.accessoiresPresents} />
                  <DetailField label="Documents présents" value={machine.documentsPresents} />
                  <DetailField label="Problème constaté" value={machine.problemeConstate} />
                  <DetailField label="Action recommandée" value={machine.actionRecommandee} />
                  <DetailField label="Validé par" value={machine.valideParControle} />
                  <DetailField label="Date contrôle" value={formatDate(machine.dateControle)} />
                </div>
                {machine.problemeConstate === 'Oui' && machine.descriptionProbleme && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Description du problème</p>
                    <p className="mt-1.5 text-sm font-medium text-amber-900 whitespace-pre-wrap">{machine.descriptionProbleme}</p>
                  </div>
                )}
              </div>

              {/* Traçabilité */}
              <div className="ui-card p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                    <Layers3 size={16} />
                  </div>
                  <div>
                    <h3 className="font-display text-[15px] font-bold text-ink">Traçabilité</h3>
                    <p className="text-xs text-ink-muted">Historique de création et modification</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <DetailField label="Créé par" value={machine.createdBy} />
                  <DetailField label="Créé le" value={formatDate(machine.createdAt)} />
                  <DetailField label="Modifié par" value={machine.updatedBy} />
                  <DetailField label="Modifié le" value={formatDate(machine.updatedAt)} />
                </div>
                {machine.notes && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Notes</p>
                    <p className="mt-1.5 text-sm font-medium text-slate-700 whitespace-pre-wrap">{machine.notes}</p>
                  </div>
                )}
              </div>
            </Motion.section>
          )}

          {activeTab === 'documents' && (
            <Motion.section
              key="documents"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 xl:grid-cols-12 gap-6"
            >
              <div className="xl:col-span-4 min-w-0 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="ui-eyebrow mb-3">Liste des PDF</h3>
                  {pdfDocs.length === 0 ? (
                    <p className="text-sm text-slate-400">Aucun PDF disponible.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {pdfDocs.map((doc) => (
                        <DocCard
                          key={doc.publicId || doc.url}
                          doc={doc}
                          onPreview={setPdfDoc}
                          active={pdfDoc?.publicId === doc.publicId || pdfDoc?.url === doc.url}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {docs.length > pdfDocs.length && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="ui-eyebrow mb-3">Autres fichiers</h3>
                    <div className="space-y-2.5">
                      {docs.filter((doc) => !pdfDocs.some((pdf) => pdf.publicId === doc.publicId || pdf.url === doc.url)).map((doc) => (
                        <DocCard key={doc.publicId || doc.url} doc={doc} onPreview={setPdfDoc} active={false} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="xl:col-span-8 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="min-w-0 ui-eyebrow flex items-center gap-2">
                    <ShieldCheck size={13} /> Consultation du manuel PDF
                  </h3>
                  {pdfDoc && (
                    <a
                      href={pdfDoc.url}
                      download={pdfDoc.name}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-3 py-2 rounded-lg transition-all"
                    >
                      <Download size={13} /> Telecharger
                    </a>
                  )}
                </div>
                <PdfViewer url={pdfDoc?.url} name={pdfDoc?.name || 'Documentation machine'} embedded />
              </div>
            </Motion.section>
          )}

          {activeTab === 'gallery' && (
            <Motion.section
              key="gallery"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="min-w-0 ui-eyebrow flex items-center gap-2">
                    <ImageIcon size={13} /> Galerie machine
                  </h3>
                  {canManageMachines && (
                    <button
                      onClick={() => navigate(`/machines/${id}/edit`)}
                      className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Ajouter des images
                    </button>
                  )}
                </div>

                <div className="aspect-[16/8] min-h-[220px] sm:min-h-[260px] rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-100 to-slate-200/70 p-3 sm:p-4 flex items-center justify-center">
                  {selectedImage?.url
                    ? <img src={selectedImage.url} alt={machine.designation} className="max-w-full max-h-full rounded-xl object-contain bg-white shadow-sm" />
                    : <div className="text-center"><Cpu size={44} className="mx-auto text-slate-300" /><p className="text-sm text-slate-500 mt-2">Aucune image disponible</p></div>
                  }
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {images.map((img) => {
                    const active = (selectedImage?.publicId || selectedImage?.url) === (img.publicId || img.url)
                    return (
                      <Motion.button
                        whileHover={{ y: -3 }}
                        key={img.publicId || img.url}
                        onClick={() => setSelectedImage(img)}
                        className={`aspect-square rounded-xl border overflow-hidden ${active ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <img src={img.url} alt={img.name || machine.designation} className="w-full h-full object-cover" />
                      </Motion.button>
                    )
                  })}
                </div>
              </div>
            </Motion.section>
          )}

          {activeTab === 'intervention' && (
            <Motion.section
              key="intervention"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 xl:grid-cols-12 gap-6"
            >
              <div className="xl:col-span-12 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="ui-eyebrow flex items-center gap-2">
                      <Settings size={13} /> Historique des pannes
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">Consultez les pannes enregistrées, les diagnostics et les solutions associées.</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total</p>
                    <p className="text-lg font-black text-slate-900">{interventionCards.length}</p>
                  </div>
                </div>

                {interventionsLoading && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 font-medium">
                    Chargement des interventions...
                  </div>
                )}

                {!interventionsLoading && interventionsError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold">
                    {interventionsError}
                  </div>
                )}

                {!interventionsLoading && !interventionsError && interventionCards.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-700">Aucune panne enregistrée pour cette machine</p>
                    <p className="text-xs text-slate-500 mt-1">Les interventions liées à cette machine apparaîtront ici automatiquement.</p>
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {paginatedHistory.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 hover:border-blue-200 hover:bg-white transition-colors">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Numéro d’intervention: {item.id}</p>
                          <h4 className="mt-1 text-sm font-bold text-slate-900 break-words">{item.typeOfFault}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                            {item.status}
                          </span>
                          {item.priority && (
                            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                              {item.priority}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Panne / symptôme</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800 whitespace-pre-wrap">{item.typeOfFault}</p>
                        </div>
                        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                          <p className="text-[11px] font-black uppercase tracking-wider text-amber-800">Diagnostic à distance</p>
                          <p className="mt-1 text-sm font-medium text-amber-900 whitespace-pre-wrap">{item.telephoneDiagnostic || 'Non renseigné'}</p>
                        </div>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                          <p className="text-[11px] font-black uppercase tracking-wider text-emerald-800">Solution appliquée</p>
                          <p className="mt-1 text-sm font-medium text-emerald-900 whitespace-pre-wrap">{item.interventionSolution || 'Non renseignée'}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {item.date && <span className="rounded-lg bg-white px-2.5 py-1 border border-slate-200">{item.date}</span>}
                        {item.technician && <span className="rounded-lg bg-white px-2.5 py-1 border border-slate-200">Technicien: {item.technician}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {historyTotalItems > 0 && (
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs sm:text-sm text-slate-600 font-medium">
                      Affichage de{' '}
                      <span className="font-bold">
                        {historyStartIndex + 1}–{Math.min(historyEndIndex, historyTotalItems)}
                      </span>{' '}
                      sur <span className="font-bold">{historyTotalItems}</span>
                    </p>

                    {historyTotalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                          disabled={safeHistoryPage === 1}
                          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border transition-all ${
                            safeHistoryPage === 1
                              ? 'text-slate-400 border-slate-200 bg-white cursor-not-allowed'
                              : 'text-slate-700 border-slate-300 bg-white hover:bg-slate-100'
                          }`}
                        >
                          Précédent
                        </button>
                        <span className="text-xs sm:text-sm text-slate-600">
                          Page <span className="font-bold">{safeHistoryPage}</span> sur{' '}
                          <span className="font-bold">{historyTotalPages}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setHistoryPage((page) => Math.min(historyTotalPages, page + 1))}
                          disabled={safeHistoryPage === historyTotalPages}
                          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border transition-all ${
                            safeHistoryPage === historyTotalPages
                              ? 'text-slate-400 border-slate-200 bg-white cursor-not-allowed'
                              : 'text-slate-700 border-slate-300 bg-white hover:bg-slate-100'
                          }`}
                        >
                          Suivant
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Motion.section>
          )}

          {activeTab === 'assistant' && (
            <Motion.section
              key="assistant"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6"
            >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="ui-eyebrow flex items-center gap-2">
                      <Bot size={13} /> Assistant IA de diagnostic
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">Saisissez un probleme ou un type de panne pour obtenir des causes possibles et des solutions recommandees.</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                    <Sparkles size={12} /> Gemini API
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label htmlFor="issue-input" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Description de la panne</label>
                  <div className="mt-2 flex flex-col sm:flex-row gap-2">
                    <input
                      id="issue-input"
                      value={issueInput}
                      onChange={(e) => setIssueInput(e.target.value)}
                      placeholder="Ex: vibration importante lors du demarrage"
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                    />
                    <button
                      onClick={analyzeIssue}
                      className="rounded-xl w-full sm:w-auto px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                    >
                      Analyser
                    </button>
                  </div>
                </div>

                {!assistantResult && (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                    {!assistantLoading && !assistantError && (
                      <>
                        <p className="text-sm font-semibold text-slate-700">Assistant pret a analyser votre saisie</p>
                        <p className="text-xs text-slate-500 mt-1">Aucune requete analysee pour le moment.</p>
                      </>
                    )}
                    {assistantLoading && (
                      <>
                        <p className="text-sm font-semibold text-slate-700">Analyse en cours...</p>
                        <p className="text-xs text-slate-500 mt-1">Merci de patienter pendant la generation de la reponse IA.</p>
                      </>
                    )}
                    {!assistantLoading && assistantError && (
                      <>
                        <p className="text-sm font-semibold text-slate-700">Analyse impossible</p>
                        <p className="text-xs text-slate-500 mt-1">{assistantError}</p>
                      </>
                    )}
                  </div>
                )}

                {assistantResult && (
                  <div className="mt-4 space-y-4">
                    {/* Causes possibles */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-2 mb-3">
                        <Lightbulb size={13} /> Causes possibles
                      </h4>
                      <ul className="space-y-2">
                        {assistantResult.causes.length > 0 ? (
                          assistantResult.causes.map((cause) => (
                            <li key={cause} className="text-sm text-amber-900/90">• {cause}</li>
                          ))
                        ) : (
                          <li className="text-sm text-amber-700/70 italic">Aucune cause retournee.</li>
                        )}
                      </ul>
                    </div>

                    {/* Solutions recommandées */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-2 mb-3">
                        <Wrench size={13} /> Solutions recommandees
                      </h4>
                      <ul className="space-y-2">
                        {assistantResult.solutions.length > 0 ? (
                          assistantResult.solutions.map((solution) => (
                            <li key={solution} className="text-sm text-emerald-900/90">• {solution}</li>
                          ))
                        ) : (
                          <li className="text-sm text-emerald-700/70 italic">Aucune solution retournee.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
            </Motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
