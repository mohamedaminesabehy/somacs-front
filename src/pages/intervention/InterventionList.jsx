import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import {
  Search, Plus, MoreVertical, Eye, Edit2, Trash2, Wrench,
  CheckCircle2, FileText, ChevronRight, UserPlus, Hourglass,
  UserCheck, Building2, Calendar, Settings,
  PlayCircle, LayoutGrid, LayoutList, X, TrendingUp, AlertTriangle,
  SlidersHorizontal, RefreshCw, UserCheck2, Filter, ChevronDown,
  ArrowUpRight, Clock, MapPin, MoreHorizontal, Download, Printer,
  Share2, ShieldCheck, Zap, FileSearch, Truck, GraduationCap,
  ShieldAlert, ClipboardCheck, ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react'

// ─── Configuration ────────────────────────────────────────────────────────────
const statusConfig = {
  PENDING:     { label: "En attente d'affectation", color: 'bg-amber-50 text-amber-700 border-amber-100',    dot: 'bg-amber-500',  icon: Hourglass,    bar: 'bg-amber-400'  },
  ASSIGNED:    { label: 'Affectée technicien',    color: 'bg-blue-50 text-blue-700 border-blue-100',       dot: 'bg-blue-500',   icon: UserCheck2,   bar: 'bg-blue-500'   },
  IN_PROGRESS: { label: 'En cours',                color: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-500', icon: PlayCircle,   bar: 'bg-orange-500' },
  CLOSED:      { label: 'Intervention Clôturée',   color: 'bg-green-50 text-green-700 border-green-100',   dot: 'bg-green-500',  icon: CheckCircle2, bar: 'bg-green-500'  },
}

const typeConfig = {
  DEVIS:        { label: 'Devis',        color: 'bg-[#004a77]/5 text-[#004a77] border-[#004a77]/10', icon: FileSearch     },
  LIVRAISON:    { label: 'Livraison',    color: 'bg-[#004a77]/5 text-[#004a77] border-[#004a77]/10', icon: Truck          },
  FORMATION:    { label: 'Formation',    color: 'bg-[#004a77]/5 text-[#004a77] border-[#004a77]/10', icon: GraduationCap },
  INSTALLATION: { label: 'Installation',  color: 'bg-[#004a77]/5 text-[#004a77] border-[#004a77]/10', icon: Plus           },
  REPARATION:   { label: 'Réparation',    color: 'bg-[#004a77]/5 text-[#004a77] border-[#004a77]/10', icon: Wrench         },
  GARANTIE:     { label: 'Garantie',     color: 'bg-[#004a77]/5 text-[#004a77] border-[#004a77]/10', icon: ShieldAlert    },
}

const fallbackStatus = statusConfig.PENDING
const fallbackType = typeConfig.REPARATION

function normalizeTypeKey(value) {
  const base = String(value || '').trim()
  if (!base) return ''
  return base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^0-9a-zA-Z]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const mockInterventions = [
  { id: 'INT-001', client: 'Total Energies',    machine: 'Compresseur C-12',  type: 'REPARATION',   status: 'PENDING',     date: '2025-05-01', assignee: null, priority: 'Haute' },
  { id: 'INT-002', client: 'Sonatrach',         machine: 'Turbine T-04',      type: 'GARANTIE',     status: 'ASSIGNED',    date: '2025-05-02', assignee: 'Ali Boumediene', priority: 'Critique' },
  { id: 'INT-003', client: 'Air Liquide',       machine: 'Pompe P-07',        type: 'INSTALLATION', status: 'IN_PROGRESS', date: '2025-05-03', assignee: 'Sara Meziane', priority: 'Moyenne' },
  { id: 'INT-004', client: 'Cevital',           machine: 'Moteur M-21',       type: 'FORMATION',    status: 'PENDING',     date: '2025-04-28', assignee: 'Karim Hadj', priority: 'Haute' },
  { id: 'INT-005', client: 'Naftal',            machine: 'Générateur G-03',  type: 'LIVRAISON',    status: 'CLOSED',      date: '2025-04-25', assignee: 'Sara Meziane', priority: 'Basse' },
  { id: 'INT-006', client: 'Total Energies',    machine: 'Vanne V-09',        type: 'DEVIS',        status: 'IN_PROGRESS', date: '2025-05-04', assignee: 'Yacine Ferhat', priority: 'Haute' },
  { id: 'INT-007', client: 'Sonelgaz',          machine: 'Transform. TR-02',  type: 'REPARATION',   status: 'PENDING',     date: '2025-05-05', assignee: null, priority: 'Moyenne' },
  { id: 'INT-008', client: 'Hamamet Resort',    machine: 'Climatiseur CL-15', type: 'REPARATION',   status: 'ASSIGNED',    date: '2025-05-06', assignee: 'Ali Boumediene', priority: 'Basse' },
  { id: 'INT-009', client: 'Cevital',           machine: 'Convoyeur CV-01',   type: 'DEVIS',        status: 'CLOSED',      date: '2025-04-22', assignee: 'Karim Hadj', priority: 'Moyenne' },
  { id: 'INT-010', client: 'Sonatrach',         machine: 'Robinet RB-11',     type: 'INSTALLATION', status: 'IN_PROGRESS', date: '2025-04-30', assignee: 'Yacine Ferhat', priority: 'Haute' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, count, total, icon: Icon, active, onClick, colorClass }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[200px] bg-white border-2 rounded-2xl p-5 text-left transition-all relative overflow-hidden group
        ${active ? 'border-[#0052CC] shadow-xl shadow-blue-100/50 translate-y-[-4px]' : 'border-slate-100 hover:border-slate-300 hover:shadow-lg hover:translate-y-[-2px]'}`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.05] transition-transform group-hover:scale-110 ${colorClass}`} />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-2.5 rounded-xl shadow-sm ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-600 transition-colors'}`}>
          <Icon size={20} />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
          <span className={`text-2xl font-black leading-none mt-1 transition-colors ${active ? 'text-blue-600' : 'text-slate-900'}`}>{count}</span>
        </div>
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-400 tracking-tight">{pct}% de l'activité</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${active ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>{count} / {total}</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${colorClass}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </button>
  )
}

