import React, { useState, useMemo, useEffect } from 'react'
import { 
  CalendarRange,
  Search, 
  Filter, 
  Wrench, 
  Clock,
  ArrowRight,
  User,
  ShieldCheck,
  Sparkles,
  X,
  Activity,
} from 'lucide-react'
import { apiFetch } from '../../api/apiClient'

const severityBadgeMap = {
  Critical: 'bg-rose-50 text-rose-700 border-rose-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const statusBadgeMap = {
  'RÉCURRENT': 'bg-rose-100 text-rose-700 border-rose-200',
  'SOUS SURVEILLANCE': 'bg-blue-100 text-blue-700 border-blue-200',
  'RÉSOLU': 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

function toFrDate(value) {
  if (!value) return 'N/A'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function truncate(value, max = 96) {
  const text = String(value || '').trim()
  if (!text) return 'N/A'
  if (text.length <= max) return text
  return `${text.slice(0, max)}...`
}

function getRecommendation(item) {
  if (!item) return 'Surveiller l\'equipement et mettre a jour l\'historique apres intervention.'
  if (item.severity === 'Critical' || item.frequency > 4) {
    return 'Planifier une action corrective immediate et un controle complet sous 24h.'
  }
  if (item.severity === 'High' || item.frequency > 2) {
    return 'Prevoir une intervention preventive renforcee et verifier les causes racines.'
  }
  return 'Maintenir le plan de maintenance standard et suivre l\'evolution sur 30 jours.'
}

export default function InterventionHistory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [interventions, setInterventions] = useState([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const response = await apiFetch('/interventions', { auth: true })
        if (!response.ok) return
        const data = await response.json()
        setInterventions(Array.isArray(data) ? data : [])
      } catch {}
    })()
  }, [])

  const historyRows = useMemo(() => {
    const byKey = new Map()
    for (const i of interventions) {
      const machine = i.machineType || i.machine || ''
      const serial = i.serialNumber || ''
      const key = `${machine}__${serial}`.trim()
      const existing = byKey.get(key)
      const dateStr = i.interventionDate || i.date || ''
      const dateValue = dateStr ? new Date(dateStr) : null
      const record = {
        id: i.id,
        machine,
        serial,
        client: i.clientName || i.client || '',
        lastFailure: i.problemDescription || i.request || '',
        phoneDiagnostic: i.telephoneDiagnostic || '',
        interventionSolution: i.interventionDetail || '',
        technician: i.technicianName || i.assignee || i.assignedTo || '',
        interventionType: i.interventionType || i.type || 'N/A',
        date: dateStr ? String(dateStr) : '',
        dateValue,
        status: i.status || 'PENDING',
        priority: i.priority || '',
      }

      if (!existing) {
        byKey.set(key, { latest: record, count: 1 })
        continue
      }

      existing.count += 1
      if (!existing.latest.dateValue || (dateValue && dateValue > existing.latest.dateValue)) {
        existing.latest = record
      }
    }

    const rows = Array.from(byKey.values()).map(({ latest, count }) => {
      const frequency = count
      const statusLabel =
        frequency > 3 ? 'RÉCURRENT' : latest.status === 'CLOSED' ? 'RÉSOLU' : 'SOUS SURVEILLANCE'
      const severity =
        latest.priority === 'Critique'
          ? 'Critical'
          : latest.priority === 'Haute'
            ? 'High'
            : latest.priority === 'Moyenne'
              ? 'Medium'
              : 'Low'

      return {
        id: latest.id,
        machine: latest.machine,
        serial: latest.serial,
        client: latest.client,
        lastFailure: latest.lastFailure,
        phoneDiagnostic: latest.phoneDiagnostic,
        interventionSolution: latest.interventionSolution,
        technician: latest.technician,
        interventionType: latest.interventionType,
        date: latest.date,
        dateValue: latest.dateValue,
        frequency,
        status: statusLabel,
        severity,
      }
    })

    return rows
  }, [interventions])

  const filteredHistory = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return historyRows.filter(item => 
      (
        item.machine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lastFailure.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.technician.toLowerCase().includes(searchTerm.toLowerCase())
      ) &&
      (statusFilter === 'ALL' || item.status === statusFilter) &&
      (severityFilter === 'ALL' || item.severity === severityFilter) &&
      (
        dateFilter === 'ALL' ||
        (dateFilter === 'THIS_MONTH' && item.dateValue && item.dateValue >= startOfMonth) ||
        (dateFilter === 'THIS_WEEK' && item.dateValue && item.dateValue >= startOfWeek)
      )
    )
  }, [historyRows, searchTerm, statusFilter, severityFilter, dateFilter])

  const recurringCount = historyRows.filter((h) => h.frequency > 3).length
  const now = new Date()
  const monthCount = interventions.filter((i) => {
    const d = i.interventionDate || i.date
    if (!d) return false
    const dt = new Date(d)
    return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth()
  }).length
  const closedCount = interventions.filter((i) => i.status === 'CLOSED').length
  const resolutionRate = interventions.length
    ? Math.round((closedCount / interventions.length) * 100)
    : 0

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    statusFilter !== 'ALL' ||
    severityFilter !== 'ALL' ||
    dateFilter !== 'ALL'

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setSeverityFilter('ALL')
    setDateFilter('ALL')
  }

  useEffect(() => {
    if (!selectedItem) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedItem(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedItem])

  const openDetails = (item) => setSelectedItem(item)
  const closeDetails = () => setSelectedItem(null)

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-slate-100/80 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px] space-y-6 lg:space-y-8">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative px-5 py-6 sm:px-7 sm:py-7">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_-20%,rgba(59,130,246,0.12),transparent_50%),radial-gradient(circle_at_10%_120%,rgba(14,165,233,0.08),transparent_45%)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-blue-700">
                  <Sparkles size={12} /> Vue analytique
                </span>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    Historique des Pannes et Recurrences
                  </h1>
                  <p className="mt-1 text-sm font-medium text-slate-500 sm:text-[15px]">
                    Suivez les incidents par equipement, identifiez les recurrences et priorisez les actions terrain.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
                <div className="rounded-2xl border border-slate-200 bg-white/95 px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pannes recurrentes</p>
                  <p className="mt-1 text-2xl font-black text-rose-600">{recurringCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/95 px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Interventions mois</p>
                  <p className="mt-1 text-2xl font-black text-blue-700">{monthCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/95 px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Taux resolution</p>
                  <p className="mt-1 text-2xl font-black text-emerald-700">{resolutionRate}%</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/95 px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Lignes affichees</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{filteredHistory.length}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="relative lg:col-span-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher machine, serie, client, panne, technicien..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative lg:col-span-2">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              >
                <option value="ALL">Tous statuts</option>
                <option value="RÉCURRENT">Recurrent</option>
                <option value="SOUS SURVEILLANCE">Sous surveillance</option>
                <option value="RÉSOLU">Resolue</option>
              </select>
            </div>

            <div className="relative lg:col-span-2">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              >
                <option value="ALL">Toutes priorites</option>
                <option value="Critical">Critique</option>
                <option value="High">Haute</option>
                <option value="Medium">Moyenne</option>
                <option value="Low">Faible</option>
              </select>
            </div>

            <div className="relative lg:col-span-2">
              <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              >
                <option value="ALL">Toutes dates</option>
                <option value="THIS_WEEK">Cette semaine</option>
                <option value="THIS_MONTH">Ce mois</option>
              </select>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 lg:col-span-1"
            >
              <X size={14} />
              Reset
            </button>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Activity size={14} className="text-blue-600" />
              Filtres actifs appliques sur l'historique.
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Equipement</th>
                    <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Client</th>
                    <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Type intervention</th>
                    <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Date</th>
                    <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Type panne</th>
                    <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Diagnostic telephonique</th>
                    <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Solution intervention</th>
                    <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Technicien</th>
                    <th className="px-5 py-4 text-center text-[11px] font-black uppercase tracking-wider text-slate-500">Freq.</th>
                    <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Statut</th>
                    <th className="px-5 py-4 text-right text-[11px] font-black uppercase tracking-wider text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="group border-b border-slate-100 last:border-b-0 hover:bg-blue-50/40">
                      <td className="px-5 py-4 align-top">
                        <p className="text-sm font-black text-slate-900">{item.machine || 'N/A'}</p>
                        <p className="mt-1 text-xs font-mono text-slate-500">{item.serial || 'N/A'}</p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="text-sm font-semibold text-slate-700">{item.client || 'N/A'}</p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
                          {item.interventionType || 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                          <Clock size={12} /> {toFrDate(item.date)}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="text-sm font-semibold text-slate-700">{truncate(item.lastFailure, 60)}</p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="text-sm text-slate-600">{truncate(item.phoneDiagnostic, 70)}</p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="text-sm text-slate-600">{truncate(item.interventionSolution, 70)}</p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                          <User size={12} />
                          {item.technician || 'N/A'}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center align-top">
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                          item.frequency > 3 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.frequency}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-2">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                            statusBadgeMap[item.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {item.status}
                          </span>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                            severityBadgeMap[item.severity] || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {item.severity}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right align-top">
                        <button
                          type="button"
                          onClick={() => openDetails(item)}
                          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-black text-blue-700 transition group-hover:bg-blue-100"
                        >
                          Details <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {filteredHistory.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-black text-slate-900">{item.machine || 'N/A'}</p>
                    <p className="text-xs font-mono text-slate-500">{item.serial || 'N/A'}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                    statusBadgeMap[item.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-slate-50 px-2.5 py-2">
                    <p className="font-black uppercase tracking-wider text-slate-400">Client</p>
                    <p className="mt-1 font-semibold text-slate-700">{item.client || 'N/A'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-2.5 py-2">
                    <p className="font-black uppercase tracking-wider text-slate-400">Date</p>
                    <p className="mt-1 font-semibold text-slate-700">{toFrDate(item.date)}</p>
                  </div>
                  <div className="col-span-2 rounded-xl bg-slate-50 px-2.5 py-2">
                    <p className="font-black uppercase tracking-wider text-slate-400">Type intervention</p>
                    <p className="mt-1 font-semibold text-slate-700">{item.interventionType || 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    <span className="font-black text-slate-500">Type de panne: </span>{truncate(item.lastFailure, 100)}
                  </p>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    <span className="font-black text-slate-500">Diagnostic: </span>{truncate(item.phoneDiagnostic, 100)}
                  </p>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    <span className="font-black text-slate-500">Solution: </span>{truncate(item.interventionSolution, 100)}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <User size={12} /> {item.technician || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                      severityBadgeMap[item.severity] || 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {item.severity}
                    </span>
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                      item.frequency > 3 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.frequency}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openDetails(item)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-black text-blue-700 transition hover:bg-blue-100"
                >
                  Voir details <ArrowRight size={14} />
                </button>
              </article>
            ))}
          </div>

          {filteredHistory.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Wrench size={20} />
              </div>
              <p className="text-base font-black text-slate-700">Aucun resultat</p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Ajustez vos filtres pour afficher des interventions.
              </p>
            </div>
          )}
        </section>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-[120]">
          <button
            type="button"
            aria-label="Fermer la fenetre details"
            onClick={closeDetails}
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
          />

          <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
            <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-5 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-blue-600">Dossier intervention</p>
                    <h3 className="mt-1 text-xl font-black text-slate-900">{selectedItem.machine || 'N/A'}</h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">Serie: {selectedItem.serial || 'N/A'} | Client: {selectedItem.client || 'N/A'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeDetails}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="max-h-[75vh] overflow-y-auto px-5 py-5 sm:px-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Date</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{toFrDate(selectedItem.date)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Type intervention</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{selectedItem.interventionType || 'N/A'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Technicien</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{selectedItem.technician || 'N/A'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Frequence</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{selectedItem.frequency} occurrences</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                    statusBadgeMap[selectedItem.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {selectedItem.status}
                  </span>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                    severityBadgeMap[selectedItem.severity] || 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    Priorite {selectedItem.severity}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-3">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">Type de panne</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{selectedItem.lastFailure || 'N/A'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-3">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">Diagnostic telephonique</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{selectedItem.phoneDiagnostic || 'N/A'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-3">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">Solution d'intervention</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{selectedItem.interventionSolution || 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-wider text-blue-600">Recommendation</p>
                  <p className="mt-1 text-sm font-semibold text-blue-800">{getRecommendation(selectedItem)}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
                <button
                  type="button"
                  onClick={closeDetails}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
