import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import { fetchDevisSuiviStatuses } from '../../api/devisSuiviApi'
import { STATUS_META } from '../../constants/devisSuiviConstants'
import { StatusBadge } from '../../components/devis/DevisSuiviBadges'
import { formatCurrency } from '../../utils/format'
import { formatDateTime as formatDate, todayInputDate } from '../../utils/date'
import {
  Search, Plus, Eye, Trash2, FileText,
  Calendar, RefreshCw, AlertTriangle,
  ChevronLeft, ChevronRight, BadgeCheck, XCircle, BarChart3, X,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    <div className={"group min-w-0 rounded-2xl border bg-white p-3 sm:p-4 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 overflow-hidden " + c.card}>
      <div className="flex items-start justify-between gap-1.5 mb-2 sm:mb-3">
        <div className={"flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl shrink-0 " + c.icon}>
          {Icon && <Icon size={15} />}
        </div>
        <div className={"text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-right leading-tight " + c.label}>{label}</div>
      </div>
      <div className={"text-xl sm:text-2xl font-black tabular-nums " + c.value}>{value}</div>
      {sub && <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] font-medium text-slate-400 leading-4 truncate">{sub}</p>}
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
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0, validated: 0, cancelled: 0 })
  // Map of { [numeroDevis]: crmStatus } for the current page
  const [suiviStatuses, setSuiviStatuses] = useState({})
  const navigate = useNavigate()

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null) // NUMERO du devis à supprimer
  const [deleting, setDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(null)

  // Export Excel modal state
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportStartDate, setExportStartDate] = useState('')
  const [exportEndDate, setExportEndDate] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const [exportError, setExportError] = useState('')
  const [exportSuccess, setExportSuccess] = useState('')

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

  // Tout changement de période ramène à la première page
  useEffect(() => {
    setPagination(prev => (prev.page === 1 ? prev : { ...prev, page: 1 }))
  }, [dateFrom, dateTo])

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
      if (dateFrom) query.append('dateFrom', dateFrom)
      if (dateTo) query.append('dateTo', dateTo)
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
  }, [debouncedSearch, pagination.limit, loadSuiviStatuses, dateFrom, dateTo])

  useEffect(() => {
    fetchDevis(pagination.page)
  }, [pagination.page, debouncedSearch, dateFrom, dateTo, fetchDevis])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      const response = await apiFetch(`/devis/${encodeURIComponent(deleteTarget)}`, { method: 'DELETE', auth: true })
      if (response.ok) {
        setDevis(prev => prev.filter(d => d.NUMERO !== deleteTarget))
        setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }))
        setDeleteSuccess(`Le devis ${deleteTarget} a été supprimé avec succès.`)
        setTimeout(() => setDeleteSuccess(null), 4000)
      } else {
        const data = await response.json().catch(() => ({}))
        setError(data.message || 'Erreur lors de la suppression du devis.')
      }
    } catch {
      setError('Impossible de supprimer le devis. Vérifiez votre connexion.')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
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

  // Filtre rapide : devis du jour (début = fin = aujourd'hui)
  const handleToday = () => {
    const today = todayInputDate() // yyyy-MM-dd local
    setDateFrom(today)
    setDateTo(today)
  }

  // Repli page courante (utilisé seulement si le backend ne renvoie aucun compteur).
  // Même logique métier que le backend : CRM PURCHASED = validé, sinon ETATDOC ERP ;
  // CRM REFUSED/EXPIRED = annulé, sinon IsAnnuler.
  const isValidatedDoc = (i) => {
    const crm = suiviStatuses[i?.NUMERO]
    if (crm) return crm === 'PURCHASED'
    return String(i?.ETATDOC) === '3' || String(i?.ETATDOC) === 'C'
  }
  const isCancelledDoc = (i) => {
    const crm = suiviStatuses[i?.NUMERO]
    if (crm) return crm === 'REFUSED' || crm === 'EXPIRED'
    return Boolean(i?.IsAnnuler)
  }
  const pageValidated = devis.filter(isValidatedDoc).length
  const pageCancelled = devis.filter(isCancelledDoc).length

  const stats = {
    total: pagination.total,
    shown: devis.length,
    // Priorité au compteur backend (respecte search + période sur l'ensemble des résultats).
    // Repli sur le décompte de la page seulement si le backend ne renvoie rien.
    validated: pagination.validated > 0 ? pagination.validated : pageValidated,
    cancelled: pagination.cancelled > 0 ? pagination.cancelled : pageCancelled,
  }

  const pageNumbers = (() => {
    const total = pagination.totalPages, cur = pagination.page
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
    if (cur <= 3) return [1, 2, 3, 4, 5]
    if (cur >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total]
    return [cur - 2, cur - 1, cur, cur + 1, cur + 2]
  })()

  const handleExportExcel = async () => {
    setExportError('')
    setExportSuccess('')
    if (!exportStartDate) { setExportError('La date de début est obligatoire.'); return }
    if (!exportEndDate) { setExportError('La date de fin est obligatoire.'); return }
    if (new Date(exportStartDate) > new Date(exportEndDate)) { setExportError('La date de début ne peut pas être supérieure à la date de fin.'); return }

    setExportLoading(true)
    try {
      const response = await apiFetch(`/devis/export/excel?startDate=${exportStartDate}&endDate=${exportEndDate}`, {
        auth: true,
        timeoutMs: 60000,
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        setExportError(errData.message || `Erreur serveur : ${response.status}`)
        return
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `devis_${exportStartDate}_${exportEndDate}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setExportSuccess('Fichier Excel téléchargé avec succès.')
      setTimeout(() => { setExportSuccess(''); setExportModalOpen(false) }, 2000)
    } catch (err) {
      setExportError('Impossible de télécharger le fichier. Vérifiez votre connexion.')
    } finally {
      setExportLoading(false)
    }
  }

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
              <button onClick={() => setExportModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:shadow-sm hover:bg-emerald-100">
                <FileText size={16} /> Télécharger Excel
              </button>
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4 border-t border-slate-100 p-4 sm:p-5 lg:grid-cols-4">
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
          </div>

          {/* Période */}
          <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 lg:flex-row lg:items-center lg:gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Période</span>
            <div className="flex flex-wrap items-center gap-2.5">
              <button onClick={handleToday}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:shadow-sm">
                <Calendar size={15} className="text-blue-500" /> Aujourd'hui
              </button>
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-bold text-slate-400">Début</label>
                <input type="date" value={dateFrom} max={dateTo || undefined}
                  onChange={e => setDateFrom(e.target.value)} title="Date de début"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-bold text-slate-400">Fin</label>
                <input type="date" value={dateTo} min={dateFrom || undefined}
                  onChange={e => setDateTo(e.target.value)} title="Date de fin"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
              </div>
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo('') }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-500 transition-all hover:-translate-y-0.5 hover:text-rose-600 hover:shadow-sm">
                  <X size={14} /> Réinitialiser
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Export Excel Modal ── */}
        {exportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setExportModalOpen(false); setExportError(''); setExportSuccess('') }}>
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-[#0052CC] to-blue-700 px-6 py-4">
                <h3 className="text-white font-black text-base flex items-center gap-2">
                  <FileText size={18} /> Exporter les devis en Excel
                </h3>
                <p className="text-blue-200 text-xs mt-0.5">Sélectionnez la période pour l'export</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Date début *</label>
                  <input type="date" value={exportStartDate} max={exportEndDate || undefined}
                    onChange={e => setExportStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Date fin *</label>
                  <input type="date" value={exportEndDate} min={exportStartDate || undefined}
                    onChange={e => setExportEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" />
                </div>
                {exportError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                    <AlertTriangle size={14} className="shrink-0" /> {exportError}
                  </div>
                )}
                {exportSuccess && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                    <BadgeCheck size={14} className="shrink-0" /> {exportSuccess}
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setExportModalOpen(false); setExportError(''); setExportSuccess('') }}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50">
                    Annuler
                  </button>
                  <button onClick={handleExportExcel} disabled={exportLoading}
                    className="flex-1 rounded-xl bg-[#0052CC] px-4 py-2.5 text-sm font-black text-white transition-all hover:bg-[#0747A6] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {exportLoading ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />}
                    {exportLoading ? 'Export...' : 'Télécharger'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

          {/* Mobile / tablet cards */}
          <div className="lg:hidden bg-slate-50 px-4 py-4 sm:px-6 sm:py-5">
            {loading ? (
              <div className="space-y-4 sm:space-y-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-28 rounded-lg bg-slate-100" />
                        <div className="h-3 w-20 rounded-lg bg-slate-100" />
                      </div>
                    </div>
                    <div className="mt-3 h-3 w-40 rounded-lg bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : devis.length > 0 ? (
              <div className="space-y-4 sm:space-y-5">
                {devis.map(item => (
                  <div
                    key={item.NUMERO}
                    onClick={() => navigate(`/devis/${item.NUMERO}`)}
                    className={"bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-5 transition active:scale-[0.99] sm:hover:shadow-md cursor-pointer " + (item.IsAnnuler ? 'opacity-60' : '')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + (item.IsAnnuler ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-[#0052CC]')}>
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className={"text-sm font-black " + (item.IsAnnuler ? 'text-rose-800 line-through' : 'text-slate-950')}>{item.NUMERO}</div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{item.TYPDOC || 'DE'}</div>
                        </div>
                      </div>
                      <StatusCell item={item} suiviStatuses={suiviStatuses} />
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="min-w-0">
                        <div className={"truncate text-sm font-bold " + (item.IsAnnuler ? 'text-rose-800/70' : 'text-slate-900')}>{item.NOMTIE || 'Client inconnu'}</div>
                        <div className="truncate text-[11px] font-medium text-slate-400">{item.DESTINA || item.CODTIE}</div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={13} className="text-slate-400 shrink-0" />
                        <span className="text-xs font-medium tabular-nums">{formatDate(item.DATDOC)}</span>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Montant TTC</span>
                      <span className={"text-base font-black tabular-nums " + (item.IsAnnuler ? 'text-rose-600' : 'text-[#0052CC]')}>
                        {formatCurrency(item.TOTTTCDV)}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={e => { e.stopPropagation(); navigate(`/devis/${item.NUMERO}`) }}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-blue-200 hover:text-[#0052CC] transition-all">
                        <Eye size={16} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setDeleteTarget(item.NUMERO) }}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-red-200 hover:text-red-600 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-16 text-center">
                <div className="mx-auto flex max-w-xs flex-col items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                    <FileText size={28} />
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-900">Aucun devis trouvé</p>
                    <p className="mt-1.5 text-sm text-slate-500">Aucun document ne correspond à votre recherche.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto hidden lg:block">
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
                          <button onClick={e => { e.stopPropagation(); setDeleteTarget(item.NUMERO) }}
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

      {/* Popup confirmation suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertTriangle size={28} />
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-900">Supprimer ce devis ?</h3>
              <p className="mt-2 text-sm text-slate-500">
                Êtes-vous sûr de vouloir supprimer le devis <span className="font-bold text-slate-800">{deleteTarget}</span> ?<br />
                Cette action est irréversible.
              </p>
              <div className="mt-6 flex w-full gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast succès suppression */}
      {deleteSuccess && (
        <div className="fixed bottom-6 left-1/2 z-[210] -translate-x-1/2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 shadow-lg">
          <p className="text-sm font-bold text-emerald-700">{deleteSuccess}</p>
        </div>
      )}
    </div>
  )
}

export default DevisList
