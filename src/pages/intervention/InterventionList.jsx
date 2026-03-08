import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit2, 
  Trash2, 
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  FileText,
  ChevronRight,
  UserPlus,
  Hourglass,
  UserCheck,
  ArrowRight,
  Building2,
  Calendar,
  Settings,
  ArrowUpDown
} from 'lucide-react'

// ── Workflow statuses aligned with real SAV process ──
const statusConfig = {
  PENDING:     { label: 'En attente',     color: 'bg-amber-50 text-amber-700 border border-amber-200',    dot: 'bg-amber-500',   icon: Hourglass,   step: 1 },
  ASSIGNED:    { label: 'Affectée',       color: 'bg-blue-50 text-blue-700 border border-blue-200',       dot: 'bg-blue-500',    icon: UserCheck,   step: 2 },
  IN_PROGRESS: { label: 'En cours',       color: 'bg-orange-50 text-orange-700 border border-orange-200',  dot: 'bg-orange-500',  icon: PlayCircle,  step: 3 },
  TESTING:     { label: 'En test',        color: 'bg-purple-50 text-purple-700 border border-purple-200',  dot: 'bg-purple-500',  icon: Settings,    step: 4 },
  CLOSED:      { label: 'Clôturé',       color: 'bg-green-50 text-green-700 border border-green-200',    dot: 'bg-green-500',   icon: CheckCircle2, step: 5 },
}

// ── Workflow steps for the visual pipeline ──
const workflowSteps = [
  { key: 'PENDING',     label: 'En attente',  icon: Hourglass },
  { key: 'ASSIGNED',    label: 'Affectée',    icon: UserCheck },
  { key: 'IN_PROGRESS', label: 'En cours',    icon: PlayCircle },
  { key: 'TESTING',     label: 'En test',     icon: Settings },
  { key: 'CLOSED',      label: 'Clôturé',    icon: CheckCircle2 },
]

const mockInterventions = [
  { id: 'INT-2026-001', ficheNumber: '2026/03/01 100201', client: 'Garage Central',     machine: 'Pont Élévateur 4T',      type: 'Réparation',             status: 'IN_PROGRESS', assignedTo: 'Jean Dupont',   date: '2026-03-01', clientCode: 'CLT-882' },
  { id: 'INT-2026-002', ficheNumber: '2026/03/02 100302', client: 'Usine MetalPlus',    machine: 'Compresseur Industriel', type: 'Installation',            status: 'PENDING',     assignedTo: null,            date: '2026-03-02', clientCode: 'CLT-445' },
  { id: 'INT-2026-003', ficheNumber: '2026/03/02 100303', client: 'Logistique Express', machine: 'Chariot Élévateur',      type: 'Réparation',             status: 'ASSIGNED',    assignedTo: 'Pierre Martin', date: '2026-03-02', clientCode: 'CLT-116' },
  { id: 'INT-2026-004', ficheNumber: '2026/02/28 090401', client: 'BTP Service',        machine: 'Générateur 50kVA',       type: 'Devis',                   status: 'CLOSED',      assignedTo: 'Jean Dupont',   date: '2026-02-28', clientCode: 'CLT-290' },
  { id: 'INT-2026-005', ficheNumber: '2026/03/01 110501', client: 'AgriTech SA',        machine: "Système d'Irrigation",   type: 'Réparation',             status: 'TESTING',     assignedTo: 'Marie Curie',   date: '2026-03-01', clientCode: 'CLT-512' },
  { id: 'INT-2026-006', ficheNumber: '2026/03/03 140601', client: 'Clinique Moderne',   machine: 'Ascenseur Bloc B',       type: 'Garantie',                status: 'PENDING',     assignedTo: null,            date: '2026-03-03', clientCode: 'CLT-780' },
  { id: 'INT-2026-007', ficheNumber: '2026/03/03 150701', client: 'MegaDistrib SA',     machine: 'Porte Automatique',      type: 'Réparation',             status: 'ASSIGNED',    assignedTo: 'Sarah Martin',  date: '2026-03-03', clientCode: 'CLT-331' },
]

