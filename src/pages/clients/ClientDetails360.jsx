import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Settings,
  Wrench,
  ArrowLeft,
  AlertCircle,
  Eye,
  Hash,
  FileDigit,
  Loader2,
  RefreshCw,
  Globe,
  Tag,
  Calendar,
  User as UserIcon,
  ClipboardList,
  Stethoscope,
  CheckCircle2,
  Clock,
  PlayCircle,
  XCircle,
  AlertTriangle,
  Cpu,
  Hammer,
  X,
  Package,
  StickyNote,
  TrendingUp,
  FileText,
  Pencil,
  Save,
} from 'lucide-react'
import { apiFetch } from '../../api/apiClient'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import { EmptyState, InlineAlert, SkeletonLines } from '../../components/ui/Feedback'
import { StatStrip, Toast } from '../../components/ui/DataKit'

// ─── Helpers ───────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getInitials(name) {
  return String(name || '?')
    .split(' ').filter(Boolean).slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '').join('') || '?'
}

const FALLBACK = 'Non renseigné'
const PHONE_PREFIX = '+216'

function present(value) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

function valueOrFallback(value) {
  return present(value) ? value : FALLBACK
}

function isValidEmail(value) {
  if (!present(value)) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
}

function getPhoneDigits(value) {
  const raw = String(value || '').trim()
  const withoutPrefix = raw.startsWith(PHONE_PREFIX) ? raw.slice(PHONE_PREFIX.length) : raw
  return withoutPrefix.replace(/\D/g, '').slice(0, 8)
}

function normalizePhone(value) {
  return `${PHONE_PREFIX}${getPhoneDigits(value)}`
}

function isValidPhone(value) {
  return new RegExp(`^\\${PHONE_PREFIX}\\d{8}$`).test(String(value || '').trim())
}

function getInterventionMachine(intervention) {
  const machine = intervention?.machineEntity || intervention?.machine || intervention?.equipment || null
  if (machine) return machine

  if (
    present(intervention?.machineId) ||
    present(intervention?.machineType) ||
    present(intervention?.machineBrand) ||
    present(intervention?.machineModel) ||
    present(intervention?.serialNumber)
  ) {
    return {
      id: intervention.machineId,
      designation: intervention.machineType,
      brand: intervention.machineBrand,
      model: intervention.machineModel,
      serialNumber: intervention.serialNumber,
    }
  }

  return null
}

function getMachineLabel(machine) {
  return (
    machine?.designation ||
    machine?.name ||
    machine?.machineType ||
    machine?.type ||
    machine?.label ||
    ''
  )
}

function getMachineReference(machine) {
  return machine?.code || machine?.reference || machine?.referenceFournisseur || ''
}

function formatMachineDisplay(machine) {
  const label = getMachineLabel(machine) || ''
  const ref = getMachineReference(machine)
  const display = ref ? `${label} (${ref})`.trim() : label.trim()
  return display || null
}

function machineKey(machine) {
  if (!machine) return null
  if (present(machine.id)) return `id:${machine.id}`
  if (present(machine.serialNumber)) return `serial:${String(machine.serialNumber).toLowerCase()}`

  const ref = getMachineReference(machine)
  if (present(ref)) return `ref:${String(ref).toLowerCase()}`

  const signature = [getMachineLabel(machine), machine.brand, machine.model]
    .filter(present)
    .map((v) => String(v).trim().toLowerCase())
    .join('|')

  return signature ? `sig:${signature}` : null
}

function enrichMachinesForClient(directMachines, interventions) {
  const byKey = new Map()

  const addMachine = (machine, extra = {}) => {
    const key = machineKey(machine)
    if (!key) return

    const existing = byKey.get(key) || {}
    byKey.set(key, {
      ...machine,
      ...existing,
      ...Object.fromEntries(
        Object.entries(machine || {}).filter(([, value]) => present(value)),
      ),
      ...extra,
      id: existing.id ?? machine?.id ?? extra.id,
      interventionCount: extra.interventionCount ?? existing.interventionCount ?? 0,
      lastInterventionDate: extra.lastInterventionDate ?? existing.lastInterventionDate ?? null,
    })
  }

  directMachines.forEach((machine) => addMachine(machine))

  const stats = new Map()
  interventions.forEach((intervention) => {
    const machine = getInterventionMachine(intervention)
    const key = machineKey(machine)
    if (!key) return

    const current = stats.get(key) || { count: 0, lastDate: null, machine }
    const date = intervention.interventionDate || intervention.createdAt || null
    const currentTime = current.lastDate ? new Date(current.lastDate).getTime() : 0
    const nextTime = date ? new Date(date).getTime() : 0

    stats.set(key, {
      count: current.count + 1,
      lastDate: nextTime > currentTime ? date : current.lastDate,
      machine: { ...current.machine, ...machine },
    })
  })

  stats.forEach((stat, key) => {
    addMachine(stat.machine, {
      interventionCount: stat.count,
      lastInterventionDate: stat.lastDate,
    })

    const machine = byKey.get(key)
    if (machine) {
      byKey.set(key, {
        ...machine,
        interventionCount: stat.count,
        lastInterventionDate: stat.lastDate,
      })
    }
  })

  return Array.from(byKey.values())
}

