import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, BadgeCheck, CalendarDays, Filter,
  Loader2, RefreshCw, Search, ShoppingCart, UserCog, XCircle,
  ThumbsDown, Flame, Zap, BarChart3,
  Activity, Target, Clock, AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  fetchDevisSuiviList, fetchDevisSuiviStats,
  markDevisPurchased, markDevisLost,
} from '../../api/devisSuiviApi'
import {
  STATUS_META, STATUS_OPTIONS_ALL, STATUS_HEX_COLORS,
  REFUSAL_REASON_META, TERMINAL_STATUSES,
} from '../../constants/devisSuiviConstants'
import { StatusBadge } from '../../components/devis/DevisSuiviBadges'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMoney(v) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(Number(v || 0))
}

function getReminderStatus(d) {
  if (!d) return null
  const diff = Math.floor((new Date(d) - new Date()) / 86400000)
  if (diff < 0) return { label: Math.abs(diff) + 'j retard', tone: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500' }
  if (diff === 0) return { label: "Aujourd'hui", tone: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' }
  return { label: 'Dans ' + diff + 'j', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' }
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KPI_COLORS = {
  slate:   { card: 'border-slate-100 bg-white',   label: 'text-slate-400',   value: 'text-slate-900',   icon: 'bg-slate-100 text-slate-500',   bar: 'bg-slate-200' },
  emerald: { card: 'border-emerald-100 bg-white',  label: 'text-emerald-500', value: 'text-emerald-700', icon: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-400' },
  rose:    { card: 'border-rose-100 bg-white',     label: 'text-rose-500',    value: 'text-rose-700',    icon: 'bg-rose-50 text-rose-600',       bar: 'bg-rose-400' },
  amber:   { card: 'border-amber-100 bg-white',    label: 'text-amber-500',   value: 'text-amber-700',   icon: 'bg-amber-50 text-amber-600',     bar: 'bg-amber-400' },
  blue:    { card: 'border-blue-100 bg-white',     label: 'text-[#0052CC]',   value: 'text-[#0052CC]',   icon: 'bg-blue-50 text-[#0052CC]',      bar: 'bg-[#0052CC]' },
  violet:  { card: 'border-violet-100 bg-white',   label: 'text-violet-500',  value: 'text-violet-700',  icon: 'bg-violet-50 text-violet-600',   bar: 'bg-violet-400' },
  orange:  { card: 'border-orange-100 bg-white',   label: 'text-orange-500',  value: 'text-orange-700',  icon: 'bg-orange-50 text-orange-600',   bar: 'bg-orange-400' },
}

function KpiCard({ label, value, sub, color = 'slate', icon, pct }) {
  const KpiIcon = icon
  const c = KPI_COLORS[color] || KPI_COLORS.slate
  return (
    <div className={"group rounded-2xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 " + c.card}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={"flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-110 " + c.icon}>
          {KpiIcon && <KpiIcon size={16} />}
        </div>
        <div className={"text-[9px] font-black uppercase tracking-[0.3em] " + c.label}>{label}</div>
      </div>
      <div className={"text-2xl font-black tabular-nums " + c.value}>{value}</div>
      {sub && <p className="mt-1 text-[11px] font-medium text-slate-400 leading-4">{sub}</p>}
      {pct !== undefined && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div className={"h-full rounded-full transition-all duration-700 " + c.bar} style={{ width: Math.min(pct, 100) + '%' }} />
        </div>
      )}
    </div>
  )
}

// ─── Funnel Chart ─────────────────────────────────────────────────────────────

// ─── Lost Reasons Chart ───────────────────────────────────────────────────────

function LostReasonsChart({ data }) {
  if (!data?.length) return <div className="py-8 text-center text-xs text-slate-400">Aucun refus enregistré</div>
  const total = data.reduce((a, d) => a + d.count, 0)
  return (
    <div className="space-y-3">
      {data.map(item => {
        const m = REFUSAL_REASON_META[item.code] || { label: item.code, emoji: '?', color: 'text-slate-600' }
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
        return (
          <div key={item.code}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">{m.emoji} {m.label}</span>
              <span className="text-xs font-black text-slate-900 tabular-nums">{pct}% <span className="font-medium text-slate-400">({item.count})</span></span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-rose-400 transition-all duration-700" style={{ width: pct + '%' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Status Donut Chart ───────────────────────────────────────────────────────

function StatusDonutChart({ distribution }) {
  if (!distribution?.length) return <div className="py-8 text-center text-xs text-slate-400">Aucun devis avec statut attribué</div>

  const sorted = [...distribution].sort((a, b) => b.count - a.count)
  const total = sorted.reduce((acc, d) => acc + d.count, 0)

  // SVG donut
  const size = 160
  const strokeWidth = 28
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  let offset = 0

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-8">
      {/* Donut */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          {total > 0 && sorted.map((item) => {
            const pct = item.count / total
            const dash = pct * circumference
            const gap = circumference - dash
            const currentOffset = offset
            offset += dash
            const color = STATUS_HEX_COLORS[item.status] || '#94a3b8'
            return (
              <circle key={item.status} cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={color} strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-currentOffset}
                className="transition-all duration-700" />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-900 tabular-nums">{total}</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">suivis</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 min-w-0">
        <div className="mb-3 text-[10px] font-bold text-slate-400">Répartition par statut</div>
        <div className="space-y-2">
          {sorted.map(item => {
            const m = STATUS_META[item.status] || STATUS_META.CREATED
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
            const color = STATUS_HEX_COLORS[item.status] || '#94a3b8'
            return (
              <div key={item.status} className="flex items-center gap-2.5">
                <span className="h-3 w-3 shrink-0 rounded" style={{ backgroundColor: color }} />
                <span className={"text-xs font-bold text-slate-700 w-24 truncate"}>{m.label}</span>
                <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: Math.max(pct, 2) + '%', backgroundColor: color }} />
                </div>
                <span className="text-xs font-black text-slate-900 tabular-nums w-6 text-right">{item.count}</span>
                <span className="text-[10px] font-medium text-slate-400 w-8 text-right">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({ open, title, description, confirmLabel, onConfirm, onCancel, busy, danger, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={"flex h-11 w-11 items-center justify-center rounded-2xl " + (danger ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600')}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Confirmation requise</p>
              <h3 className="mt-0.5 text-base font-black text-slate-900">{title}</h3>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm font-medium leading-6 text-slate-600">{description}</p>
          {children}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={busy}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60">
            Annuler
          </button>
          <button type="button" onClick={onConfirm} disabled={busy}
            className={"inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black text-white transition-all disabled:opacity-70 " + (danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#0052CC] hover:bg-[#0747A6]')}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <BadgeCheck size={15} />}
            {busy ? 'Traitement...' : (confirmLabel || 'Confirmer')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toast }) {
  if (!toast) return null
  const isSuccess = toast.type === 'success'
  return (
    <div className={"fixed bottom-6 right-6 z-[140] flex items-start gap-3 max-w-sm rounded-2xl border px-4 py-3.5 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 " + (isSuccess ? 'border-emerald-200 bg-white' : 'border-red-200 bg-white')}>
      <div className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-xl " + (isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')}>
        {isSuccess ? <BadgeCheck size={16} /> : <AlertTriangle size={16} />}
      </div>
      <div>
        <div className={"text-[10px] font-black uppercase tracking-[0.3em] " + (isSuccess ? 'text-emerald-600' : 'text-red-600')}>{isSuccess ? 'Succès' : 'Erreur'}</div>
        <div className="mt-0.5 text-sm font-semibold text-slate-800">{toast.message}</div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DevisSuiviDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({
    purchased: 0, refused: 0, pending: 0, conversionRate: 0,
    total: 0, relancesToday: 0, urgentReminders: 0, hotLeads: 0, expired: 0,
    funnel: [], lostReasons: [], evolutionMensuelle: [], topClients: [], topCommerciaux: [], statusDistribution: [],
  })
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [commercialFilter, setCommercialFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  // Annuaire des commerciaux : accumulé au fil des pages chargées pour ne pas
  // se limiter aux seules lignes de la page courante. Persiste tant que la page vit.
  const [commercialDirectory, setCommercialDirectory] = useState([])
  const [page, setPage] = useState(1)
  const [pageInfo, setPageInfo] = useState({ total: 0, totalPages: 1, limit: 12 })
  const [toast, setToast] = useState(null)
  const [confirmAction, setConfirmAction] = useState({ open: false, row: null, type: null })
  const [refusalCode, setRefusalCode] = useState('')
  const [activeTab, setActiveTab] = useState('list')

  const showToast = useCallback((type, message) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 3500)
  }, [])

  // Refs pour annuler les requêtes en cours et éviter les états zombies
  const dataAbortRef = useRef(null)
  const statsAbortRef = useRef(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      try { dataAbortRef.current?.abort() } catch {
        // Abort cleanup is best-effort during unmount.
      }
      try { statsAbortRef.current?.abort() } catch {
        // Abort cleanup is best-effort during unmount.
      }
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 350)
    return () => window.clearTimeout(t)
  }, [search])

  const loadData = useCallback(async (externalSignal) => {
    // Annule la requête précédente pour éviter les races et empilements
    try { dataAbortRef.current?.abort() } catch {
      // Previous data request may already be closed.
    }
    const controller = new AbortController()
    dataAbortRef.current = controller
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort()
      else externalSignal.addEventListener('abort', () => controller.abort(), { once: true })
    }

    try {
      if (isMountedRef.current) { setLoading(true); setError('') }
      const list = await fetchDevisSuiviList({
        page, limit: pageInfo.limit, search: debouncedSearch,
        status: statusFilter === 'ALL' ? '' : statusFilter,
        commercialCode: commercialFilter === 'ALL' ? '' : commercialFilter,
        dateFrom: dateFrom || '', dateTo: dateTo || '',
      }, controller.signal)
      if (controller.signal.aborted || !isMountedRef.current) return
      const data = Array.isArray(list?.data) ? list.data : []
      setRows(data)
      // Accumule les commerciaux rencontrés pour alimenter le filtre globalement
      setCommercialDirectory(prev => {
        const map = new Map(prev.map(c => [c.code, c.label]))
        data.forEach(r => {
          const code = r.commercialCode || r.commercialLabel
          if (code && !map.has(code)) map.set(code, r.commercialLabel || r.commercialCode)
        })
        return Array.from(map, ([code, label]) => ({ code, label }))
          .sort((a, b) => (a.label || a.code).localeCompare(b.label || b.code))
      })
      setPageInfo(prev => ({
        ...prev,
        total: Number(list?.total || 0),
        totalPages: Number(list?.totalPages || 1),
        limit: Number(list?.limit || prev.limit),
      }))
    } catch (err) {
      if (err?.name === 'AbortError' || err?.name === 'TimeoutError') return
      if (!isMountedRef.current) return
      const msg = /timeout/i.test(err?.message || '')
        ? 'Le serveur met trop de temps à répondre. Réessayez ou affinez vos filtres.'
        : (err?.message || 'Impossible de charger le suivi commercial.')
      setError(msg)
      setRows([])
    } finally {
      // GARANTIT que le loader ne reste JAMAIS bloqué
      if (isMountedRef.current && !controller.signal.aborted) setLoading(false)
    }
  }, [page, debouncedSearch, statusFilter, commercialFilter, dateFrom, dateTo, pageInfo.limit])

  const loadStats = useCallback(async (externalSignal) => {
    try { statsAbortRef.current?.abort() } catch {
      // Previous stats request may already be closed.
    }
    const controller = new AbortController()
    statsAbortRef.current = controller
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort()
      else externalSignal.addEventListener('abort', () => controller.abort(), { once: true })
    }
    try {
      const ns = await fetchDevisSuiviStats(controller.signal)
      if (controller.signal.aborted || !isMountedRef.current) return
      setStats({
        purchased: Number(ns?.purchased || 0), refused: Number(ns?.refused || 0),
        pending: Number(ns?.pending || 0), conversionRate: Number(ns?.conversionRate || 0),
        total: Number(ns?.total || 0), relancesToday: Number(ns?.relancesToday || 0),
        urgentReminders: Number(ns?.urgentReminders || 0), hotLeads: Number(ns?.hotLeads || 0),
        expired: Number(ns?.expired || 0),
        funnel: Array.isArray(ns?.funnel) ? ns.funnel : [],
        lostReasons: Array.isArray(ns?.lostReasons) ? ns.lostReasons : [],
        evolutionMensuelle: Array.isArray(ns?.evolutionMensuelle) ? ns.evolutionMensuelle : [],
        topClients: Array.isArray(ns?.topClients) ? ns.topClients : [],
        topCommerciaux: Array.isArray(ns?.topCommerciaux) ? ns.topCommerciaux : [],
        statusDistribution: Array.isArray(ns?.statusDistribution) ? ns.statusDistribution : [],
      })
    } catch (err) {
      if (err?.name === 'AbortError' || err?.name === 'TimeoutError') return
      // stats failure is non-blocking — we just leave previous values in place
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const commercialOptions = useMemo(() => {
    // Union de l'annuaire accumulé et des commerciaux de la page courante
    const map = new Map(commercialDirectory.map(c => [c.code, c.label]))
    rows.forEach(r => {
      const code = r.commercialCode || r.commercialLabel
      if (code && !map.has(code)) map.set(code, r.commercialLabel || r.commercialCode)
    })
    return Array.from(map, ([code, label]) => ({ code, label: label || code }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [commercialDirectory, rows])

  const handleQuickAction = async () => {
    const { row, type } = confirmAction
    if (!row?.id) return
    try {
      setSaving(true)
      if (type === 'purchased') { await markDevisPurchased(row.id); showToast('success', 'Devis marqué comme acheté.') }
      else { await markDevisLost(row.id, '', refusalCode || undefined); showToast('success', 'Devis marqué comme perdu.') }
      setConfirmAction({ open: false, row: null, type: null }); setRefusalCode('')
      await Promise.all([loadData(), loadStats()])
    } catch (err) { showToast('error', err?.message || 'Impossible de mettre à jour.') }
    finally { setSaving(false) }
  }

  const TABS = [
    { id: 'list', label: 'Pipeline', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_rgba(0,82,204,0.07),_transparent_40%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5">

        {/* ── Header ── */}
        <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-5 p-6 lg:p-7 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#0052CC]">CRM Commercial</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Suivi devis</span>
                {stats.urgentReminders > 0 && (
                  <span className="animate-pulse rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-rose-700">
                    {stats.urgentReminders} urgent{stats.urgentReminders > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Dashboard Commercial</h1>
              <p className="text-sm text-slate-500">Pipeline complet · Analytics temps réel</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" onClick={() => { loadData(); loadStats() }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:shadow-sm">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualiser
              </button>
              <button type="button" onClick={() => navigate('/devis-suivi/relance')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0052CC] px-5 py-2.5 text-sm font-black text-white shadow-[0_8px_24px_rgba(0,82,204,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#0747A6]">
                <CalendarDays size={16} /> Relances du jour
                {stats.relancesToday > 0 && (
                  <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-black">{stats.relancesToday}</span>
                )}
              </button>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 border-t border-slate-100 p-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <KpiCard label="Total suivis"  value={stats.total}                  sub="Devis en suivi"      color="slate"   icon={BarChart3}   />
            <KpiCard label="Achetés"       value={stats.purchased}              sub="Convertis"           color="emerald" icon={BadgeCheck}  pct={stats.total > 0 ? Math.round(stats.purchased / stats.total * 100) : 0} />
            <KpiCard label="Perdus"        value={stats.refused}                sub="À analyser"          color="rose"    icon={XCircle}     />
            <KpiCard label="Conversion"    value={stats.conversionRate + '%'}   sub="Achetés / total"     color="blue"    icon={Target}      pct={stats.conversionRate} />
            <KpiCard label="Prospects chauds" value={stats.hotLeads}               sub="Très intéressés"     color="orange"  icon={Flame}       />
            <KpiCard label="Relances"      value={stats.relancesToday}          sub="Aujourd'hui"         color="violet"  icon={Zap}         />
            <KpiCard label="Expirés"       value={stats.expired}                sub="Sans réponse"        color="slate"   icon={AlertCircle} />
          </div>
        </section>

        {/* ── Tabs ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {TABS.map(({ id, label, icon }) => {
              const TabIcon = icon
              return (
                <button key={id} type="button" onClick={() => setActiveTab(id)}
                  className={"inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all " + (activeTab === id ? 'bg-[#0052CC] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50')}>
                  <TabIcon size={14} /> {label}
                </button>
              )
            })}
          </div>
          {activeTab === 'list' && (
            <div className="text-xs font-medium text-slate-400">
              {loading ? 'Chargement...' : <><span className="font-black text-slate-700">{pageInfo.total}</span> résultats</>}
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div><p className="text-sm font-black">Erreur de chargement</p><p className="mt-0.5 text-sm font-medium text-red-600">{error}</p></div>
          </div>
        )}

        {/* ── Analytics Tab ── */}
        {activeTab === 'analytics' && (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {/* Status Donut - Devis avec statut */}
            <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Suivi commercial</div>
                  <h3 className="mt-0.5 text-base font-black text-slate-900">Devis avec statut attribué</h3>
                </div>
              </div>
              <StatusDonutChart distribution={stats.statusDistribution} />
            </div>

            {/* Lost Reasons */}
            <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Analyse des pertes</div>
                <h3 className="mt-0.5 text-base font-black text-slate-900">Raisons de refus</h3>
              </div>
              <LostReasonsChart data={stats.lostReasons} />
            </div>

            {/* Top Commerciaux */}
            <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Performance</div>
                <h3 className="mt-0.5 text-base font-black text-slate-900">Top commerciaux</h3>
              </div>
              {stats.topCommerciaux.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">Aucune donnée</div>
              ) : (
                <div className="space-y-3">
                  {stats.topCommerciaux.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className={"flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[10px] font-black " + (i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600')}>{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="truncate text-sm font-bold text-slate-900">{c.name}</span>
                          <span className="text-xs font-black text-[#0052CC] tabular-nums">{c.rate}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-[#0052CC] transition-all duration-700" style={{ width: c.rate + '%' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Clients */}
            <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Clients</div>
                <h3 className="mt-0.5 text-base font-black text-slate-900">Top clients</h3>
              </div>
              {stats.topClients.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">Aucune donnée</div>
              ) : (
                <div className="space-y-2">
                  {stats.topClients.map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[10px] font-black text-emerald-700">{i + 1}</span>
                        <span className="truncate text-sm font-bold text-slate-900">{c.name}</span>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-700">{c.count} achetés</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── List Tab ── */}
        {activeTab === 'list' && (
          <>
            {/* Filters */}
            <section className="rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative w-full xl:max-w-[26rem]">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Rechercher client, numéro, code..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:flex xl:items-center">
                  <div className="relative">
                    <Filter className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                      className="w-full min-w-[170px] rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 appearance-none">
                      {STATUS_OPTIONS_ALL.map(s => <option key={s} value={s}>{s === 'ALL' ? 'Tous les statuts' : STATUS_META[s]?.label || s}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <UserCog className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <select value={commercialFilter} onChange={e => { setCommercialFilter(e.target.value); setPage(1) }}
                      className="w-full min-w-[170px] rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 appearance-none">
                      <option value="ALL">Tous les commerciaux</option>
                      {commercialOptions.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="date" value={dateFrom} max={dateTo || undefined}
                      onChange={e => { setDateFrom(e.target.value); setPage(1) }}
                      title="Date de début (rappel)"
                      className="w-full min-w-[150px] rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10" />
                  </div>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="date" value={dateTo} min={dateFrom || undefined}
                      onChange={e => { setDateTo(e.target.value); setPage(1) }}
                      title="Date de fin (rappel)"
                      className="w-full min-w-[150px] rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10" />
                  </div>
                </div>
              </div>
            </section>

            {/* Table */}
            <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.25em] text-slate-900">Pipeline commercial</h2>
                  <p className="mt-0.5 text-xs text-slate-400">Tableau de pilotage des devis suivis</p>
                </div>
              </div>
              {/* Mobile / tablet cards */}
              <div className="lg:hidden bg-slate-50 px-4 py-4 sm:px-6 sm:py-5">
                {loading ? (
                  <div className="space-y-4 sm:space-y-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 animate-pulse space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="h-4 w-24 rounded-lg bg-slate-100" />
                          <div className="h-5 w-20 rounded-full bg-slate-100" />
                        </div>
                        <div className="h-4 w-36 rounded-lg bg-slate-100" />
                        <div className="h-4 w-28 rounded-lg bg-slate-100" />
                      </div>
                    ))}
                  </div>
                ) : rows.length > 0 ? (
                  <div className="space-y-4 sm:space-y-5">
                    {rows.map(row => {
                      const isClosed = TERMINAL_STATUSES.includes(row.status)
                      const rs = getReminderStatus(row.reminderDate)
                      return (
                        <div
                          key={row.numeroDevis + '-' + row.typDoc}
                          onClick={() => navigate('/devis/' + row.numeroDevis)}
                          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-5 transition active:scale-[0.99] sm:hover:shadow-md cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-black text-slate-950">{row.numeroDevis}</div>
                              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{row.typDoc}</div>
                            </div>
                            <StatusBadge value={row.status} />
                          </div>

                          <div className="mt-3 space-y-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-slate-900">{row.clientLabel || row.clientCode || '-'}</div>
                              <div className="truncate text-[10px] font-medium text-slate-400">{row.clientCode || '-'}</div>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 min-w-0">
                              <UserCog size={13} className="text-slate-400 shrink-0" />
                              <span className="truncate">{row.commercialLabel || row.commercialCode || '-'}</span>
                            </div>
                          </div>

                          <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 flex items-center justify-between gap-2">
                            <span className="text-base font-black text-[#0052CC] tabular-nums">{formatMoney(row.montantDevis)}</span>
                            {rs && (
                              <span className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold " + rs.tone}>
                                <span className={"h-1.5 w-1.5 rounded-full " + rs.dot} />{rs.label}
                              </span>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <button type="button" onClick={() => navigate('/devis/' + row.numeroDevis)}
                              className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:border-blue-200 hover:text-[#0052CC] transition-all">
                              Voir <ArrowRight size={12} />
                            </button>
                            {!isClosed && (
                              <>
                                <button type="button" title="Marquer acheté" onClick={() => setConfirmAction({ open: true, row, type: 'purchased' })}
                                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all">
                                  <ShoppingCart size={15} />
                                </button>
                                <button type="button" title="Marquer perdu" onClick={() => setConfirmAction({ open: true, row, type: 'lost' })}
                                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all">
                                  <ThumbsDown size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-16">
                    <div className="mx-auto max-w-xs text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><XCircle size={24} /></div>
                      <h3 className="text-base font-black text-slate-900">Aucun résultat</h3>
                      <p className="mt-1.5 text-sm text-slate-500">Aucun devis ne correspond aux filtres actuels.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto hidden lg:block">
                <table className="w-full min-w-[1100px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      {['Num devis', 'Client', 'Commercial', 'Montant', 'Statut', 'Rappel', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {Array.from({ length: 8 }).map((__, j) => (
                            <td key={j} className="px-5 py-4">
                              <div className={"h-4 rounded-lg bg-slate-100 " + (j === 0 ? 'w-24' : j === 1 ? 'w-36' : j === 3 ? 'w-20' : 'w-16')} />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : rows.length > 0 ? rows.map(row => {
                      const isClosed = TERMINAL_STATUSES.includes(row.status)
                      const rs = getReminderStatus(row.reminderDate)
                      return (
                        <tr key={row.numeroDevis + '-' + row.typDoc}
                          className="group cursor-pointer transition-colors hover:bg-blue-50/30"
                          onClick={() => navigate('/devis/' + row.numeroDevis)}>
                          <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                            <div className="text-sm font-black text-slate-950">{row.numeroDevis}</div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{row.typDoc}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="max-w-[180px] truncate text-sm font-bold text-slate-900">{row.clientLabel || row.clientCode || '-'}</div>
                            <div className="max-w-[180px] truncate text-[10px] font-medium text-slate-400">{row.clientCode || '-'}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="max-w-[140px] truncate text-sm font-medium text-slate-700">{row.commercialLabel || row.commercialCode || '-'}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-sm font-black text-[#0052CC] tabular-nums">{formatMoney(row.montantDevis)}</div>
                          </td>
                          <td className="px-5 py-4"><StatusBadge value={row.status} /></td>
                          <td className="px-5 py-4">
                            {rs ? (
                              <span className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold " + rs.tone}>
                                <span className={"h-1.5 w-1.5 rounded-full " + rs.dot} />{rs.label}
                              </span>
                            ) : <span className="text-xs text-slate-300">—</span>}
                          </td>
                          <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              <button type="button" onClick={() => navigate('/devis/' + row.numeroDevis)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-all hover:border-blue-200 hover:text-[#0052CC]">
                                Voir <ArrowRight size={11} />
                              </button>
                              {!isClosed && (
                                <>
                                  <button type="button" title="Marquer acheté" onClick={() => setConfirmAction({ open: true, row, type: 'purchased' })}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-all hover:bg-emerald-600 hover:text-white">
                                    <ShoppingCart size={13} />
                                  </button>
                                  <button type="button" title="Marquer perdu" onClick={() => setConfirmAction({ open: true, row, type: 'lost' })}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition-all hover:bg-rose-600 hover:text-white">
                                    <ThumbsDown size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    }) : (
                      <tr><td colSpan="8" className="px-6 py-16">
                        <div className="mx-auto max-w-xs text-center">
                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><XCircle size={24} /></div>
                          <h3 className="text-base font-black text-slate-900">Aucun résultat</h3>
                          <p className="mt-1.5 text-sm text-slate-500">Aucun devis ne correspond aux filtres actuels.</p>
                        </div>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">
                  Page <span className="font-black text-slate-900">{page}</span> sur <span className="font-black text-slate-900">{pageInfo.totalPages || 1}</span>
                  <span className="ml-2 text-slate-400">· {pageInfo.total} résultats</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40">
                    <ChevronLeft size={16} />
                  </button>
                  <button type="button" onClick={() => setPage(p => Math.min(pageInfo.totalPages || 1, p + 1))} disabled={page >= (pageInfo.totalPages || 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

      </div>

      {/* ── Confirm Modal ── */}
      <ConfirmModal
        open={confirmAction.open}
        title={confirmAction.type === 'purchased' ? 'Marquer comme acheté ?' : 'Marquer comme perdu ?'}
        description={confirmAction.row ? `Le devis ${confirmAction.row.numeroDevis} sera marqué ${confirmAction.type === 'purchased' ? 'ACHETÉ' : 'PERDU'} définitivement.` : ''}
        confirmLabel={confirmAction.type === 'purchased' ? "Confirmer l'achat" : 'Confirmer la perte'}
        onConfirm={handleQuickAction}
        onCancel={() => { setConfirmAction({ open: false, row: null, type: null }); setRefusalCode('') }}
        busy={saving} danger={confirmAction.type === 'lost'}>
        {confirmAction.type === 'lost' && (
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Raison du refus</label>
            <select value={refusalCode} onChange={e => setRefusalCode(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/10">
              <option value="">Sélectionner un motif (optionnel)</option>
              {Object.entries(REFUSAL_REASON_META).map(([code, m]) => <option key={code} value={code}>{m.emoji} {m.label}</option>)}
            </select>
          </div>
        )}
      </ConfirmModal>

      <Toast toast={toast} />
    </div>
  )
}
