import { useEffect, useMemo, useState } from 'react'
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
  ExternalLink,
  Package,
  StickyNote,
  TrendingUp,
  FileText,
} from 'lucide-react'
import { apiFetch } from '../../api/apiClient'

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

const STATUS_PRESETS = {
  COMPLETED:   { label: 'TERMINÉE',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
  TERMINEE:    { label: 'TERMINÉE',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
  IN_PROGRESS: { label: 'EN COURS',    cls: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500',    icon: PlayCircle },
  EN_COURS:    { label: 'EN COURS',    cls: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500',    icon: PlayCircle },
  ASSIGNED:    { label: 'ASSIGNED',    cls: 'bg-violet-50 text-violet-700 border-violet-200',    dot: 'bg-violet-500',  icon: ClipboardList },
  ASSIGNEE:    { label: 'ASSIGNÉE',    cls: 'bg-violet-50 text-violet-700 border-violet-200',    dot: 'bg-violet-500',  icon: ClipboardList },
  PENDING:     { label: 'EN ATTENTE',  cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500',   icon: Clock },
  EN_ATTENTE:  { label: 'EN ATTENTE',  cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500',   icon: Clock },
  CANCELLED:   { label: 'ANNULÉE',     cls: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500',     icon: XCircle },
  ANNULEE:     { label: 'ANNULÉE',     cls: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500',     icon: XCircle },
}
function getStatusPreset(status) {
  const k = String(status || '').toUpperCase().replace(/[\s-]/g, '_')
  return STATUS_PRESETS[k] || {
    label: status || '—',
    cls: 'bg-slate-50 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    icon: ClipboardList,
  }
}

function MachineStatusPill({ status }) {
  const s = String(status || '').toLowerCase()
  let cls = 'bg-slate-50 text-slate-600 border-slate-200'
  let dot = 'bg-slate-400'
  if (s.includes('disponible') || s.includes('stock')) { cls = 'bg-emerald-50 text-emerald-700 border-emerald-200'; dot = 'bg-emerald-500' }
  else if (s.includes('utilisation'))                  { cls = 'bg-blue-50 text-blue-700 border-blue-200'; dot = 'bg-blue-500' }
  else if (s.includes('maintenance'))                  { cls = 'bg-amber-50 text-amber-700 border-amber-200'; dot = 'bg-amber-500' }
  else if (s.includes('hors'))                         { cls = 'bg-red-50 text-red-700 border-red-200'; dot = 'bg-red-500' }
  else if (s.includes('archiv'))                       { cls = 'bg-slate-100 text-slate-500 border-slate-200'; dot = 'bg-slate-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-bold ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status || '—'}
    </span>
  )
}

function PriorityPill({ priority }) {
  const p = String(priority || '').toLowerCase()
  if (!p) return null
  let cls = 'bg-slate-50 text-slate-600 border-slate-200'
  if (p.includes('haut') || p.includes('urg') || p === 'high')        cls = 'bg-red-50 text-red-700 border-red-200'
  else if (p.includes('moyen') || p === 'medium')                     cls = 'bg-amber-50 text-amber-700 border-amber-200'
  else if (p.includes('bas') || p.includes('faib') || p === 'low')    cls = 'bg-emerald-50 text-emerald-700 border-emerald-200'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      <AlertTriangle size={10} /> {priority}
    </span>
  )
}

function InfoCard({ icon: Icon, label, value, mono = false, accent = 'slate' }) {
  const accents = {
    slate:   'bg-slate-50 text-slate-500',
    blue:    'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet:  'bg-violet-50 text-violet-600',
    amber:   'bg-amber-50 text-amber-600',
  }
  return (
    <div className="flex items-start gap-3 p-3.5 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
      <div className={`w-9 h-9 rounded-lg ${accents[accent]} flex items-center justify-center shrink-0`}>
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em]">{label}</p>
        <p className={`text-sm text-slate-800 truncate mt-0.5 ${mono ? 'font-mono' : 'font-semibold'}`}>
          {value || <span className="text-slate-300 italic font-normal">Non renseigné</span>}
        </p>
      </div>
    </div>
  )
}


// ─── Cards ─────────────────────────────────────────────────────────────────

function MachineCard({ machine, onView }) {
  return (
    <div
      onClick={onView}
      className="group bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-sm shrink-0">
          <Cpu size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-[#0052CC] uppercase tracking-wider font-mono">
            {machine.code || `#${machine.id}`}
          </p>
          <p className="text-sm font-black text-slate-800 truncate group-hover:text-[#0052CC] transition-colors">
            {machine.designation || '—'}
          </p>
        </div>
        <MachineStatusPill status={machine.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marque</p>
          <p className="text-slate-700 font-semibold truncate mt-0.5">
            {machine.brand || <span className="text-slate-300 italic font-normal">—</span>}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modèle</p>
          <p className="text-slate-700 font-semibold truncate mt-0.5">
            {machine.model || <span className="text-slate-300 italic font-normal">—</span>}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Numéro de série</p>
          <p className="text-slate-700 font-mono text-[12px] truncate mt-0.5">
            {machine.serialNumber || <span className="text-slate-300 italic font-sans font-normal">—</span>}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
        <button
          onClick={(e) => { e.stopPropagation(); onView() }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0052CC] hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye size={12} /> Voir détail
        </button>
      </div>
    </div>
  )
}

function InterventionCard({ intervention, onView }) {
  const preset = getStatusPreset(intervention.status)
  const Icon = preset.icon

  const fields = [
    { label: 'Panne / symptôme',        value: intervention.problemDescription },
    { label: 'Diagnostic à distance',   value: intervention.telephoneDiagnostic },
    { label: 'Solution appliquée',      value: intervention.interventionDetail },
    { label: 'Technicien',              value: intervention.technicianName || intervention.assignedTo, isUser: true },
  ]

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-100 transition-all overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between bg-gradient-to-br from-slate-50/50 to-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl ${preset.cls} border flex items-center justify-center shrink-0`}>
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">N° intervention</p>
            <p className="text-sm font-black text-slate-800 font-mono truncate">{intervention.id}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${preset.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${preset.dot}`} />
            {preset.label}
          </span>
          <PriorityPill priority={intervention.priority} />
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
            <Calendar size={11} /> {fmtDate(intervention.interventionDate)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {intervention.interventionType && (
          <div className="flex items-center gap-2">
            <Hammer size={13} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-800">{intervention.interventionType}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map((f) => {
            const empty = !f.value
            return (
              <div key={f.label} className="bg-slate-50/60 border border-slate-100 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] flex items-center gap-1.5">
                  {f.label === 'Panne / symptôme' && <AlertTriangle size={10} />}
                  {f.label === 'Diagnostic à distance' && <Stethoscope size={10} />}
                  {f.label === 'Solution appliquée' && <Wrench size={10} />}
                  {f.label === 'Technicien' && <UserIcon size={10} />}
                  {f.label}
                </p>
                {empty ? (
                  <p className="text-xs text-slate-300 italic mt-1">Non renseigné</p>
                ) : f.isUser ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white flex items-center justify-center text-[10px] font-black">
                      {getInitials(f.value)}
                    </div>
                    <span className="text-sm font-semibold text-slate-800 truncate">{f.value}</span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-700 mt-1 leading-snug line-clamp-3">{f.value}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 flex justify-end bg-slate-50/40">
        <button
          onClick={onView}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0052CC] text-white text-xs font-bold rounded-lg hover:bg-[#0047b3] transition-colors shadow-sm"
        >
          <Eye size={12} /> Voir détail intervention
        </button>
      </div>
    </div>
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

  const load = () => {
    let alive = true
    setLoading(true)
    setError(null)
    apiFetch(`/clients/${id}/360`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => alive && setData(j))
      .catch((err) => alive && setError(err))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }

  useEffect(() => load(), [id])

  const client = data?.client
  const machines = useMemo(() => data?.machines || [], [data])
  const interventions = useMemo(() => data?.interventions || [], [data])

  // ─── Loading ───
  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-[#0052CC]" />
          <p className="text-sm font-medium">Chargement de la fiche client…</p>
        </div>
      </div>
    )
  }

  // ─── Error ───
  if (error || !client) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-lg mx-auto bg-white border border-red-100 rounded-2xl p-6 text-center shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-red-50 flex items-center justify-center mb-3">
            <AlertCircle className="text-red-500" size={22} />
          </div>
          <p className="text-sm text-slate-800 font-bold">Impossible de charger ce client.</p>
          <p className="text-xs text-slate-500 mt-1">{error?.message || 'Erreur inconnue'}</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={() => navigate(-1)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg">
              Retour
            </button>
            <button onClick={load} className="px-4 py-2 text-xs font-semibold text-white bg-[#0052CC] hover:bg-[#0047b3] rounded-lg">
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0052CC] transition-colors"
        >
          <ArrowLeft size={14} /> Retour à la liste
        </button>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={12} /> Actualiser
        </button>
      </div>

      {/* Header premium */}
      <div className="relative bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-[#0052CC] via-blue-600 to-indigo-700" />
        <div className="relative px-6 sm:px-8 pt-8 pb-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="flex items-end gap-4 min-w-0">
              <div className="w-20 h-20 rounded-2xl bg-white shadow-lg ring-4 ring-white flex items-center justify-center text-[#0052CC] shrink-0">
                <Building2 size={32} strokeWidth={2.5} />
              </div>
              <div className="min-w-0 pb-1">
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-[0.18em] mb-1">
                  Fiche client 360°
                </p>
                <h1 className="text-2xl sm:text-3xl font-black text-white truncate drop-shadow-sm">
                  {client.name}
                </h1>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/95 text-slate-700 text-[11px] font-bold font-mono rounded">
                    <Hash size={10} /> {client.code}
                  </span>
                  {client.type && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold rounded">
                      <Tag size={10} /> {client.type}
                    </span>
                  )}
                  {client.zone && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold rounded">
                      <MapPin size={10} /> Zone {client.zone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-stretch gap-3 lg:pb-1">
              <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm min-w-[150px]">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center">
                  <Cpu size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Équipements</p>
                  <p className="text-lg font-black text-slate-900 leading-tight">{machines.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm min-w-[150px]">
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Wrench size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interventions</p>
                  <p className="text-lg font-black text-slate-900 leading-tight">{interventions.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick contact */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-slate-600">
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50/80 rounded-lg truncate">
              <Phone size={14} className="text-slate-400 shrink-0" />
              <span className={`truncate ${!client.phone ? 'text-slate-300 italic' : 'font-medium'}`}>
                {client.phone || 'Téléphone non renseigné'}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50/80 rounded-lg truncate">
              <Mail size={14} className="text-slate-400 shrink-0" />
              <span className={`truncate ${!client.email ? 'text-slate-300 italic' : 'font-medium'}`}>
                {client.email || 'Email non renseigné'}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50/80 rounded-lg truncate">
              <MapPin size={14} className="text-slate-400 shrink-0" />
              <span className={`truncate ${!(client.city || client.address) ? 'text-slate-300 italic' : 'font-medium'}`}>
                {[client.city, client.address].filter(Boolean).join(', ') || 'Adresse non renseignée'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Informations client */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-black text-slate-900">Informations client</h2>
            <p className="text-xs text-slate-500 mt-0.5">Coordonnées et identifiants administratifs</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <InfoCard icon={Building2}  label="Nom"               value={client.name}  accent="blue" />
          <InfoCard icon={Hash}       label="Code client"       value={client.code}  mono accent="blue" />
          <InfoCard icon={FileDigit}  label="Matricule fiscal"  value={client.taxId} mono accent="violet" />
          <InfoCard icon={Phone}      label="Téléphone"         value={client.phone || client.phone2 || client.phone3} accent="emerald" />
          <InfoCard icon={Mail}       label="Email"             value={client.email} accent="emerald" />
          <InfoCard icon={Globe}      label="Site web"          value={client.web} accent="slate" />
          <InfoCard icon={MapPin}     label="Ville"             value={client.city} accent="amber" />
          <div className="sm:col-span-2">
            <InfoCard icon={MapPin}   label="Adresse"           value={client.address} accent="amber" />
          </div>
        </div>
      </section>

      {/* Équipements du client */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Cpu size={16} className="text-[#0052CC]" /> Équipements du client
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Parc machine rattaché à ce client</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
            {machines.length}
          </span>
        </div>

        {machines.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
              <Cpu className="text-slate-300" size={20} />
            </div>
            <p className="text-sm font-bold text-slate-700">Aucun équipement</p>
            <p className="text-xs text-slate-400 mt-1">Ce client ne possède pas encore de machine enregistrée.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map((m) => (
              <MachineCard key={m.id} machine={m} onView={() => navigate(`/machines/${m.id}`)} />
            ))}
          </div>
        )}
      </section>

      {/* Suivi SAV du client */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Wrench size={16} className="text-violet-600" /> Suivi SAV du client
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Historique des interventions, par ordre chronologique</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
            {interventions.length}
          </span>
        </div>

        {interventions.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
              <Wrench className="text-slate-300" size={20} />
            </div>
            <p className="text-sm font-bold text-slate-700">Aucune intervention</p>
            <p className="text-xs text-slate-400 mt-1">Ce client n’a pas encore d’intervention enregistrée.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {interventions.map((i) => (
              <InterventionCard
                key={i.id}
                intervention={i}
                onView={() => setSelectedIntervention(i)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal détail intervention */}
      <InterventionDetailsModal
        intervention={selectedIntervention}
        clientName={client.name}
        onClose={() => setSelectedIntervention(null)}
        onOpenPage={(it) => {
          setSelectedIntervention(null)
          navigate(`/interventions/${it.id}`)
        }}
      />
    </div>
  )
}


// ─── Modal détail intervention ─────────────────────────────────────────────

function ModalSection({ icon: Icon, title, children, accent = 'slate' }) {
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
          <Icon size={13} />
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
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] flex items-center gap-1.5">
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

function InterventionDetailsModal({ intervention, clientName, onClose, onOpenPage }) {
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
  const machine = intervention.machineEntity

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intervention-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[92vh] bg-slate-50 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header dégradé */}
        <div className="relative bg-gradient-to-br from-[#0052CC] via-blue-600 to-indigo-700 text-white px-5 sm:px-7 py-5">
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
                value={
                  machine
                    ? `${machine.designation || ''}${machine.code ? ` (${machine.code})` : ''}`.trim() || null
                    : null
                }
              />
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
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-white flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Fermer
          </button>
          {onOpenPage && (
            <button
              onClick={() => onOpenPage(intervention)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0052CC] text-white text-sm font-bold rounded-lg hover:bg-[#0047b3] transition-colors shadow-sm"
            >
              <ExternalLink size={14} />
              Ouvrir la page intervention
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