const TONE_CLASSES = {
  teal: { cls: 'bg-teal-50 text-teal-800 border-teal-200', dot: 'bg-teal-500' },
  brand: { cls: 'bg-brand-50 text-brand-700 border-brand-200', dot: 'bg-brand-600' },
  amber: { cls: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  red: { cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  slate: { cls: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
}

const preset = (label, tone, icon) => ({ label, tone, icon, ...TONE_CLASSES[tone] })

const STATUS_PRESETS = {
  COMPLETED: preset('Terminée', 'teal', CheckCircle2),
  TERMINEE: preset('Terminée', 'teal', CheckCircle2),
  DONE: preset('Terminée', 'teal', CheckCircle2),
  CLOSED: preset('Clôturée', 'teal', CheckCircle2),
  CLOTURE: preset('Clôturée', 'teal', CheckCircle2),
  CLOTUREE: preset('Clôturée', 'teal', CheckCircle2),
  CLÔTURÉE: preset('Clôturée', 'teal', CheckCircle2),
  OPEN: preset('Ouverte', 'brand', ClipboardList),
  OUVERTE: preset('Ouverte', 'brand', ClipboardList),
  IN_PROGRESS: preset('En cours', 'amber', PlayCircle),
  EN_COURS: preset('En cours', 'amber', PlayCircle),
  ASSIGNED: preset('Affectée', 'brand', ClipboardList),
  AFFECTEE: preset('Affectée', 'brand', ClipboardList),
  ASSIGNEE: preset('Affectée', 'brand', ClipboardList),
  PENDING: preset('En attente', 'slate', Clock),
  EN_ATTENTE: preset('En attente', 'slate', Clock),
  CANCELLED: preset('Annulée', 'red', XCircle),
  ANNULEE: preset('Annulée', 'red', XCircle),
}

function getStatusPreset(status) {
  const k = String(status || '').toUpperCase().replace(/[\s-]/g, '_')
  return STATUS_PRESETS[k] || preset(status || '—', 'slate', ClipboardList)
}

function machineTone(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('panne') || s.includes('hors')) return 'red'
  if (s.includes('maintenance')) return 'amber'
  if (s.includes('service') || s.includes('disponible') || s.includes('stock')) return 'teal'
  if (s.includes('utilisation')) return 'brand'
  return 'slate'
}

function MachineStatusPill({ status }) {
  return <StatusBadge tone={machineTone(status)}>{status || '—'}</StatusBadge>
}

function PriorityPill({ priority }) {
  const p = String(priority || '').toLowerCase()
  if (!p) return null
  let tone = 'slate'
  if (p.includes('crit') || p.includes('urg')) tone = 'red'
  else if (p.includes('haut') || p === 'high') tone = 'amber'
  else if (p.includes('moyen') || p === 'medium') tone = 'brand'
  return <StatusBadge tone={tone} dot={false}>{priority}</StatusBadge>
}

function InfoCard({ icon, label, value, mono = false }) {
  const InfoIcon = icon
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-ink-muted">
        <InfoIcon size={15} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-ink-muted">{label}</p>
        <p className={`mt-0.5 break-words text-sm text-ink ${mono ? 'font-mono' : 'font-semibold'}`}>
          {value || <span className="font-sans font-normal text-ink-faint">Non renseigné</span>}
        </p>
      </div>
    </div>
  )
}

function ClientEditField({ icon: Icon, label, name, value, onChange, required = false, type = 'text', multiline = false }) {
  const fieldId = `client-${name}`
  return (
    <div className={multiline ? 'min-w-0 sm:col-span-2' : 'min-w-0'}>
      <label htmlFor={fieldId} className="ui-label flex items-center gap-1.5">
        {Icon && <Icon size={13} aria-hidden="true" />}
        {label}
        {required && <span className="text-red-500" aria-hidden="true">*</span>}
      </label>
      {multiline ? (
        <textarea id={fieldId} name={name} value={value} onChange={onChange} rows={3} className="ui-textarea" />
      ) : (
        <input id={fieldId} name={name} type={type} value={value} onChange={onChange} required={required} className="ui-input" />
      )}
    </div>
  )
}

function ClientPhoneEditField({ value, onChange }) {
  const digits = getPhoneDigits(value)

  const handleDigitsChange = (event) => {
    const nextDigits = event.target.value.replace(/\D/g, '').slice(0, 8)
    onChange({ target: { name: 'phone', value: `${PHONE_PREFIX}${nextDigits}` } })
  }

  return (
    <div className="min-w-0">
      <label htmlFor="client-phone" className="ui-label flex items-center gap-1.5">
        <Phone size={13} aria-hidden="true" />
        Téléphone
      </label>
      <div className="flex overflow-hidden rounded-xl border border-line bg-white transition-colors focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
        <span className="inline-flex select-none items-center border-r border-line bg-slate-50 px-3 text-sm font-semibold text-ink-soft">
          {PHONE_PREFIX}
        </span>
        <input
          id="client-phone"
          name="phoneDigits"
          type="text"
          value={digits}
          onChange={handleDigitsChange}
          inputMode="numeric"
          pattern="[0-9]{8}"
          maxLength={8}
          autoComplete="tel-national"
          className="h-11 w-full border-0 bg-white px-3 text-sm text-ink outline-none"
        />
      </div>
      <p className="mt-1.5 text-xs text-ink-faint">8 chiffres après l&apos;indicatif.</p>
    </div>
  )
}

// ─── Cards ─────────────────────────────────────────────────────────────────

function MachineCard({ machine }) {
  const reference = getMachineReference(machine)
  return (
    <li className="flex flex-col gap-3 p-4 sm:px-5 xl:flex-row xl:items-center xl:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
          <Cpu size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{valueOrFallback(getMachineLabel(machine))}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
            <span className="ui-ref">{reference || (present(machine.id) ? `#${machine.id}` : FALLBACK)}</span>
            {[machine.brand, machine.model].filter(present).join(' · ')}
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-3 text-xs xl:w-80 xl:shrink-0">
        <div className="min-w-0">
          <dt className="text-ink-muted">N° série</dt>
          <dd className="truncate font-mono text-ink">{present(machine.serialNumber) ? machine.serialNumber : '—'}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Interventions</dt>
          <dd className="font-semibold tabular-nums text-ink">{Number(machine.interventionCount) || 0}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Dernière</dt>
          <dd className="font-semibold text-ink">{machine.lastInterventionDate ? fmtDate(machine.lastInterventionDate) : '—'}</dd>
        </div>
      </dl>
      <div className="xl:w-28 xl:shrink-0 xl:text-right">
        <MachineStatusPill status={machine.status} />
      </div>
    </li>
  )
}

function InterventionCard({ intervention, onView }) {
  const status = getStatusPreset(intervention.status)
  const machine = getInterventionMachine(intervention)
  const technician = intervention.technicianName || intervention.assignedTo

  return (
    <li className="relative flex gap-4 pb-6 pl-8 last:pb-0">
      <span className="absolute left-[11px] top-7 bottom-0 w-px bg-line" aria-hidden="true" />
      <span className={`absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white ring-1 ${status.cls}`} aria-hidden="true">
        <span className={`h-2 w-2 rounded-full ${status.dot}`} />
      </span>
      <article className="min-w-0 flex-1 rounded-2xl border border-line bg-white p-4 transition-shadow hover:shadow-raised sm:p-5">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              <span className="ui-ref">{intervention.id}</span>
              <span className="inline-flex items-center gap-1"><Calendar size={12} aria-hidden="true" />{fmtDate(intervention.interventionDate)}</span>
            </p>
            <h3 className="mt-1 font-display text-[15px] font-bold text-ink">
              {intervention.interventionType || 'Intervention'}
              <span className="font-normal text-ink-muted"> — {valueOrFallback(getMachineLabel(machine))}</span>
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            <PriorityPill priority={intervention.priority} />
          </div>
        </header>

        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs text-ink-muted"><AlertTriangle size={12} aria-hidden="true" /> Panne / symptôme</dt>
            <dd className="mt-0.5 line-clamp-2 text-ink-soft">{intervention.problemDescription || <span className="text-ink-faint">Non renseigné</span>}</dd>
          </div>
          <div className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs text-ink-muted"><Wrench size={12} aria-hidden="true" /> Solution appliquée</dt>
            <dd className="mt-0.5 line-clamp-2 text-ink-soft">{intervention.interventionDetail || <span className="text-ink-faint">Non renseigné</span>}</dd>
          </div>
          {intervention.telephoneDiagnostic && (
            <div className="min-w-0 sm:col-span-2">
              <dt className="flex items-center gap-1.5 text-xs text-ink-muted"><Stethoscope size={12} aria-hidden="true" /> Diagnostic à distance</dt>
              <dd className="mt-0.5 line-clamp-2 text-ink-soft">{intervention.telephoneDiagnostic}</dd>
            </div>
          )}
        </dl>

        <footer className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="flex min-w-0 items-center gap-2 text-sm text-ink-soft">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-bold text-white">
              {technician ? getInitials(technician) : <UserIcon size={13} aria-hidden="true" />}
            </span>
            <span className="truncate">{technician || 'Technicien non affecté'}</span>
          </span>
          <button type="button" onClick={onView} className="ui-btn-secondary ui-btn-sm shrink-0">
            <Eye size={14} aria-hidden="true" /> Détail
          </button>
        </footer>
      </article>
    </li>
  )
}

function SectionShell({ icon, title, description, count, actions, children }) {
  const Icon = icon
  return (
    <section className="ui-card overflow-hidden">
      <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
            <Icon size={17} aria-hidden="true" />
          </span>
          <div>
            <h2 className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
              {title}
              {count != null && (
                <span className="rounded-md bg-slate-100 px-1.5 text-xs font-semibold tabular-nums text-ink-muted">{count}</span>
              )}
            </h2>
            {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
          </div>
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}


// ─── Page ──────────────────────────────────────────────────────────────────

export default function ClientDetails360() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedIntervention, setSelectedIntervention] = useState(null)
  const [isEditingClient, setIsEditingClient] = useState(false)
  const [clientDraft, setClientDraft] = useState(null)
  const [clientEditError, setClientEditError] = useState('')
  const [savingClient, setSavingClient] = useState(false)
  const [toast, setToast] = useState('')
  const [currentSavPage, setCurrentSavPage] = useState(1)

  const load = useCallback(() => {
    let alive = true
    setLoading(true)
    setError(null)
    apiFetch(`/clients/${id}/360`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => alive && setData(j))
      .catch((err) => alive && setError(err))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [id])

  useEffect(() => load(), [id, load])

  const client = data?.client
  const directMachines = useMemo(() => data?.machines || [], [data])
  const interventions = useMemo(() => data?.interventions || [], [data])
  const machines = useMemo(
    () => enrichMachinesForClient(directMachines, interventions),
    [directMachines, interventions],
  )

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const getClientDraft = (source) => ({
    name: source?.name || '',
    taxId: source?.taxId || '',
    phone: normalizePhone(source?.phone || ''),
    email: source?.email || '',
    web: source?.web || '',
    city: source?.city || '',
    address: source?.address || '',
  })

  const startClientEdit = () => {
    setClientDraft(getClientDraft(client))
    setClientEditError('')
    setIsEditingClient(true)
  }

  const cancelClientEdit = () => {
    setClientDraft(getClientDraft(client))
    setClientEditError('')
    setIsEditingClient(false)
  }

  const handleClientDraftChange = (event) => {
    const { name, value } = event.target
    setClientDraft((prev) => ({
      ...(prev || getClientDraft(client)),
      [name]: name === 'phone' ? normalizePhone(value) : value,
    }))
    setClientEditError('')
  }

  const saveClient = async () => {
    const draft = clientDraft || getClientDraft(client)
    const payload = Object.fromEntries(
      Object.entries(draft).map(([key, value]) => [key, String(value ?? '').trim()]),
    )

    if (!payload.name) {
      setClientEditError('Le nom du client est obligatoire.')
      return
    }

    if (!isValidEmail(payload.email)) {
      setClientEditError('Veuillez saisir une adresse email valide')
      return
    }

    if (!isValidPhone(payload.phone)) {
      setClientEditError('Le numéro doit contenir exactement 8 chiffres après +216')
      return
    }

    setSavingClient(true)
    setClientEditError('')

    try {
      const response = await apiFetch(`/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let message = `Erreur HTTP ${response.status}`
        try {
          const errorBody = await response.json()
          message = errorBody?.message || message
        } catch {
          // Error response body is optional.
        }
        throw new Error(message)
      }

      const updatedClient = await response.json()
      setData((prev) => ({
        ...prev,
        client: {
          ...(prev?.client || client),
          ...updatedClient,
        },
      }))
      setClientDraft(getClientDraft(updatedClient))
      setIsEditingClient(false)
      setToast('Modification réussie')
    } catch (err) {
      setClientEditError(err?.message || 'Impossible de modifier ce client.')
    } finally {
      setSavingClient(false)
    }
  }

  const canEditClient = (() => {
    try {
      const authUser = JSON.parse(window.localStorage.getItem('auth_user') || 'null')
      return String(authUser?.role || '').trim().toLowerCase() !== 'technicien'
    } catch {
      return false
    }
  })()

  if (loading) {
    return (
      <div className="ui-page" aria-busy="true">
        <div className="ui-card flex flex-col gap-4 p-6">
          <div className="flex items-center gap-4">
            <div className="ui-skeleton h-16 w-16 rounded-2xl" />
            <div className="flex-1">
              <SkeletonLines count={2} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="ui-card p-6"><SkeletonLines count={6} /></div>
          <div className="ui-card p-6 lg:col-span-2"><SkeletonLines count={6} /></div>
        </div>
        <p className="sr-only">Chargement de la fiche client…</p>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="ui-page">
        <div className="ui-card mx-auto w-full max-w-lg">
          <EmptyState
            icon={AlertCircle}
            title="Impossible de charger ce client"
            description={error?.message || 'Erreur inconnue'}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <button type="button" onClick={() => navigate(-1)} className="ui-btn-secondary">Retour</button>
                <button type="button" onClick={load} className="ui-btn-primary">Réessayer</button>
              </div>
            }
          />
        </div>
      </div>
    )
  }

  const openInterventions = interventions.filter((i) => getStatusPreset(i.status).tone !== 'teal').length
  const machinesInAlert = machines.filter((m) => ['red', 'amber'].includes(machineTone(m.status))).length
  const lastIntervention = interventions
    .map((i) => i.interventionDate)
    .filter(Boolean)
    .sort()
    .pop()

  const SAV_PER_PAGE = 4
  const totalSavPages = Math.max(1, Math.ceil(interventions.length / SAV_PER_PAGE))
  const safeSavPage = Math.min(currentSavPage, totalSavPages)
  const savVisible = interventions.slice((safeSavPage - 1) * SAV_PER_PAGE, safeSavPage * SAV_PER_PAGE)

  return (
    <div className="ui-page">
      <Toast toast={toast ? { type: 'success', message: toast } : null} onClose={() => setToast('')} />

      <PageHeader
        breadcrumbs={[{ label: 'Clients', to: '/clients' }, { label: client.name }]}
        eyebrow="Fiche client 360°"
        title={client.name}
        icon={Building2}
        meta={
          <>
            <span className="ui-ref">{client.code || `#${client.id}`}</span>
            {client.type && <StatusBadge tone="slate" dot={false}>{client.type}</StatusBadge>}
            {client.zone && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-muted"><MapPin size={12} aria-hidden="true" /> Zone {client.zone}</span>
            )}
          </>
        }
        actions={
          <>
            <button type="button" onClick={() => navigate('/clients')} className="ui-btn-ghost">
              <ArrowLeft size={16} aria-hidden="true" /> Liste
            </button>
            <button type="button" onClick={load} className="ui-btn-secondary">
              <RefreshCw size={16} aria-hidden="true" /> Actualiser
            </button>
          </>
        }
      />

      <StatStrip
        items={[
          { key: 'machines', label: 'Équipements', value: machines.length, icon: Cpu, tone: 'brand', showShare: false },
          { key: 'alerts', label: 'Équipements en alerte', value: machinesInAlert, icon: AlertTriangle, tone: machinesInAlert ? 'red' : 'slate', showShare: false, hint: 'Panne ou maintenance' },
          { key: 'interventions', label: 'Interventions', value: interventions.length, icon: Wrench, tone: 'teal', showShare: false },
          { key: 'open', label: 'Dossiers ouverts', value: openInterventions, icon: Clock, tone: 'amber', showShare: false, hint: lastIntervention ? `Dernière le ${fmtDate(lastIntervention)}` : 'Aucune intervention' },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <SectionShell
          icon={Building2}
          title="Informations client"
          description="Coordonnées et identifiants"
          actions={
            isEditingClient ? null : canEditClient ? (
              <button type="button" onClick={startClientEdit} className="ui-btn-secondary ui-btn-sm shrink-0">
                <Pencil size={14} aria-hidden="true" /> Modifier
              </button>
            ) : null
          }
        >
          {clientEditError && (
            <InlineAlert tone="error" icon={AlertCircle} className="mx-5 mt-4 sm:mx-6">{clientEditError}</InlineAlert>
          )}

          {isEditingClient ? (
            <form
              onSubmit={(e) => { e.preventDefault(); saveClient() }}
              className="flex flex-col gap-4 px-5 py-5 sm:px-6"
            >
              <div className="grid grid-cols-1 gap-4">
                <ClientEditField icon={Building2} label="Nom" name="name" value={clientDraft?.name || ''} onChange={handleClientDraftChange} required />
                <ClientEditField icon={FileDigit} label="Matricule fiscal" name="taxId" value={clientDraft?.taxId || ''} onChange={handleClientDraftChange} />
                <ClientPhoneEditField value={clientDraft?.phone || PHONE_PREFIX} onChange={handleClientDraftChange} />
                <ClientEditField icon={Mail} label="Email" name="email" value={clientDraft?.email || ''} onChange={handleClientDraftChange} type="email" />
                <ClientEditField icon={Globe} label="Site web" name="web" value={clientDraft?.web || ''} onChange={handleClientDraftChange} />
                <ClientEditField icon={MapPin} label="Ville" name="city" value={clientDraft?.city || ''} onChange={handleClientDraftChange} />
                <ClientEditField icon={MapPin} label="Adresse" name="address" value={clientDraft?.address || ''} onChange={handleClientDraftChange} multiline />
              </div>
              <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={cancelClientEdit} disabled={savingClient} className="ui-btn-secondary">
                  <X size={16} aria-hidden="true" /> Annuler
                </button>
                <button type="submit" disabled={savingClient} className="ui-btn-primary">
                  {savingClient ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                  Enregistrer
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
              <InfoCard icon={Hash} label="Code client" value={client.code} mono />
              <InfoCard icon={FileDigit} label="Matricule fiscal" value={client.taxId} mono />
              <InfoCard icon={Phone} label="Téléphone" value={client.phone || client.phone2 || client.phone3} />
              <InfoCard icon={Mail} label="Email" value={client.email} />
              <InfoCard icon={Globe} label="Site web" value={client.web} />
              <InfoCard icon={MapPin} label="Adresse" value={[client.address, client.city].filter(Boolean).join(', ')} />
              <div className="grid grid-cols-2 gap-2 border-t border-line pt-4">
                <a
                  href={client.phone ? `tel:${client.phone}` : undefined}
                  aria-disabled={!client.phone}
                  className={`ui-btn-secondary ui-btn-sm ${client.phone ? '' : 'pointer-events-none opacity-50'}`}
                >
                  <Phone size={14} aria-hidden="true" /> Appeler
                </a>
                <a
                  href={client.email ? `mailto:${client.email}` : undefined}
                  aria-disabled={!client.email}
                  className={`ui-btn-secondary ui-btn-sm ${client.email ? '' : 'pointer-events-none opacity-50'}`}
                >
                  <Mail size={14} aria-hidden="true" /> Écrire
                </a>
              </div>
            </div>
          )}
        </SectionShell>

        <div className="flex min-w-0 flex-col gap-4">
          <SectionShell icon={Cpu} title="Parc équipements" description="Machines rattachées à ce client" count={machines.length}>
            {machines.length === 0 ? (
              <EmptyState icon={Cpu} title="Aucun équipement" description="Ce client ne possède pas encore de machine enregistrée." />
            ) : (
              <ul className="divide-y divide-line">
                {machines.map((m) => (
                  <MachineCard key={machineKey(m) || m.id} machine={m} />
                ))}
              </ul>
            )}
          </SectionShell>

          <SectionShell icon={Wrench} title="Suivi SAV" description="Historique des interventions, du plus récent au plus ancien" count={interventions.length}>
            {interventions.length === 0 ? (
              <EmptyState icon={Wrench} title="Aucune intervention" description="Ce client n'a pas encore d'intervention enregistrée." />
            ) : (
              <div className="px-5 py-5 sm:px-6">
                <ol>
                  {savVisible.map((i) => (
                    <InterventionCard key={i.id} intervention={i} onView={() => setSelectedIntervention(i)} />
                  ))}
                </ol>
                {totalSavPages > 1 && (
                  <nav className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4 text-sm text-ink-muted" aria-label="Pagination SAV">
                    <span>Page {safeSavPage} sur {totalSavPages}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setCurrentSavPage((p) => Math.max(1, p - 1))} disabled={safeSavPage <= 1} className="ui-btn-secondary ui-btn-sm">Précédent</button>
                      <button type="button" onClick={() => setCurrentSavPage((p) => Math.min(totalSavPages, p + 1))} disabled={safeSavPage >= totalSavPages} className="ui-btn-secondary ui-btn-sm">Suivant</button>
                    </div>
                  </nav>
                )}
              </div>
            )}
          </SectionShell>
        </div>
      </div>

      <InterventionDetailsModal
        intervention={selectedIntervention}
        clientName={client.name}
        onClose={() => setSelectedIntervention(null)}
      />
    </div>
  )
}
// ─── Modal détail intervention ─────────────────────────────────────────────

function ModalSection({ icon, title, children, accent = 'slate' }) {
  const SectionIcon = icon
  const accents = {
    slate:   'bg-slate-50 text-slate-500',
    blue:    'bg-blue-50 text-blue-600',
    violet:  'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50 text-amber-600',
    rose:    'bg-rose-50 text-rose-600',
  }
  return (
    <section className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
      <header className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg ${accents[accent]} flex items-center justify-center`}>
          <SectionIcon size={13} />
        </div>
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{title}</h3>
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

function ModalField({ icon: Icon, label, value, mono = false, isUser = false }) {
  const empty = value === null || value === undefined || value === ''
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.12em] flex items-center gap-1.5">
        {Icon && <Icon size={10} />}
        {label}
      </p>
      {empty ? (
        <p className="text-sm text-slate-300 italic mt-1">Non renseigné</p>
      ) : isUser ? (
        <div className="flex items-center gap-2 mt-1.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white flex items-center justify-center text-[11px] font-black">
            {getInitials(value)}
          </div>
          <span className="text-sm font-semibold text-slate-800 truncate">{value}</span>
        </div>
      ) : (
        <p className={`text-sm text-slate-800 mt-1 ${mono ? 'font-mono' : 'font-medium'} leading-snug whitespace-pre-wrap break-words`}>
          {value}
        </p>
      )}
    </div>
  )
}

function InterventionDetailsModal({ intervention, clientName, onClose }) {
  // Lock scroll + ESC
  useEffect(() => {
    if (!intervention) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [intervention, onClose])

  if (!intervention) return null

  const preset = getStatusPreset(intervention.status)
  const StatusIcon = preset.icon
  const machine = getInterventionMachine(intervention)

  // Pièces utilisées
  let parts = intervention.parts
  if (typeof parts === 'string') {
    try { parts = JSON.parse(parts) } catch { parts = null }
  }
  const partsList = Array.isArray(parts) ? parts : []

  // Progression : completedUpToSection sur 6 (heuristique sécurisée)
  const totalSections = 6
  const completedSections = Number(intervention.completedUpToSection) || 0
  const progressPct = Math.min(100, Math.max(0, Math.round((completedSections / totalSections) * 100)))

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-[9999] mt-0 flex h-screen min-h-screen w-screen items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in"
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', marginTop: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intervention-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative mt-0 w-full max-w-3xl max-h-[92vh] bg-slate-50 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ marginTop: 0 }}
      >
        {/* Header dégradé */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white px-5 sm:px-7 py-5 border-b border-slate-700/60">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>

          <p className="text-[10px] font-bold text-white/80 uppercase tracking-[0.18em]">
            Détail intervention SAV
          </p>
          <h2 id="intervention-modal-title" className="text-xl sm:text-2xl font-black mt-1 font-mono drop-shadow-sm pr-12">
            {intervention.id}
          </h2>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-[11px] font-bold border border-white/20 shadow-sm" style={{ color: '#0052CC' }}>
              <StatusIcon size={11} />
              {preset.label}
            </span>
            {intervention.priority && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wider">
                <AlertTriangle size={10} /> {intervention.priority}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-bold">
              <Calendar size={10} /> {fmtDate(intervention.interventionDate)}
            </span>
          </div>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
          {/* Informations principales */}
          <ModalSection icon={ClipboardList} title="Informations principales" accent="blue">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
              <ModalField icon={Hammer}    label="Type intervention" value={intervention.interventionType} />
              <ModalField icon={Building2} label="Client"             value={clientName} />
              <ModalField
                icon={Cpu}
                label="Machine liée"
                value={machine ? formatMachineDisplay(machine) : null}
              />
              <ModalField icon={Tag}       label="Marque machine"     value={machine?.brand} />
              <ModalField icon={Settings}  label="Modèle machine"     value={machine?.model} />
              <ModalField icon={Hash}      label="Numéro de série"    value={machine?.serialNumber} mono />
              <ModalField icon={UserIcon}  label="Technicien assigné" value={intervention.technicianName || intervention.assignedTo} isUser />
              <ModalField icon={Calendar}  label="Date intervention"  value={fmtDate(intervention.interventionDate)} />
              <ModalField icon={FileText}  label="Numéro de fiche"    value={intervention.ficheNumber} mono />
              <ModalField icon={Clock}     label="Heure de début"     value={intervention.startTime} />
              <ModalField icon={Clock}     label="Heure de fin"       value={intervention.endTime} />
              {intervention.totalTime && (
                <ModalField icon={Clock}   label="Durée totale"       value={intervention.totalTime} />
              )}
              {intervention.siteName && (
                <ModalField icon={MapPin}  label="Site"               value={intervention.siteName} />
              )}
              {intervention.requestorName && (
                <ModalField icon={UserIcon} label="Demandeur"         value={intervention.requestorName} />
              )}
            </div>
          </ModalSection>

          {/* Détails SAV */}
          <ModalSection icon={Stethoscope} title="Détails SAV" accent="violet">
            <div className="space-y-3">
              <ModalField icon={AlertTriangle} label="Panne / symptôme"      value={intervention.problemDescription} />
              <ModalField icon={Stethoscope}   label="Diagnostic à distance" value={intervention.telephoneDiagnostic} />
              <ModalField icon={Wrench}        label="Solution appliquée"    value={intervention.interventionDetail} />
            </div>
          </ModalSection>

          {/* Pièces utilisées */}
          {partsList.length > 0 && (
            <ModalSection icon={Package} title={`Pièces utilisées (${partsList.length})`} accent="amber">
              <ul className="divide-y divide-slate-100">
                {partsList.map((p, idx) => (
                  <li key={p.id ?? idx} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {p.designation || p.reference || 'Pièce'}
                      </p>
                      {p.reference && (
                        <p className="text-[11px] text-slate-400 font-mono truncate">{p.reference}</p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-md shrink-0">
                      × {p.quantity ?? 1}
                    </span>
                  </li>
                ))}
              </ul>
            </ModalSection>
          )}

          {/* Notes internes */}
          {intervention.numEssai != null || intervention.essaiConcluant != null ? (
            <ModalSection icon={StickyNote} title="Notes internes" accent="slate">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                <ModalField label="Numéro d’essai" value={intervention.numEssai} mono />
                <ModalField
                  label="Essai concluant"
                  value={
                    intervention.essaiConcluant === true ? 'Oui'
                    : intervention.essaiConcluant === false ? 'Non'
                    : null
                  }
                />
              </div>
            </ModalSection>
          ) : null}

          {/* Statut & progression */}
          <ModalSection icon={TrendingUp} title="Statut & progression" accent="emerald">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em]">Statut actuel</p>
                <span className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${preset.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${preset.dot}`} />
                  {preset.label}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em]">Priorité</p>
                <p className="text-sm font-semibold text-slate-800 mt-1 capitalize">
                  {intervention.priority || <span className="text-slate-300 italic font-normal">Non renseigné</span>}
                </p>
              </div>
            </div>

            {completedSections > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em]">Progression</p>
                  <span className="text-xs font-bold text-slate-700">
                    {completedSections}/{totalSections} sections — {progressPct}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </ModalSection>
        </div>

        {/* Footer actions */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
