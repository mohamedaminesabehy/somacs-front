import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, BadgeCheck, CalendarDays, Loader2,
  RefreshCw, Search, Clock, Zap, Bell, CheckCircle2,
  MessageSquare, User,
} from 'lucide-react'
import {
  fetchDevisSuiviRelancesToday,
  fetchDevisSuiviRelancesOverdue,
  updateDevisSuiviStatus,
} from '../../api/devisSuiviApi'
import { StatusBadge, PriorityBadge } from '../../components/devis/DevisSuiviBadges'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v) {
  if (!v) return '-'
  const d = v instanceof Date ? v : new Date(v)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtMoney(v) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(Number(v || 0))
}

function getOverdueInfo(reminderDate) {
  if (!reminderDate) return null
  const diff = Math.floor((new Date() - new Date(reminderDate)) / 86400000)
  if (diff <= 0) return null
  if (diff === 1) return { label: '1 jour de retard', tone: 'bg-amber-50 text-amber-700 border-amber-200', urgent: false }
  if (diff <= 3) return { label: diff + ' jours de retard', tone: 'bg-orange-50 text-orange-700 border-orange-200', urgent: false }
  return { label: diff + ' jours — critique', tone: 'bg-rose-50 text-rose-700 border-rose-200', urgent: true }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toast }) {
  if (!toast) return null
  const isSuccess = toast.type === 'success'
  return (
    <div className={"fixed bottom-6 right-6 z-[140] flex items-start gap-3 max-w-sm rounded-2xl border px-4 py-3.5 shadow-2xl " + (isSuccess ? 'border-emerald-200 bg-white' : 'border-red-200 bg-white')}>
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

// ─── Relance Card ─────────────────────────────────────────────────────────────

function RelanceCard({ row, onContacted, onView, saving }) {
  const overdue = getOverdueInfo(row.reminderDate)
  const isUrgent = row.reminderPriority === 'URGENT' || overdue?.urgent

  return (
    <article className={"flex flex-col overflow-hidden rounded-[20px] border bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 " + (isUrgent ? 'border-rose-200' : 'border-slate-200/80')}>

      {/* Card Header */}
      <div className={"flex items-start justify-between gap-3 px-5 py-4 " + (isUrgent ? 'bg-rose-50/60' : 'bg-slate-50/60')}>
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-0.5">Numéro devis</div>
          <div className="text-lg font-black text-slate-950 truncate">{row.numeroDevis}</div>
          {row.typDoc && <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{row.typDoc}</div>}
        </div>
        <div className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + (isUrgent ? 'bg-rose-100 text-rose-600' : 'bg-blue-50 text-[#0052CC]')}>
          {isUrgent ? <Zap size={18} /> : <CalendarDays size={18} />}
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 space-y-2.5 px-5 py-4">

        {/* Client */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <User size={13} />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Client</div>
            <div className="truncate text-sm font-bold text-slate-900">{row.clientLabel || row.clientCode || '-'}</div>
          </div>
        </div>

        {/* Status + Priority row */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge value={row.status} />
          <PriorityBadge value={row.reminderPriority} />
        </div>

        {/* Overdue alert */}
        {overdue && (
          <div className={"flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold " + overdue.tone}>
            <Clock size={12} className="shrink-0" /> {overdue.label}
          </div>
        )}

        {/* Rappel date */}
        <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <CalendarDays size={12} /> Rappel
          </span>
          <span className="text-xs font-black text-slate-800">{fmt(row.reminderDate)}</span>
        </div>

        {/* Montant */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-500">Montant</span>
          <span className="text-sm font-black text-[#0052CC] tabular-nums">{fmtMoney(row.montantDevis)}</span>
        </div>

        {/* Next action */}
        {row.nextAction && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2.5">
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-500 mb-1 flex items-center gap-1">
              <MessageSquare size={10} /> Prochaine action
            </div>
            <div className="text-xs font-medium leading-5 text-blue-900">{row.nextAction}</div>
          </div>
        )}

        {/* Comment */}
        {row.reminderComment && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5">
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 mb-1">Note relance</div>
            <div className="text-xs font-medium leading-5 text-amber-900">{row.reminderComment}</div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="flex gap-2.5 border-t border-slate-100 bg-white px-5 py-4">
        <button type="button" onClick={onView}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50">
          Voir devis <ArrowRight size={14} />
        </button>
        <button type="button" onClick={onContacted} disabled={saving}
          className={"inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-black text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 " + (isUrgent ? 'bg-rose-600 hover:bg-rose-700 shadow-[0_4px_12px_rgba(225,29,72,0.25)]' : 'bg-[#0052CC] hover:bg-[#0747A6] shadow-[0_4px_12px_rgba(0,82,204,0.2)]')}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
          Contacté
        </button>
      </div>
    </article>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DevisSuiviRelance() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [rows, setRows] = useState([])
  const [overdueRows, setOverdueRows] = useState([])
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('today')
  const [toast, setToast] = useState(null)

  const showToast = useCallback((type, message) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  const load = useCallback(async (signal) => {
    try {
      setLoading(true); setError('')
      const [today, overdue] = await Promise.all([
        fetchDevisSuiviRelancesToday(signal),
        fetchDevisSuiviRelancesOverdue(signal),
      ])
      if (signal?.aborted) return
      setRows(Array.isArray(today) ? today : [])
      setOverdueRows(Array.isArray(overdue) ? overdue : [])
    } catch (e) {
      if (e?.name === 'AbortError') return
      setError(e?.message || 'Impossible de charger les relances.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const activeRows = tab === 'today' ? rows : overdueRows

  const filtered = activeRows.filter(row => {
    if (!search.trim()) return true
    return [row.numeroDevis, row.clientLabel, row.clientCode, row.commercialCode, row.nextAction]
      .filter(Boolean).join(' ').toLowerCase().includes(search.trim().toLowerCase())
  })

  const handleContacted = async (row) => {
    const key = row.numeroDevis + '-' + row.typDoc
    try {
      setSavingId(key)
      await updateDevisSuiviStatus({ numeroDevis: row.numeroDevis, typDoc: row.typDoc, status: 'CONTACTED' })
      setRows(prev => prev.filter(r => !(r.numeroDevis === row.numeroDevis && r.typDoc === row.typDoc)))
      setOverdueRows(prev => prev.filter(r => !(r.numeroDevis === row.numeroDevis && r.typDoc === row.typDoc)))
      showToast('success', `Devis ${row.numeroDevis} marqué comme contacté.`)
    } catch (e) {
      showToast('error', e?.message || 'Impossible de mettre à jour.')
    } finally { setSavingId(null) }
  }

  const urgentCount = [...rows, ...overdueRows].filter(r => r.reminderPriority === 'URGENT').length

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_rgba(0,82,204,0.07),_transparent_40%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">

        {/* ── Header ── */}
        <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-5 p-6 lg:p-7 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#0052CC]">Relances</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Priorités commerciales</span>
                {urgentCount > 0 && (
                  <span className="animate-pulse rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-rose-700">
                    {urgentCount} urgent{urgentCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Relances à traiter</h1>
              <p className="text-sm text-slate-500">Clients à rappeler aujourd'hui · Relances en retard</p>
            </div>
            <button type="button" onClick={() => load()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:shadow-sm self-start xl:self-auto">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualiser
            </button>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-3 gap-3 border-t border-slate-100 p-5">
            <div className="rounded-2xl border border-blue-100 bg-white p-4 transition-all hover:shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0052CC]"><Bell size={16} /></div>
                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#0052CC]">Aujourd'hui</div>
              </div>
              <div className="text-2xl font-black text-[#0052CC] tabular-nums">{rows.length}</div>
              <p className="mt-1 text-[11px] font-medium text-slate-400">À contacter</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-4 transition-all hover:shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Clock size={16} /></div>
                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-600">En retard</div>
              </div>
              <div className="text-2xl font-black text-amber-700 tabular-nums">{overdueRows.length}</div>
              <p className="mt-1 text-[11px] font-medium text-slate-400">Relances dépassées</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-white p-4 transition-all hover:shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Zap size={16} /></div>
                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-600">Urgents</div>
              </div>
              <div className="text-2xl font-black text-rose-700 tabular-nums">{urgentCount}</div>
              <p className="mt-1 text-[11px] font-medium text-slate-400">Priorité haute</p>
            </div>
          </div>
        </section>

        {/* ── Tabs + Search ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
            <button type="button" onClick={() => setTab('today')}
              className={"inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all " + (tab === 'today' ? 'bg-[#0052CC] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50')}>
              <Bell size={14} /> Aujourd'hui
              {rows.length > 0 && (
                <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-black " + (tab === 'today' ? 'bg-white/25' : 'bg-blue-100 text-blue-700')}>{rows.length}</span>
              )}
            </button>
            <button type="button" onClick={() => setTab('overdue')}
              className={"inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all " + (tab === 'overdue' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50')}>
              <Clock size={14} /> En retard
              {overdueRows.length > 0 && (
                <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-black " + (tab === 'overdue' ? 'bg-white/25' : 'bg-amber-100 text-amber-700')}>{overdueRows.length}</span>
              )}
            </button>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10" />
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div><p className="text-sm font-black">Erreur</p><p className="mt-0.5 text-sm font-medium text-red-600">{error}</p></div>
          </div>
        )}

        {/* ── Cards Section ── */}
        <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.25em] text-slate-900">
                {tab === 'today' ? "Clients à rappeler aujourd'hui" : 'Relances en retard'}
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {tab === 'today' ? "Rappels positionnés sur aujourd'hui." : 'Relances dont la date est dépassée.'}
              </p>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 md:flex">
              {loading ? 'Chargement...' : filtered.length + ' relance' + (filtered.length > 1 ? 's' : '')}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-[20px] border border-slate-100 bg-slate-50 p-5 space-y-3">
                  <div className="h-5 w-32 rounded-lg bg-slate-200" />
                  <div className="h-4 w-full rounded-lg bg-slate-100" />
                  <div className="h-4 w-3/4 rounded-lg bg-slate-100" />
                  <div className="h-10 rounded-xl bg-slate-200 mt-4" />
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map(row => (
                <RelanceCard
                  key={row.numeroDevis + '-' + row.typDoc}
                  row={row}
                  saving={savingId === row.numeroDevis + '-' + row.typDoc}
                  onView={() => navigate('/devis/' + row.numeroDevis)}
                  onContacted={() => handleContacted(row)}
                />
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                <CheckCircle2 size={26} />
              </div>
              <h3 className="text-base font-black text-slate-900">
                {tab === 'today' ? 'Aucune relance aujourd\'hui' : 'Aucune relance en retard'}
              </h3>
              <p className="mt-1.5 text-sm text-slate-500">
                {tab === 'today' ? 'Tous les rappels du jour ont été traités.' : 'Toutes les relances sont à jour.'}
              </p>
            </div>
          )}
        </section>

      </div>

      <Toast toast={toast} />
    </div>
  )
}
