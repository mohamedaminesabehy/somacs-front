import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ChevronLeft } from 'lucide-react'
import { apiFetch } from '../../api/apiClient'
import MachineSheetView from './details/MachineSheetView'
import MachineTimeline from '../../components/machine/MachineTimeline'

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

  const createdAtLabel = machine?.createdAt ? new Date(machine.createdAt).toLocaleDateString('fr-FR') : '—'
  const updatedAtLabel = machine?.updatedAt ? new Date(machine.updatedAt).toLocaleDateString('fr-FR') : '—'

  const warrantyActive = useMemo(() => {
    if (!machine?.warrantyEndDate) return null
    return new Date(machine.warrantyEndDate) >= new Date()
  }, [machine?.warrantyEndDate])

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
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="size-9 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" role="status" aria-label="Chargement de la machine" />
      </div>
    )
  }

  if (!machine) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-red-50 text-red-600"><AlertCircle size={22} aria-hidden="true" /></span>
        <div>
          <p className="font-display text-lg font-bold text-ink">Machine introuvable</p>
          <p className="mt-1 text-sm text-ink-muted">{error || 'Cette fiche n’existe pas ou a été supprimée.'}</p>
        </div>
        <button type="button" onClick={() => navigate('/machines')} className="ui-btn-primary">
          <ChevronLeft size={16} aria-hidden="true" /> Retour au parc machines
        </button>
      </div>
    )
  }

  return (
    <>
    <MachineSheetView
      machine={machine}
      navigate={navigate}
      id={id}
      error={error}
      canManageMachines={canManageMachines}
      deleting={deleting}
      onConfirmDelete={handleDelete}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      docs={docs}
      pdfDoc={pdfDoc}
      setPdfDoc={setPdfDoc}
      images={images}
      selectedImage={selectedImage}
      setSelectedImage={setSelectedImage}
      previousImage={previousImage}
      nextImage={nextImage}
      warrantyActive={warrantyActive}
      createdAtLabel={createdAtLabel}
      updatedAtLabel={updatedAtLabel}
      interventionCards={interventionCards}
      interventionsLoading={interventionsLoading}
      interventionsError={interventionsError}
      paginatedHistory={paginatedHistory}
      safeHistoryPage={safeHistoryPage}
      historyTotalPages={historyTotalPages}
      setHistoryPage={setHistoryPage}
      issueInput={issueInput}
      setIssueInput={setIssueInput}
      analyzeIssue={analyzeIssue}
      assistantLoading={assistantLoading}
      assistantError={assistantError}
      assistantResult={assistantResult}
    />
    <div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6">
      <MachineTimeline machineId={id} />
    </div>
    </>
  )
}