function ActionMenu({ item, onNavigate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions dossier</p>
          </div>
          <button onClick={() => { onNavigate('details', item); setOpen(false) }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#0052CC] transition-colors">
            <Eye size={14} /> Consulter le dossier
          </button>
          <button onClick={() => { onNavigate('edit', item); setOpen(false) }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#0052CC] transition-colors">
            <Edit2 size={14} /> Modifier les infos
          </button>
          <button onClick={() => { onNavigate('assign', item); setOpen(false) }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#0052CC] transition-colors">
            <UserCheck2 size={14} /> Affecter technicien
          </button>
          <div className="border-t border-slate-50" />
          <button onClick={() => { onNavigate('delete', item); setOpen(false) }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 size={14} /> Supprimer dossier
          </button>
        </div>
      )}
    </div>
  )
}

export default function InterventionList() {
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('list')
  const [interventions, setInterventions] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '' })
  const toastTimerRef = useRef(null)
  const [highlightId, setHighlightId] = useState('')
  const highlightTimerRef = useRef(null)
  const highlightRowRef = useRef(null)
  
  // Date Filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const fetchInterventions = async () => {
    setLoading(true)
    try {
      const response = await apiFetch('/interventions', { auth: false })
      if (response.ok) {
        const data = await response.json()
        const normalized = Array.isArray(data)
          ? data.map((i) => ({
              id: i.id,
              client: i.client || i.clientName || '',
              machine: i.machine || i.machineType || '',
              type: i.type || '',
              status: i.status || 'PENDING',
              date: i.date || i.interventionDate || '',
              assignee: i.assignee || i.assignedTo || i.technicianName || null,
              priority: i.priority || 'Moyenne',
            }))
          : []
        setInterventions(normalized)
      }
    } catch (error) {
      console.error('Error fetching interventions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInterventions()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search || '')
    const highlight = params.get('highlight') || location.state?.createdInterventionId || ''
    const toastKey = params.get('toast') || ''
    if (!highlight && !toastKey) return

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current)
      highlightTimerRef.current = null
    }

    if (toastKey === 'created') {
      setToast({
        open: true,
        message:
          "Dossier d’intervention créé avec succès !\n" +
          "Statut : En attente\n" +
          "Employé assigné : Non assigné\n" +
          "Vous pouvez maintenant créer une mission pour affecter un employé à cette intervention.",
      })
      toastTimerRef.current = window.setTimeout(() => {
        setToast({ open: false, message: '' })
        toastTimerRef.current = null
      }, 3000)
    }

    if (highlight) {
      setViewMode('list')
      setHighlightId(String(highlight))
      window.setTimeout(() => {
        if (highlightRowRef.current?.scrollIntoView) {
          highlightRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 80)
      highlightTimerRef.current = window.setTimeout(() => {
        setHighlightId('')
        highlightTimerRef.current = null
      }, 1800)
    }

    if (location.search || location.state?.createdInterventionId) {
      navigate({ pathname: location.pathname, search: '' }, { replace: true, state: {} })
    }

    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current)
      highlightTimerRef.current = null
    }
  }, [location.pathname, location.search, location.state, navigate])

  const handleNavigate = (action, itemOrId) => {
    const item = typeof itemOrId === 'object' && itemOrId !== null ? itemOrId : null
    const id = item ? item.id : itemOrId

    if (action === 'details') {
      navigate(`/interventions/${id}`, {
        state: { assignedTechnicianName: item?.assignee || null }
      })
      return
    }

    if (action === 'edit') navigate(`/interventions/${id}/edit`)
    else if (action === 'assign') navigate('/missions/assign', { state: { prefillInterventionId: id } })
    else if (action === 'delete') {
      const confirmed = window.confirm(`Supprimer le dossier ${id} ?`)
      if (!confirmed) return
      ;(async () => {
        try {
          const response = await apiFetch(`/interventions/${id}`, {
            method: 'DELETE',
            auth: false,
          })
          if (response.ok) {
            fetchInterventions()
          }
        } catch (error) {
          console.error('Error deleting intervention:', error)
        }
      })()
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, typeFilter, startDate, endDate])

  const filtered = useMemo(() => {
    return interventions.filter(i => {
      const matchSearch = [i.id, i.client, i.machine].some(v => v.toLowerCase().includes(search.toLowerCase()))
      const matchStatus = statusFilter === 'ALL' || i.status === statusFilter
      const matchType   = typeFilter   === 'ALL' || i.type   === typeFilter
      
      // Date filtering logic
      let matchDate = true
      if (startDate || endDate) {
        const itemDate = new Date(i.date)
        if (startDate) {
          const start = new Date(startDate)
          if (itemDate < start) matchDate = false
        }
        if (endDate) {
          const end = new Date(endDate)
          if (itemDate > end) matchDate = false
        }
      }

      return matchSearch && matchStatus && matchType && matchDate
    })
  }, [interventions, search, statusFilter, typeFilter, startDate, endDate])

  useEffect(() => {
    if (!highlightId) return
    const idx = filtered.findIndex((i) => String(i.id) === String(highlightId))
    if (idx < 0) return
    const page = Math.floor(idx / itemsPerPage) + 1
    if (page !== currentPage) setCurrentPage(page)
  }, [filtered, highlightId, itemsPerPage, currentPage])

  const total = interventions.length
  const kpiData = Object.entries(statusConfig).map(([key, cfg]) => ({
    key, ...cfg, count: interventions.filter(i => i.status === key).length
  }))

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filtered.slice(startIndex, startIndex + itemsPerPage)
  }, [filtered, currentPage])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {toast.open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none animate-in fade-in duration-200">
          <div className="w-full max-w-xl px-4">
            <div className="bg-slate-900 text-white border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} className="text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Interventions</p>
                  <p className="text-sm font-black whitespace-pre-line leading-relaxed mt-1">{toast.message}</p>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-emerald-400 via-green-400 to-lime-300" />
            </div>
          </div>
        </div>
      )}
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
              <Wrench size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Liste des Interventions</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">{total} dossiers</span>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestion SAV</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all">
              <Download size={16} /> Export
            </button>
            <button
              onClick={fetchInterventions}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualiser
            </button>
            <button
              onClick={() => navigate('/interventions/create')}
              className="flex items-center gap-2 px-6 py-3 bg-[#0052CC] text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 hover:bg-[#0042a3] transition-all active:scale-95"
            >
              <Plus size={18} strokeWidth={3} /> Nouvelle Intervention
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full p-6 sm:p-8 space-y-8">
        
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Tout"
            count={total}
            total={total}
            icon={LayoutGrid}
            colorClass="bg-slate-400"
            active={statusFilter === 'ALL'}
            onClick={() => setStatusFilter('ALL')}
          />
          {kpiData.map(k => (
            <StatCard
              key={k.key}
              label={k.label}
              count={k.count}
              total={total}
              icon={k.icon}
              colorClass={k.bar}
              active={statusFilter === k.key}
              onClick={() => setStatusFilter(prev => prev === k.key ? 'ALL' : k.key)}
            />
          ))}
        </div>

        {/* Filters & Actions Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Rechercher par ID, client ou machine..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            
            {/* Type filter with icons */}
            <div className="relative group min-w-[180px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                {typeFilter !== 'ALL' ? (
                  React.createElement(typeConfig[typeFilter].icon, { size: 14 })
                ) : (
                  <Filter size={14} />
                )}
              </div>
              <select 
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none cursor-pointer hover:bg-white hover:border-blue-200 transition-all appearance-none"
              >
                <option value="ALL">Tous les types</option>
                {Object.entries(typeConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Date Filters Row (Now on the same line) */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={12} />
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 focus:bg-white outline-none transition-all w-36"
                />
              </div>
              <span className="text-slate-300 text-xs">à</span>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={12} />
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 focus:bg-white outline-none transition-all w-36"
                />
              </div>
            </div>

            {/* Actions / View Mode */}
            <div className="flex items-center gap-2 ml-auto">
              {(startDate || endDate || search || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); setSearch(''); setTypeFilter('ALL'); setStatusFilter('ALL'); }}
                  className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Réinitialiser"
                >
                  <RefreshCw size={18} />
                </button>
              )}
              <div className="h-8 w-px bg-slate-100 mx-2" />
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <LayoutList size={18} />
              </button>
              <button 
                onClick={() => setViewMode('kanban')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'kanban' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg shadow-slate-100/50 overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-100">
                    <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 last:border-0">ID / Machine</th>
                    <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 last:border-0">Client / Site</th>
                    <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center border-r border-slate-100 last:border-0">Statut</th>
                    <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 last:border-0">Date d'intervention</th>
                    <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 last:border-0">Technicien</th>
                    <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((item, idx) => {
                    const normalizedType = normalizeTypeKey(item.type)
                    const st = statusConfig[item.status] || fallbackStatus
                    const ty = typeConfig[normalizedType] || fallbackType
                    const TyIcon = ty.icon || Wrench
                    const isHighlighted = String(item.id) === String(highlightId)
                    return (
                      <tr
                        key={item.id}
                        ref={isHighlighted ? highlightRowRef : null}
                        className={`transition-colors group cursor-pointer ${
                          isHighlighted
                            ? 'bg-emerald-50 ring-2 ring-emerald-200 animate-pulse'
                            : `hover:bg-blue-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`
                        }`}
                        onClick={() => handleNavigate('details', item)}
                      >
                        <td className="px-6 py-4 border-r border-slate-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${ty.color}`}>
                              <TyIcon size={18} />
                            </div>
                            <div>
                              <p className="text-[13px] font-black text-slate-900 leading-none mb-1.5 group-hover:text-blue-600 transition-colors">{item.machine}</p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tight">{item.id}</span>
                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                <span className="text-[9px] font-black uppercase text-[#004a77]">{ty.label}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 border-r border-slate-50 last:border-0">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <Building2 size={14} className="text-slate-300" />
                            {item.client}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center border-r border-slate-50 last:border-0">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border-2 uppercase tracking-wider ${st.color}`}>
                            <span className={`w-2 h-2 rounded-full shadow-sm ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 border-r border-slate-50 last:border-0">
                          <div className="flex items-center gap-2 text-xs font-black text-slate-600">
                            <Calendar size={16} className="text-blue-500" />
                            {item.date}
                          </div>
                        </td>
                        <td className="px-6 py-4 border-r border-slate-50 last:border-0">
                          {item.assignee ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shadow-md shadow-blue-100">
                                {item.assignee.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="text-xs font-bold text-slate-800">{item.assignee}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-500">
                              <AlertTriangle size={12} />
                              <span className="text-[10px] font-black uppercase tracking-wider italic">Non affecté</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleNavigate('details', item) }}
                              className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#004a77] bg-[#004a77]/5 hover:bg-[#004a77] hover:text-white rounded-xl transition-all shadow-sm border border-[#004a77]/10 active:scale-95"
                            >
                              <Eye size={12} strokeWidth={3} />
                              Consulter
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleNavigate('edit', item) }}
                              className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#004a77] bg-[#004a77]/5 hover:bg-[#004a77] hover:text-white rounded-xl transition-all shadow-sm border border-[#004a77]/10 active:scale-95"
                            >
                              <Edit2 size={12} strokeWidth={3} />
                              Modifier
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleNavigate('assign', item) }}
                              className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#004a77] bg-[#004a77]/5 hover:bg-[#004a77] hover:text-white rounded-xl transition-all shadow-sm border border-[#004a77]/10 active:scale-95"
                            >
                              <UserCheck2 size={12} strokeWidth={3} />
                              Affecter
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {paginatedData.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-100">
                            <Search size={40} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-black text-slate-400">Aucune intervention trouvée</p>
                            <p className="text-sm text-slate-300 font-bold">Modifiez vos filtres ou effectuez une nouvelle recherche</p>
                          </div>
                          <button onClick={() => { setStartDate(''); setEndDate(''); setSearch(''); setTypeFilter('ALL'); setStatusFilter('ALL'); }} className="mt-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">EFFACER LES FILTRES</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {currentPage} sur {totalPages}</span>
                  <div className="h-4 w-px bg-slate-200 mx-2" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{filtered.length} résultats au total</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-200 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <ChevronLeft size={14} strokeWidth={3} /> Précédent
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="flex items-center gap-2 px-6 py-2 bg-[#0052CC] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-30 disabled:pointer-events-none transition-all group"
                  >
                    Suivant <ChevronRightIcon size={14} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar min-h-[500px]">
            {Object.entries(statusConfig).map(([statusKey, st]) => {
              const items = filtered.filter(i => i.status === statusKey)
              return (
                <div key={statusKey} className="flex-shrink-0 w-80 flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${st.dot}`} />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{st.label}</h3>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{items.length}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-3">
                    {items.map(item => {
                      const ty = typeConfig[item.type]
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => handleNavigate('details', item)}
                          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                        >
                          <div className={`absolute top-0 left-0 w-1 h-full ${st.bar}`} />
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter">{item.id}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${ty.color}`}>
                              {ty.label}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900 leading-tight mb-1.5 group-hover:text-blue-600 transition-colors">{item.machine}</h4>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                              <Building2 size={12} className="text-slate-300" />
                              {item.client}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                              <Calendar size={12} className="text-slate-300" />
                              {item.date}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                            {item.assignee ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-[8px] font-black border border-blue-100">
                                  {item.assignee.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="text-[10px] font-bold text-slate-600">{item.assignee.split(' ')[0]}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">À affecter</span>
                            )}
                            <div className="flex items-center gap-1">
                              <ActionMenu item={item} onNavigate={handleNavigate} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {items.length === 0 && (
                      <div className="h-24 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center bg-slate-50/30">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Vide</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
