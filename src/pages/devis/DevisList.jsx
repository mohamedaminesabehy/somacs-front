import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import { fetchDevisSuiviStatuses } from '../../api/devisSuiviApi'
import { STATUS_META } from '../../constants/devisSuiviConstants'
import { StatusBadge } from '../../components/devis/DevisSuiviBadges'
import {
  Search, Plus, Eye, Edit2, Trash2, FileText,
  Calendar, RefreshCw, Download, AlertTriangle,
  ChevronLeft, ChevronRight, BadgeCheck, XCircle, BarChart3,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(amount || 0)
}

// ─── ERP doc state badge (Annulé / Validé / Sans statut) ─────────────────────
// Distinct from the CRM suivi status — shown only when no CRM status exists.

function DocStateBadge({ item }) {
  if (item.IsAnnuler)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-rose-700">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />Annulé
      </span>
    )
  if (item.ETATDOC === 'C' || item.ETATDOC === 3)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Validé
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />Sans statut
    </span>
  )
}

// ─── Combined status cell ─────────────────────────────────────────────────────
// Shows CRM suivi status (CREATED, HOT_LEAD…) when available,
// falls back to ERP doc state (Validé / Annulé / Sans statut).

function StatusCell({ item, suiviStatuses }) {
  const crmStatus = suiviStatuses[item.NUMERO]
  if (crmStatus) return <StatusBadge value={crmStatus} />
  return <DocStateBadge item={item} />
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KPI_COLORS = {
  slate:   { card: 'border-slate-100',   label: 'text-slate-400',   value: 'text-slate-900',   icon: 'bg-slate-100 text-slate-500' },
  emerald: { card: 'border-emerald-100', label: 'text-emerald-500', value: 'text-emerald-700', icon: 'bg-emerald-50 text-emerald-600' },
  rose:    { card: 'border-rose-100',    label: 'text-rose-500',    value: 'text-rose-700',    icon: 'bg-rose-50 text-rose-600' },
  amber:   { card: 'border-amber-100',   label: 'text-amber-500',   value: 'text-amber-700',   icon: 'bg-amber-50 text-amber-600' },
}

function KpiCard({ label, value, sub, color = 'slate', icon: Icon }) {
  const c = KPI_COLORS[color] || KPI_COLORS.slate
  return (
    <div className={"group rounded-2xl border bg-white p-4 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 " + c.card}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={"flex h-9 w-9 items-center justify-center rounded-xl " + c.icon}>
          {Icon && <Icon size={16} />}
        </div>
        <div className={"text-[9px] font-black uppercase tracking-[0.3em] " + c.label}>{label}</div>
      </div>
      <div className={"text-2xl font-black tabular-nums " + c.value}>{value}</div>
      {sub && <p className="mt-1 text-[11px] font-medium text-slate-400 leading-4">{sub}</p>}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DevisList = () => {
  const [devis, setDevis] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0, validated: 0, cancelled: 0 })
  // Map of { [numeroDevis]: crmStatus } for the current page
  const [suiviStatuses, setSuiviStatuses] = useState({})
  const navigate = useNavigate()

  // Refs pour gérer les requêtes concurrentes / annulations propres
  const fetchAbortRef = useRef(null)
  const suiviAbortRef = useRef(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // Annule toutes les requêtes en vol au démontage
      try { fetchAbortRef.current?.abort() } catch {}
      try { suiviAbortRef.current?.abort() } catch {}
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPagination(prev => ({ ...prev, page: 1 }))
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // After loading a page of devis, fetch their CRM statuses in one batch call
  const loadSuiviStatuses = useCallback(async (rows) => {
    // Annule un précédent batch encore en vol
    try { suiviAbortRef.current?.abort() } catch {}
    if (!rows?.length) {
      if (isMountedRef.current) setSuiviStatuses({})
      return
    }
    const numeros = rows.map(r => r.NUMERO).filter(Boolean)
    const controller = new AbortController()
    suiviAbortRef.current = controller
    try {
      const map = await fetchDevisSuiviStatuses(numeros, controller.signal)
      if (!isMountedRef.current || controller.signal.aborted) return
      setSuiviStatuses(map || {})
    } catch (err) {
      if (err?.name === 'AbortError') return
      // Non-blocking — fallback ERP badge
      if (isMountedRef.current) setSuiviStatuses({})
    }
  }, [])

  const fetchDevis = useCallback(async (page) => {
    // Annule la requête précédente pour éviter les races
    try { fetchAbortRef.current?.abort() } catch {}
    const controller = new AbortController()
    fetchAbortRef.current = controller

    if (isMountedRef.current) { setLoading(true); setError(null) }
    try {
      const query = new URLSearchParams({ page: String(page), limit: String(pagination.limit) })
      if (debouncedSearch) query.append('search', debouncedSearch)
      const response = await apiFetch(`/devis?${query.toString()}`, {
        auth: true,
        signal: controller.signal,
        timeoutMs: 25_000,
      })
      if (!isMountedRef.current || controller.signal.aborted) return

      if (response.ok) {
        const result = await response.json()
        if (!isMountedRef.current) return
        if (result.error) {
          setError(result.error); setDevis([])
        } else {
          setDevis(Array.isArray(result.data) ? result.data : [])
          setPagination(prev => ({
            ...prev,
            total: Number(result.total || 0),
            totalPages: Number(result.totalPages || 0),
            validated: Number(result.validated ?? 0),
            cancelled: Number(result.cancelled ?? 0),
          }))
          loadSuiviStatuses(result.data)
        }
      } else {
        const errData = await response.json().catch(() => ({}))
        if (!isMountedRef.current) return
        setError(response.status === 401
          ? (errData.message || 'Session expirée. Veuillez vous reconnecter.')
          : (errData.message || `Erreur serveur: ${response.status}`))
        setDevis([])
      }
    } catch (err) {
      if (err?.name === 'AbortError' || err?.name === 'TimeoutError') return
      if (!isMountedRef.current) return
      const msg = /timeout/i.test(err?.message || '')
        ? 'Le serveur met trop de temps à répondre. Réessayez ou affinez votre recherche.'
        : 'Impossible de joindre le serveur. Vérifiez votre connexion.'
      setError(msg)
      setDevis([])
    } finally {
      // GARANTIT que le loader ne reste JAMAIS bloqué
      if (isMountedRef.current && !controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [debouncedSearch, pagination.limit, loadSuiviStatuses])

  useEffect(() => {
    fetchDevis(pagination.page)
  }, [pagination.page, debouncedSearch, fetchDevis])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const handleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    setSortOrder(newOrder)
    setDevis(prev => [...prev].sort((a, b) => {
      const da = new Date(a.DATDOC), db = new Date(b.DATDOC)
      return newOrder === 'asc' ? da - db : db - da
    }))
  }

  const stats = {
    total: pagination.total,
    shown: devis.length,
    validated: pagination.validated ?? devis.filter(i => i.ETATDOC === 'C' || i.ETATDOC === 3).length,
    cancelled: pagination.cancelled ?? devis.filter(i => i.IsAnnuler).length,
  }

  const pageNumbers = (() => {
    const total = pagination.totalPages, cur = pagination.page
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
    if (cur <= 3) return [1, 2, 3, 4, 5]
    if (cur >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total]
    return [cur - 2, cur - 1, cur, cur + 1, cur + 2]
  })()

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_rgba(0,82,204,0.07),_transparent_40%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5">

        {/* ── Header ── */}
        <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-5 p-6 lg:p-7 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#0052CC]">Devis</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Gestion commerciale</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Gestion des devis</h1>
              <p className="text-sm text-slate-500">Consultez, filtrez et gérez vos devis · Tri, recherche et navigation rapide</p>
            </div>
            <div className="flex flex-wrap gap-2.5 self-start xl:self-auto">
              <button onClick={() => fetchDevis(pagination.page)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:shadow-sm">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualiser
              </button>
              <button onClick={() => navigate('/devis/create')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0052CC] px-5 py-2.5 text-sm font-black text-white shadow-[0_8px_24px_rgba(0,82,204,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#0747A6]">
                <Plus size={16} /> Nouveau devis
              </button>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 p-5 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Total devis"  value={stats.total}     sub="Résultats disponibles"                              color="slate"   icon={BarChart3}  />
            <KpiCard label="Affichés"     value={stats.shown}     sub={`Page ${pagination.page} / ${pagination.totalPages || 1}`} color="slate" icon={FileText} />
            <KpiCard label="Validés"      value={stats.validated} sub="Devis confirmés"                                    color="emerald" icon={BadgeCheck} />
            <KpiCard label="Annulés"      value={stats.cancelled} sub="Documents annulés"                                  color="rose"    icon={XCircle}    />
          </div>
        </section>

        {/* ── Filters ── */}
        <section className="rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Rechercher par numéro, nom ou code client..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2.5">
              <button onClick={handleSort}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:shadow-sm">
                <Calendar size={15} className="text-slate-400" />
                Date {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:shadow-sm">
                <Download size={15} className="text-slate-400" /> Export
              </button>
            </div>
          </div>
        </section>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div><p className="text-sm font-black">Une erreur est survenue</p><p className="mt-0.5 text-sm font-medium text-red-600">{error}</p></div>
          </div>
        )}

        {/* ── Table ── */}
        <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.25em] text-slate-900">Liste des devis</h2>
              <p className="mt-0.5 text-xs text-slate-400">Tableau optimisé pour la lecture rapide, le tri et la navigation</p>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 md:flex">
              {loading ? 'Synchronisation...' : 'Vue active'}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Numéro</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Type</th>
                  <th className="cursor-pointer px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 transition-colors hover:text-[#0052CC] select-none" onClick={handleSort}>
                    Date de création {sortOrder === 'asc' ? '↑' : '↓'}
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Client</th>
                  <th className="px-6 py-3.5 text-right text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Montant TTC</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">État</th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[112, 64, 128, 160, 80, 80, 80].map((w, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 rounded-lg bg-slate-100" style={{ width: w + 'px' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : devis.length > 0 ? (
                  devis.map(item => (
                    <tr key={item.NUMERO}
                      className={"group cursor-pointer transition-colors hover:bg-blue-50/30 " + (item.IsAnnuler ? 'opacity-60' : '')}
                      onClick={() => navigate(`/devis/${item.NUMERO}`)}>

                      {/* Numéro */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors " + (item.IsAnnuler ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-[#0052CC] group-hover:bg-[#0052CC] group-hover:text-white')}>
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className={"text-sm font-black " + (item.IsAnnuler ? 'text-rose-800 line-through' : 'text-slate-950')}>{item.NUMERO}</div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{item.TYPDOC || 'DE'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">
                          {item.TYPDOC}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar size={13} className="text-slate-400 shrink-0" />
                          <span className="text-sm font-medium tabular-nums">{formatDate(item.DATDOC)}</span>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <div className={"max-w-[200px] truncate text-sm font-bold " + (item.IsAnnuler ? 'text-rose-800/70' : 'text-slate-900')}>{item.NOMTIE || 'Client inconnu'}</div>
                          <div className="max-w-[200px] truncate text-[10px] font-medium text-slate-400">{item.DESTINA || item.CODTIE}</div>
                        </div>
                      </td>

                      {/* Montant */}
                      <td className="px-6 py-4 text-right">
                        <span className={"text-sm font-black tabular-nums " + (item.IsAnnuler ? 'text-rose-600' : 'text-slate-950')}>
                          {formatCurrency(item.TOTTTCDV)}
                        </span>
                      </td>

                      {/* État — CRM status si suivi existe, sinon état ERP */}
                      <td className="px-6 py-4">
                        <StatusCell item={item} suiviStatuses={suiviStatuses} />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={e => { e.stopPropagation(); navigate(`/devis/${item.NUMERO}`) }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:border-blue-200 hover:text-[#0052CC] hover:shadow-sm">
                            <Eye size={15} />
                          </button>
                          {!item.IsAnnuler && (
                            <button onClick={e => e.stopPropagation()}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:border-amber-200 hover:text-amber-600 hover:shadow-sm">
                              <Edit2 size={15} />
                            </button>
                          )}
                          <button onClick={e => e.stopPropagation()}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:border-red-200 hover:text-red-600 hover:shadow-sm">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="mx-auto flex max-w-xs flex-col items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                          <FileText size={28} />
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900">Aucun devis trouvé</p>
                          <p className="mt-1.5 text-sm text-slate-500">Aucun document ne correspond à votre recherche.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && pagination.totalPages > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                Affichage de <span className="font-black text-slate-900">{devis.length}</span> sur{' '}
                <span className="font-black text-slate-900">{pagination.total}</span> devis
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronLeft size={16} />
                </button>
                {pageNumbers.map(pageNum => (
                  <button key={pageNum} onClick={() => handlePageChange(pageNum)}
                    className={"flex h-9 min-w-9 items-center justify-center rounded-xl px-2.5 text-sm font-black transition-all " + (pagination.page === pageNum ? 'bg-[#0052CC] text-white shadow-[0_4px_12px_rgba(0,82,204,0.25)]' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>
                    {pageNum}
                  </button>
                ))}
                <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

export default DevisList