export default function InterventionList() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm]     = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showActions, setShowActions]   = useState(null)
  const [sortField, setSortField]       = useState('date')
  const [sortDir, setSortDir]           = useState('desc')

  const counts = useMemo(() => {
    const c = { ALL: mockInterventions.length }
    Object.keys(statusConfig).forEach(k => { c[k] = mockInterventions.filter(i => i.status === k).length })
    return c
  }, [])

  const filteredInterventions = useMemo(() => {
    let list = mockInterventions.filter(item => {
      const q = searchTerm.toLowerCase()
      const matchesSearch =
        item.id.toLowerCase().includes(q) ||
        item.ficheNumber.toLowerCase().includes(q) ||
        item.client.toLowerCase().includes(q) ||
        item.machine.toLowerCase().includes(q) ||
        (item.assignedTo && item.assignedTo.toLowerCase().includes(q))
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
      return matchesSearch && matchesStatus
    })
    list.sort((a, b) => {
      let cmp = 0
      if (sortField === 'date') cmp = a.date.localeCompare(b.date)
      else if (sortField === 'client') cmp = a.client.localeCompare(b.client)
      else if (sortField === 'status') cmp = statusConfig[a.status].step - statusConfig[b.status].step
      return sortDir === 'desc' ? -cmp : cmp
    })
    return list
  }, [searchTerm, statusFilter, sortField, sortDir])

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const getWorkflowStep = (status) => statusConfig[status]?.step || 0

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-slate-50 min-h-full">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-[#0052CC] to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <FileText size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dossiers d’interventions SAV</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Suivez le cycle de vie complet : Création → En attente → Affectation → Clôture</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/interventions/create')}
          className="group flex items-center gap-2.5 bg-gradient-to-r from-[#0052CC] to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 active:scale-95 shrink-0"
        >
          <Plus size={18} strokeWidth={3} />
          Nouvelle intervention
          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" strokeWidth={3} />
        </button>
      </div>

      {/* ── WORKFLOW PIPELINE ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Pipeline du workflow</h3>
          <span className="text-[10px] font-bold text-slate-400">{mockInterventions.length} dossiers au total</span>
        </div>
        <div className="flex items-center gap-0">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon
            const count = counts[step.key] || 0
            const isActive = statusFilter === step.key
            const cfg = statusConfig[step.key]
            return (
              <React.Fragment key={step.key}>
                {idx > 0 && (
                  <div className="flex-shrink-0 w-8 flex items-center justify-center">
                    <ArrowRight size={16} className="text-slate-200" />
                  </div>
                )}
                <button
                  onClick={() => setStatusFilter(statusFilter === step.key ? 'ALL' : step.key)}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-[#0052CC] bg-[#0052CC]/5 shadow-md shadow-blue-100'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-200' : count > 0 ? cfg.color : 'bg-slate-100 text-slate-300'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-black ${isActive ? 'text-[#0052CC]' : 'text-slate-800'}`}>{count}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isActive ? 'text-[#0052CC]' : 'text-slate-400'}`}>{step.label}</p>
                  </div>
                </button>
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* ── SEARCH + FILTER BAR ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Rechercher par N° dossier, client, équipement ou employé assigné..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] focus:bg-white transition-all font-medium placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <Filter className="text-slate-400 shrink-0" size={16} />
          <select
            className="flex-1 md:w-52 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] focus:bg-white transition-all cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tous les statuts</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Table header bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">
            {filteredInterventions.length} dossier{filteredInterventions.length > 1 ? 's' : ''}
            <span className="font-normal text-slate-400 ml-1">
              {statusFilter !== 'ALL' ? `— filtré par “${statusConfig[statusFilter].label}”` : `sur ${mockInterventions.length} au total`}
            </span>
          </p>
          {statusFilter !== 'ALL' && (
            <button onClick={() => setStatusFilter('ALL')} className="text-xs font-bold text-[#0052CC] hover:underline">
              Effacer le filtre
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  N° Fiche
                </th>
                <th className="px-6 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <button onClick={() => toggleSort('client')} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                    Client
                    <ArrowUpDown size={12} className={sortField === 'client' ? 'text-[#0052CC]' : 'text-slate-300'} />
                  </button>
                </th>
                <th className="px-6 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Équipement</th>
                <th className="px-6 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <button onClick={() => toggleSort('status')} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                    Statut
                    <ArrowUpDown size={12} className={sortField === 'status' ? 'text-[#0052CC]' : 'text-slate-300'} />
                  </button>
                </th>
                <th className="px-6 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Employé assigné</th>
                <th className="px-6 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <button onClick={() => toggleSort('date')} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                    Date
                    <ArrowUpDown size={12} className={sortField === 'date' ? 'text-[#0052CC]' : 'text-slate-300'} />
                  </button>
                </th>
                <th className="px-6 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Progression</th>
                <th className="px-6 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInterventions.length > 0 ? (
                filteredInterventions.map((item) => {
                  const cfg = statusConfig[item.status]
                  const StatusIcon = cfg.icon
                  const currentStep = getWorkflowStep(item.status)
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* N° Fiche */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-xs font-bold text-[#0052CC] bg-blue-50 px-2.5 py-1 rounded-lg inline-block w-fit">{item.id}</span>
                          <span className="text-[10px] text-slate-400 font-medium pl-1">{item.ficheNumber}</span>
                        </div>
                      </td>
                      {/* Client */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                            <Building2 size={16} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight">{item.client}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{item.clientCode}</p>
                          </div>
                        </div>
                      </td>
                      {/* Équipement */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 font-medium">{item.machine}</div>
                      </td>
                      {/* Type */}
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{item.type}</span>
                      </td>
                      {/* Statut */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${cfg.color}`}>
                          <StatusIcon size={13} />
                          {cfg.label}
                        </span>
                      </td>
                      {/* Employé assigné */}
                      <td className="px-6 py-4">
                        {item.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0052CC] to-blue-700 flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-sm">
                              {item.assignedTo.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-sm font-medium text-slate-700">{item.assignedTo}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full border-2 border-dashed border-amber-300 bg-amber-50 flex items-center justify-center shrink-0">
                              <UserPlus size={12} className="text-amber-400" />
                            </div>
                            <span className="text-xs font-bold text-amber-500 italic">Non assigné</span>
                          </div>
                        )}
                      </td>
                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-300" />
                          <span className="text-sm text-slate-500 font-medium">{item.date.split('-').reverse().join('/')}</span>
                        </div>
                      </td>
                      {/* Progression */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(step => (
                            <div
                              key={step}
                              className={`w-5 h-1.5 rounded-full transition-all ${
                                step <= currentStep ? 'bg-[#0052CC]' : 'bg-slate-100'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] font-semibold text-slate-400 mt-1">Étape {currentStep}/5</p>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowActions(showActions === item.id ? null : item.id) }}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {showActions === item.id && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-10 py-2 overflow-hidden">
                              <div className="px-4 pb-2 mb-1 border-b border-slate-50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dossier {item.id}</p>
                                <p className="text-[10px] text-slate-300 font-semibold mt-0.5">{cfg.label}</p>
                              </div>
                              <button
                                onClick={() => { setShowActions(null); navigate(`/interventions/${item.id}`) }}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition font-medium"
                              >
                                <Eye size={15} className="text-[#0052CC]" /> Consulter le dossier
                              </button>
                              <button
                                onClick={() => { setShowActions(null); navigate(`/interventions/${item.id}`) }}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition font-medium"
                              >
                                <Edit2 size={15} className="text-slate-500" /> Modifier le dossier
                              </button>
                              {item.status === 'PENDING' && (
                                <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition font-medium">
                                  <UserPlus size={15} className="text-blue-500" /> Affecter à un employé
                                </button>
                              )}
                              <div className="border-t border-slate-100 my-1.5 mx-3"></div>
                              <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition font-medium">
                                <Trash2 size={15} /> Supprimer le dossier
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Wrench size={28} className="text-slate-300" />
                      </div>
                      <p className="font-bold text-slate-500">Aucun dossier trouvé</p>
                      <p className="text-sm text-slate-400 max-w-xs">Modifiez vos critères de filtrage ou créez une nouvelle intervention.</p>
                      <button
                        onClick={() => navigate('/interventions/create')}
                        className="mt-2 flex items-center gap-2 text-sm font-bold text-[#0052CC] hover:underline"
                      >
                        <Plus size={16} /> Créer une intervention
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm font-semibold text-slate-500">
            {filteredInterventions.length} dossier{filteredInterventions.length > 1 ? 's' : ''} affiché{filteredInterventions.length > 1 ? 's' : ''}
            <span className="text-slate-400 font-normal ml-1">sur {mockInterventions.length} au total</span>
          </p>
          <div className="flex gap-2">
            <button disabled className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-400 text-sm font-semibold cursor-not-allowed">Précédent</button>
            <span className="px-4 py-2 rounded-xl bg-[#0052CC] text-white text-sm font-bold shadow-sm">1</span>
            <button disabled className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-400 text-sm font-semibold cursor-not-allowed">Suivant</button>
          </div>
        </div>
      </div>

      {/* ── WORKFLOW LEGEND ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Légende du workflow</h4>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
            <span className="text-xs font-semibold text-slate-600">En attente — Nouvellement créée, aucun employé assigné</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span className="text-xs font-semibold text-slate-600">Affectée — Employé assigné via une mission</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
            <span className="text-xs font-semibold text-slate-600">En cours — Intervention en cours d’exécution</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
            <span className="text-xs font-semibold text-slate-600">En test — Essais de validation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            <span className="text-xs font-semibold text-slate-600">Clôturé — Dossier validé et clôturé</span>
          </div>
        </div>
      </div>
    </div>
  )
}
