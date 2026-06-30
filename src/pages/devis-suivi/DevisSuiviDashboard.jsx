import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Flame,
  Loader2,
  RefreshCw,
  Search,
  Target,
  XCircle,
  Zap,
} from 'lucide-react'
import {
  fetchDevisSuiviList,
  fetchDevisSuiviStats,
  markDevisLost,
  markDevisPurchased,
} from '../../api/devisSuiviApi'
import {
  REFUSAL_REASON_META,
  STATUS_META,
  STATUS_OPTIONS_ALL,
  TERMINAL_STATUSES,
} from '../../constants/devisSuiviConstants'
import { StatusBadge } from '../../components/devis/DevisSuiviBadges'
import { formatDateTime } from '../../utils/date'
import { formatMoney } from '../../utils/format'

const KPI_COLORS = {
  slate: 'bg-slate-50 text-slate-700 border-slate-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
}

const emptyStats = {
  total: 0,
  purchased: 0,
  refused: 0,
  conversionRate: 0,
  hotLeads: 0,
  relancesToday: 0,
  expired: 0,
  statusDistribution: [],
  topClients: [],
  topCommerciaux: [],
}

function getReminderStatus(date) {
  if (!date) return null
  const diff = Math.floor((new Date(date) - new Date()) / 86400000)
  if (diff < 0) return { label: Math.abs(diff) + 'j retard', tone: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500' }
  if (diff === 0) return { label: "Aujourd'hui", tone: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' }
  return { label: 'Dans ' + diff + 'j', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' }
}

function KpiCard({ label, value, sub, color = 'slate', icon: Icon, pct }) {
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${KPI_COLORS[color] || KPI_COLORS.slate}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] opacity-70">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          {sub && <p className="mt-1 text-xs font-bold opacity-70">{sub}</p>}
        </div>
        {Icon && <Icon size={22} className="shrink-0 opacity-80" />}
      </div>
      {pct !== undefined && (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
          <div className="h-full rounded-full bg-current transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
        </div>
      )}
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-14 text-center">
      <Search size={24} className="mx-auto text-slate-300" />
      <p className="mt-3 text-sm font-black text-slate-500">{text}</p>
    </div>
  )
}

function DevisRowCard({ row, onView, onPurchased, onLost, saving }) {
  const reminder = getReminderStatus(row.reminderDate)
  const isClosed = TERMINAL_STATUSES.includes(row.status)

  return (
    <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-black text-slate-950">{row.numeroDevis}</p>
          <p className="mt-1 text-sm font-bold text-slate-600">{row.clientLabel || row.clientCode || 'Client non renseigné'}</p>
        </div>
        <StatusBadge value={row.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="font-black uppercase tracking-widest text-slate-400">Commercial</p>
          <p className="mt-1 font-bold text-slate-800">{row.commercialLabel || row.commercialCode || '-'}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3">
          <p className="font-black uppercase tracking-widest text-blue-400">Montant</p>
          <p className="mt-1 font-black text-[#0052CC]">{formatMoney(row.montantDevis)}</p>
        </div>
      </div>
      {reminder && (
        <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${reminder.tone}`}>
          <span className={`h-2 w-2 rounded-full ${reminder.dot}`} />
          {reminder.label}
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
        <button type="button" onClick={() => onView(row)} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Voir</button>
        {!isClosed && (
          <>
            <button type="button" disabled={saving} onClick={() => onPurchased(row)} className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-60">Acheté</button>
            <button type="button" disabled={saving} onClick={() => onLost(row)} className="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-black text-white hover:bg-rose-700 disabled:opacity-60">Perdu</button>
          </>
        )}
      </div>
    </article>
  )
}

export default function DevisSuiviDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState(emptyStats)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [commercialFilter, setCommercialFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageInfo, setPageInfo] = useState({ total: 0, totalPages: 1, limit: 12 })

  const commercialOptions = useMemo(() => {
    const values = rows
      .map((row) => row.commercialLabel || row.commercialCode)
      .filter(Boolean)
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const loadStats = useCallback(async (signal) => {
    const nextStats = await fetchDevisSuiviStats(signal)
    setStats({ ...emptyStats, ...(nextStats || {}) })
  }, [])

  const loadData = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    try {
      const payload = await fetchDevisSuiviList({
        page,
        limit: pageInfo.limit,
        search,
        status: statusFilter === 'ALL' ? '' : statusFilter,
        commercial: commercialFilter === 'ALL' ? '' : commercialFilter,
        dateFrom,
        dateTo,
      }, signal)
      setRows(Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [])
      setPageInfo({
        total: Number(payload?.total || payload?.meta?.total || 0),
        totalPages: Number(payload?.totalPages || payload?.meta?.totalPages || 1),
        limit: Number(payload?.limit || payload?.meta?.limit || pageInfo.limit),
      })
    } catch (err) {
      setError(err?.message || 'Impossible de charger les suivis devis.')
    } finally {
      setLoading(false)
    }
  }, [commercialFilter, dateFrom, dateTo, page, pageInfo.limit, search, statusFilter])

  useEffect(() => {
    const controller = new AbortController()
    loadData(controller.signal)
    return () => controller.abort()
  }, [loadData])

  useEffect(() => {
    const controller = new AbortController()
    loadStats(controller.signal)
    return () => controller.abort()
  }, [loadStats])

  const refreshAll = async () => {
    await Promise.all([loadData(), loadStats()])
  }

  const handlePurchased = async (row) => {
    if (!row?.id) return
    setSavingId(row.id)
    try {
      await markDevisPurchased(row.id)
      await refreshAll()
    } finally {
      setSavingId(null)
    }
  }

  const handleLost = async (row) => {
    if (!row?.id) return
    const reasonCode = Object.keys(REFUSAL_REASON_META)[0]
    setSavingId(row.id)
    try {
      await markDevisLost(row.id, REFUSAL_REASON_META[reasonCode]?.label || '', reasonCode)
      await refreshAll()
    } finally {
      setSavingId(null)
    }
  }

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('ALL')
    setCommercialFilter('ALL')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const kpis = [
    { label: 'Total suivis', value: stats.total, sub: 'Devis en suivi', color: 'slate', icon: BarChart3 },
    { label: 'Achetés', value: stats.purchased, sub: 'Convertis', color: 'emerald', icon: BadgeCheck, pct: stats.total > 0 ? Math.round((stats.purchased / stats.total) * 100) : 0 },
    { label: 'Perdus', value: stats.refused, sub: 'À analyser', color: 'rose', icon: XCircle },
    { label: 'Conversion', value: `${stats.conversionRate || 0}%`, sub: 'Achetés / total', color: 'blue', icon: Target, pct: stats.conversionRate || 0 },
    { label: 'Prospects chauds', value: stats.hotLeads, sub: 'Très intéressés', color: 'orange', icon: Flame },
    { label: 'Relances', value: stats.relancesToday, sub: "Aujourd'hui", color: 'violet', icon: Zap },
    { label: 'Expirés', value: stats.expired, sub: 'Sans réponse', color: 'slate', icon: AlertCircle },
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#0052CC]">CRM Devis</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Suivi commercial</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">Pilotez les devis, relances et conversions commerciales.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate('/devis-suivi/relance')} className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-amber-700 hover:bg-amber-100">
              <CalendarDays size={16} /> Relances
            </button>
            <button type="button" onClick={refreshAll} className="inline-flex items-center gap-2 rounded-2xl bg-[#0052CC] px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-[#0747A6]">
              <RefreshCw size={16} /> Actualiser
            </button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.6fr_0.6fr_auto]">
            <label className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Rechercher devis, client, commercial..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#0052CC] focus:bg-white" />
            </label>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-[#0052CC]">
              {STATUS_OPTIONS_ALL.map((status) => <option key={status} value={status}>{status === 'ALL' ? 'Tous statuts' : STATUS_META[status]?.label || status}</option>)}
            </select>
            <select value={commercialFilter} onChange={(e) => { setCommercialFilter(e.target.value); setPage(1) }} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-[#0052CC]">
              <option value="ALL">Tous commerciaux</option>
              {commercialOptions.map((commercial) => <option key={commercial} value={commercial}>{commercial}</option>)}
            </select>
            <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-[#0052CC]" />
            <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-[#0052CC]" />
            <button type="button" onClick={resetFilters} className="rounded-2xl bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200">Réinitialiser</button>
          </div>
        </section>

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">{error}</div>}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-950">Liste des suivis</h2>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">{loading ? 'Chargement...' : `${pageInfo.total || rows.length} devis`}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-16 text-slate-400">
              <Loader2 className="animate-spin" size={28} />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState text="Aucun devis en suivi pour les filtres sélectionnés." />
          ) : (
            <>
              <div className="grid gap-4 lg:hidden">
                {rows.map((row) => (
                  <DevisRowCard key={`${row.numeroDevis}-${row.typDoc}`} row={row} onView={(item) => navigate(`/devis/${item.numeroDevis}/${item.typDoc}`)} onPurchased={handlePurchased} onLost={handleLost} saving={savingId === row.id} />
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm lg:block">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <tr>
                      {['Num devis', 'Client', 'Commercial', 'Montant', 'Statut', 'Rappel', 'Actions'].map((header) => <th key={header} className="px-5 py-4">{header}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((row) => {
                      const reminder = getReminderStatus(row.reminderDate)
                      const isClosed = TERMINAL_STATUSES.includes(row.status)
                      return (
                        <tr key={`${row.numeroDevis}-${row.typDoc}`} className="hover:bg-slate-50/70">
                          <td className="px-5 py-4 font-mono text-sm font-black text-slate-900">{row.numeroDevis}</td>
                          <td className="px-5 py-4 text-sm font-bold text-slate-700">{row.clientLabel || row.clientCode || '-'}</td>
                          <td className="px-5 py-4 text-sm font-bold text-slate-500">{row.commercialLabel || row.commercialCode || '-'}</td>
                          <td className="px-5 py-4 text-sm font-black text-[#0052CC]">{formatMoney(row.montantDevis)}</td>
                          <td className="px-5 py-4"><StatusBadge value={row.status} /></td>
                          <td className="px-5 py-4">
                            {reminder ? (
                              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${reminder.tone}`}>
                                <span className={`h-2 w-2 rounded-full ${reminder.dot}`} />
                                {reminder.label}
                              </span>
                            ) : <span className="text-xs font-bold text-slate-300">-</span>}
                            {row.reminderDate && <div className="mt-1 text-[10px] font-medium text-slate-400">{formatDateTime(row.reminderDate)}</div>}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => navigate(`/devis/${row.numeroDevis}/${row.typDoc}`)} className="rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-black text-slate-600 hover:bg-slate-50">Voir</button>
                              {!isClosed && (
                                <>
                                  <button type="button" disabled={savingId === row.id} onClick={() => handlePurchased(row)} className="rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-black text-white hover:bg-emerald-700 disabled:opacity-60"><CheckCircle2 size={13} /></button>
                                  <button type="button" disabled={savingId === row.id} onClick={() => handleLost(row)} className="rounded-xl bg-rose-600 px-3 py-2 text-[10px] font-black text-white hover:bg-rose-700 disabled:opacity-60"><XCircle size={13} /></button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {pageInfo.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 disabled:opacity-40">Précédent</button>
              <span className="rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-500">Page {page} / {pageInfo.totalPages}</span>
              <button type="button" disabled={page >= pageInfo.totalPages} onClick={() => setPage((value) => Math.min(pageInfo.totalPages, value + 1))} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 disabled:opacity-40">Suivant</button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
