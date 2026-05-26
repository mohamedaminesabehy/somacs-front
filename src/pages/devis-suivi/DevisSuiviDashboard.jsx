import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, BadgeCheck, CalendarDays, Filter,
  Loader2, RefreshCw, Search, ShoppingCart, UserCog, XCircle,
  ThumbsDown, TrendingUp, Flame, Zap, BarChart3,
  Activity, Target, Clock, AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  fetchDevisSuiviList, fetchDevisSuiviStats,
  markDevisPurchased, markDevisLost,
} from '../../api/devisSuiviApi'
import {
  STATUS_META, STATUS_OPTIONS_ALL,
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

function KpiCard({ label, value, sub, color = 'slate', icon: Icon, pct }) {
  const c = KPI_COLORS[color] || KPI_COLORS.slate
  return (
    <div className={"group rounded-2xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 " + c.card}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={"flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-110 " + c.icon}>
          {Icon && <Icon size={16} />}
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

function FunnelChart({ funnel }) {
  if (!funnel?.length) return <div className="py-8 text-center text-xs text-slate-400">Aucune donnée de funnel</div>
  const max = Math.max(...funnel.map(f => f.count), 1)
  return (
    <div className="space-y-3">
      {funnel.map((step, idx) => {
        const m = STATUS_META[step.status] || STATUS_META.CREATED
        const pct = Math.round((step.count / max) * 100)
        const conv = idx > 0 && funnel[idx - 1].count > 0 ? Math.round((step.count / funnel[idx - 1].count) * 100) : null
        return (
          <div key={step.status}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className={"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] " + m.tone}>
                <span className={"h-1.5 w-1.5 rounded-full " + m.dot} />{m.label}
              </span>
              <div className="flex items-center gap-3">
                {conv !== null && (
                  <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + (conv >= 70 ? 'bg-emerald-50 text-emerald-600' : conv >= 40 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600')}>
                    {conv}% conv.
                  </span>
                )}
                <span className="text-sm font-black text-slate-900 tabular-nums w-8 text-right">{step.count}</span>
              </div>
            </div>
            <div className="h-6 w-full overflow-hidden rounded-xl bg-slate-100">
              <div className={"h-full rounded-xl transition-all duration-700 bg-gradient-to-r " + m.gradient}
                style={{ width: Math.max(pct, 3) + '%' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

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

// ─── Evolution Chart ──────────────────────────────────────────────────────────

function EvolutionChart({ data }) {
  if (!data?.length) return <div className="py-8 text-center text-xs text-slate-400">Aucune donnée mensuelle</div>
  const max = Math.max(...data.map(d => d.total), 1)
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((d, i) => {
        const th = Math.max(Math.round((d.total / max) * 100), 4)
        const ph = d.total > 0 ? Math.round((d.purchased / d.total) * th) : 0
        const [, mo] = (d.month || '').split('-')
        const ml = mo ? new Date(2024, Number(mo) - 1).toLocaleString('fr-FR', { month: 'short' }) : d.month
        return (
          <div key={i} className="group relative flex flex-1 flex-col items-center gap-1">
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 hidden rounded-xl bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-white group-hover:block whitespace-nowrap z-10 shadow-lg">
              {d.month}: {d.total} devis · {d.purchased} achetés
            </div>
            <div className="relative w-full flex flex-col justify-end rounded-t-lg overflow-hidden" style={{ height: th + '%' }}>
              <div className="absolute inset-0 bg-blue-100 rounded-t-lg" />
              <div className="absolute bottom-0 w-full bg-[#0052CC] rounded-t-lg transition-all duration-700" style={{ height: ph + '%' }} />
            </div>
            <span className="text-[9px] font-bold text-slate-400 capitalize">{ml}</span>
          </div>
        )
      })}
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
  const [dateFilter, setDateFilter] = useState('')
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

  useEffect(() => {
    const t = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 350)
    return () => window.clearTimeout(t)
  }, [search])

  const loadData = useCallback(async () => {
    try {
      setLoading(true); setError('')
      const [list, ns] = await Promise.all([
        fetchDevisSuiviList({
          page, limit: pageInfo.limit, search: debouncedSearch,
          status: statusFilter === 'ALL' ? '' : statusFilter,
          commercialCode: commercialFilter === 'ALL' ? '' : commercialFilter,
          dateFrom: dateFilter || '', dateTo: dateFilter || '',
        }),
        fetchDevisSuiviStats(),
      ])
      setRows(Array.isArray(list?.data) ? list.data : [])
      setPageInfo(prev => ({
        ...prev,
        total: Number(list?.total || 0),
        totalPages: Number(list?.totalPages || 1),
        limit: Number(list?.limit || prev.limit),
      }))
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
      setError(err?.message || 'Impossible de charger le suivi commercial.')
    } finally { setLoading(false) }
  }, [page, pageInfo.limit, debouncedSearch, statusFilter, commercialFilter, dateFilter])

  useEffect(() => { loadData() }, [loadData])

  const commercialOptions = useMemo(() => {
    const codes = rows.map(r => r.commercialCode || r.commercialLabel || '').filter(Boolean)
    return Array.from(new Set(codes)).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const handleQuickAction = async () => {
    const { row, type } = confirmAction
    if (!row?.id) return
    try {
      setSaving(true)
      if (type === 'purchased') { await markDevisPurchased(row.id); showToast('success', 'Devis marqué comme acheté.') }
      else { await markDevisLost(row.id, '', refusalCode || undefined); showToast('success', 'Devis marqué comme perdu.') }
      setConfirmAction({ open: false, row: null, type: null }); setRefusalCode('')
      await loadData()
    } catch (err) { showToast('error', err?.message || 'Impossible de mettre à jour.') }
    finally { setSaving(false) }
  }

  const TABS = [
    { id: 'list', label: 'Pipeline', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'funnel', label: 'Funnel', icon: TrendingUp },
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
              <p className="text-sm text-slate-500">Pipeline complet · Funnel de conversion · Analytics temps réel</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" onClick={loadData}
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
          <div className="grid gap-3 border-t border-slate-100 p-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <KpiCard label="Total suivis"  value={stats.total}                  sub="Devis en suivi"      color="slate"   icon={BarChart3}   />
            <KpiCard label="Achetés"       value={stats.purchased}              sub="Convertis"           color="emerald" icon={BadgeCheck}  pct={stats.total > 0 ? Math.round(stats.purchased / stats.total * 100) : 0} />
            <KpiCard label="Perdus"        value={stats.refused}                sub="À analyser"          color="rose"    icon={XCircle}     />
            <KpiCard label="En attente"    value={stats.pending}                sub="Pipeline actif"      color="amber"   icon={Clock}       />
            <KpiCard label="Conversion"    value={stats.conversionRate + '%'}   sub="Achetés / total"     color="blue"    icon={Target}      pct={stats.conversionRate} />
            <KpiCard label="Hot Leads"     value={stats.hotLeads}               sub="Très intéressés"     color="orange"  icon={Flame}       />
            <KpiCard label="Relances"      value={stats.relancesToday}          sub="Aujourd'hui"         color="violet"  icon={Zap}         />
            <KpiCard label="Expirés"       value={stats.expired}                sub="Sans réponse"        color="slate"   icon={AlertCircle} />
          </div>
        </section>

        {/* ── Tabs ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setActiveTab(id)}
                className={"inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all " + (activeTab === id ? 'bg-[#0052CC] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50')}>
                <Icon size={14} /> {label}
              </button>
            ))}
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
            {/* Evolution */}
            <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Évolution mensuelle</div>
                  <h3 className="mt-0.5 text-base font-black text-slate-900">Devis par mois</h3>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-blue-100" />Total</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-[#0052CC]" />Achetés</span>
                </div>
              </div>
              <EvolutionChart data={stats.evolutionMensuelle} />
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

            {/* Status Distribution */}
            <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Répartition</div>
                <h3 className="mt-0.5 text-base font-black text-slate-900">Par statut</h3>
              </div>
              <div className="space-y-2.5">
                {[...stats.statusDistribution].sort((a, b) => b.count - a.count).map(item => {
                  const m = STATUS_META[item.status] || STATUS_META.CREATED
                  const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0
                  return (
                    <div key={item.status} className="flex items-center gap-3">
                      <span className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] shrink-0 " + m.tone}>
                        <span className={"h-1.5 w-1.5 rounded-full " + m.dot} />{m.label}
                      </span>
                      <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className={"h-full rounded-full transition-all duration-700 " + m.dot} style={{ width: pct + '%' }} />
                      </div>
                      <span className="text-xs font-black text-slate-700 shrink-0 w-7 text-right tabular-nums">{item.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Funnel Tab ── */}
        {activeTab === 'funnel' && (
          <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Conversion</div>
              <h3 className="mt-0.5 text-xl font-black text-slate-900">Funnel commercial</h3>
              <p className="mt-1 text-sm text-slate-500">Visualisez où vous perdez vos clients dans le pipeline.</p>
            </div>
            <div className="max-w-2xl"><FunnelChart funnel={stats.funnel} /></div>
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
                <div className="grid gap-3 sm:grid-cols-3 xl:flex xl:items-center">
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
                      {commercialOptions.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1) }}
                      className="w-full min-w-[170px] rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10" />
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
              <div className="overflow-x-auto">
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
