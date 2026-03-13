import { forwardRef, useImperativeHandle, useState } from 'react'
import { AlertCircle, Package, ClipboardList, Users, Eye, Edit, Trash2, MapPin, Building2, Phone, Calendar, Wrench, Paperclip, FileText, Clock, UserCheck, Hourglass, Link2, Settings } from 'lucide-react'

const initialMissions = [
  {
    id: 1,
    icon: AlertCircle,
    title: 'Réparation urgente pompe hydraulique',
    description: 'Intervention client prioritaire - Site Marseille',
    employee: 'Marc Dubois',
    avatar: 'M',
    priority: 'Critique',
    priorityColor: 'red',
    status: 'En cours',
    statusColor: 'yellow',
    dueDate: "Aujourd'hui",
    dueTime: '18:00',
    duration: '4h',
    type: 'Normal',
    interventionId: null,
  },
  {
    id: 2,
    icon: Package,
    title: 'Inventaire pièces détachées Q4',
    description: 'Vérification stock et mise à jour base de données',
    employee: 'Sarah Martin',
    avatar: 'S',
    priority: 'Haute',
    priorityColor: 'orange',
    status: 'À faire',
    statusColor: 'blue',
    dueDate: '25 Oct 2024',
    duration: '6h',
    type: 'Normal',
    interventionId: null,
  },
  {
    id: 3,
    icon: ClipboardList,
    title: 'Rédaction rapport mensuel octobre',
    description: 'Synthèse activités et KPIs du mois',
    employee: 'Jean Dupont',
    avatar: 'J',
    priority: 'Moyenne',
    priorityColor: 'gray',
    status: 'Terminée',
    statusColor: 'green',
    dueDate: '23 Oct 2024',
    duration: '3h',
    type: 'Normal',
    interventionId: null,
  },
  {
    id: 4,
    icon: AlertCircle,
    title: 'Installation nouveau système CRM',
    description: 'En attente validation direction',
    employee: 'Jean Dupont',
    avatar: 'J',
    priority: 'Haute',
    priorityColor: 'orange',
    status: 'Bloquée',
    statusColor: 'red',
    dueDate: '30 Oct 2024',
    duration: '12h',
    type: 'Normal',
    interventionId: null,
  },
  {
    id: 5,
    icon: Wrench,
    title: "Réparation Pont Élévateur - Garage Central",
    description: 'Intervention liée au dossier INT-2026-001',
    employee: 'Jean Dupont',
    avatar: 'J',
    priority: 'Critique',
    priorityColor: 'red',
    status: 'En cours',
    statusColor: 'yellow',
    dueDate: "Aujourd'hui",
    duration: '4h',
    type: 'Intervention',
    interventionId: 'INT-2026-001',
  },
  {
    id: 6,
    icon: Wrench,
    title: "Réparation Chariot Élévateur - Logistique Express",
    description: 'Intervention liée au dossier INT-2026-003',
    employee: 'Pierre Martin',
    avatar: 'P',
    priority: 'Haute',
    priorityColor: 'orange',
    status: 'À faire',
    statusColor: 'blue',
    dueDate: '04 Mars 2026',
    duration: '3h',
    type: 'Intervention',
    interventionId: 'INT-2026-003',
  },
]

// ── Interventions list matching InterventionList.jsx data ──
// Only PENDING and ASSIGNED interventions are available for linking
const interventionsList = [
  { id: 'INT-2026-001', client: 'Garage Central',     machine: 'Pont Élévateur 4T',      type: 'Réparation',   status: 'IN_PROGRESS', statusLabel: 'En cours',    date: '01/03/2026', phone: '99184688', clientCode: 'CLT-882', request: 'Fuite hydraulique vérin gauche', assignedTo: 'Jean Dupont' },
  { id: 'INT-2026-002', client: 'Usine MetalPlus',    machine: 'Compresseur Industriel', type: 'Installation',  status: 'PENDING',     statusLabel: 'En attente',  date: '02/03/2026', phone: '71445566', clientCode: 'CLT-445', request: 'Installation compresseur nouvelle ligne', assignedTo: null },
  { id: 'INT-2026-003', client: 'Logistique Express', machine: 'Chariot Élévateur',      type: 'Réparation',   status: 'ASSIGNED',    statusLabel: 'Affectée',    date: '02/03/2026', phone: '55667788', clientCode: 'CLT-116', request: 'Panne système de levage', assignedTo: 'Pierre Martin' },
  { id: 'INT-2026-004', client: 'BTP Service',        machine: 'Générateur 50kVA',       type: 'Devis',         status: 'CLOSED',      statusLabel: 'Clôturé',     date: '28/02/2026', phone: '22334455', clientCode: 'CLT-290', request: 'Établissement devis remplacement', assignedTo: 'Jean Dupont' },
  { id: 'INT-2026-005', client: 'AgriTech SA',        machine: "Système d'Irrigation",   type: 'Réparation',   status: 'TESTING',     statusLabel: 'En test',     date: '01/03/2026', phone: '99112233', clientCode: 'CLT-512', request: 'Fuite circuit principal', assignedTo: 'Marie Curie' },
  { id: 'INT-2026-006', client: 'Clinique Moderne',   machine: 'Ascenseur Bloc B',       type: 'Garantie',      status: 'PENDING',     statusLabel: 'En attente',  date: '03/03/2026', phone: '71889900', clientCode: 'CLT-780', request: 'Maintenance préventive ascenseur', assignedTo: null },
  { id: 'INT-2026-007', client: 'MegaDistrib SA',     machine: 'Porte Automatique',      type: 'Réparation',   status: 'ASSIGNED',    statusLabel: 'Affectée',    date: '03/03/2026', phone: '55443322', clientCode: 'CLT-331', request: 'Porte automatique bloquée', assignedTo: 'Sarah Martin' },
]

// Only show PENDING and ASSIGNED interventions in the "Lier à une intervention" dropdown
const linkableInterventions = interventionsList.filter(i => i.status === 'PENDING' || i.status === 'ASSIGNED')

const priorityColors = {
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-700',
}

const statusColors = {
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
}

const interventionStatusColors = {
  PENDING: 'bg-amber-100 text-amber-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
}

function getAvatarFromName(name) {
  if (!name) return ''
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

function MissionTableInner(props, ref) {
  const [missions, setMissions] = useState(initialMissions)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [formMissionId, setFormMissionId] = useState(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formEmployee, setFormEmployee] = useState('')
  const [formPriority, setFormPriority] = useState('Moyenne')
  const [formDueDate, setFormDueDate] = useState('')
  const [formDueTime, setFormDueTime] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formStatus, setFormStatus] = useState('À faire')

  const [missionType, setMissionType] = useState('Normal')
  const [selectedInterventionId, setSelectedInterventionId] = useState('')
  const [formSite, setFormSite] = useState('')
  const [formAddress, setFormAddress] = useState('')

  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewMission, setViewMission] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const employeeOptions = Array.from(new Set(missions.map((mission) => mission.employee)))
  const selectedIntervention = linkableInterventions.find(i => i.id === selectedInterventionId)

  const totalMissions = missions.length
  const totalPages = Math.max(1, Math.ceil(totalMissions / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedMissions = missions.slice(startIndex, endIndex)

  const handleOpenCreateModal = () => {
    setModalMode('create')
    setFormMissionId(null)
    setFormTitle('')
    setFormDescription('')
    setFormEmployee(employeeOptions[0] || '')
    setFormPriority('Moyenne')
    setFormDueDate('')
    setFormDueTime('')
    setFormNotes('')
    setFormStatus('À faire')
    setMissionType('Normal')
    setSelectedInterventionId('')
    setFormSite('')
    setFormAddress('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (mission) => {
    setModalMode('edit')
    setFormMissionId(mission.id)
    setFormTitle(mission.title)
    setFormDescription(mission.description)
    setFormEmployee(mission.employee)
    setFormPriority(mission.priority)
    setFormDueDate(mission.dueDate)
    setFormDueTime(mission.dueTime || '')
    setFormNotes(mission.notes || '')
    setFormStatus(mission.status || 'À faire')
    setMissionType(mission.type || 'Normal')
    setFormSite(mission.site || '')
    setFormAddress(mission.address || '')
    setSelectedInterventionId(mission.interventionId || '')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleSubmitModal = (event) => {
    event.preventDefault()

    if (!formTitle || !formDescription || !formEmployee) {
      return
    }

    if (missionType === 'Intervention' && !selectedInterventionId) {
      alert('Veuillez sélectionner une intervention.')
      return
    }

    const baseMission = {
      title: formTitle,
      description: formDescription,
      employee: formEmployee,
      avatar: getAvatarFromName(formEmployee),
      priority: formPriority,
      priorityColor:
        formPriority === 'Critique'
          ? 'red'
          : formPriority === 'Haute'
            ? 'orange'
            : formPriority === 'Moyenne'
              ? 'yellow'
              : 'gray',
      status: modalMode === 'create' ? 'À faire' : formStatus,
      statusColor:
        modalMode === 'create'
          ? 'blue'
          : (formStatus === 'En cours' ? 'yellow' : formStatus === 'Terminée' ? 'green' : formStatus === 'Bloquée' ? 'red' : 'blue'),
      dueDate: formDueDate || "Aujourd'hui",
      dueTime: formDueTime || null,
      duration: null,
      notes: formNotes,
      icon: missionType === 'Intervention' ? Wrench : ClipboardList,
      type: missionType,
      site: missionType === 'Normal' ? formSite : selectedIntervention?.client,
      address: missionType === 'Normal' ? formAddress : 'N/A',
      interventionId: missionType === 'Intervention' ? selectedInterventionId : null,
    }

    if (modalMode === 'create') {
      const nextId = missions.length ? Math.max(...missions.map((mission) => mission.id)) + 1 : 1
      const newMission = {
        id: nextId,
        ...baseMission,
      }
      setMissions((prev) => [newMission, ...prev])
    } else {
      setMissions((prev) =>
        prev.map((mission) => {
          if (mission.id !== formMissionId) return mission
          return {
            ...mission,
            ...baseMission,
          }
        }),
      )
    }

    setIsModalOpen(false)
  }

  useImperativeHandle(ref, () => ({
    openCreateModal: handleOpenCreateModal,
  }))

  const handleOpenViewModal = (mission) => {
    setViewMission(mission)
    setIsViewOpen(true)
  }

  const handleCloseViewModal = () => {
    setIsViewOpen(false)
    setViewMission(null)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden relative">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mission</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employé</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Priorité</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type de mission</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date mission</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
          {paginatedMissions.map((mission) => {
            const IconComponent = mission.icon
            return (
              <tr key={mission.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mission.type === 'Intervention' ? 'bg-blue-50' : 'bg-gray-100'}`}>
                      <IconComponent size={18} className={`${mission.type === 'Intervention' ? 'text-[#0052CC]' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{mission.title}</p>
                      <p className="text-sm text-gray-500">{mission.description}</p>
                      {mission.type === 'Intervention' && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md">
                          <Link2 size={10} /> Intervention
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs font-bold">
                      {mission.avatar}
                    </div>
                    <span className="text-sm text-gray-900">{mission.employee}</span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${priorityColors[mission.priorityColor]}`}>
                    {mission.priority === 'Critique' && '⚠️ '}
                    {mission.priority === 'Haute' && '↗ '}
                    {mission.priority === 'Moyenne' && '– '}
                    {mission.priority === 'Basse' && '↘ '}
                    {mission.priority}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[mission.statusColor]}`}>
                    {mission.status === 'En cours' && '●'}
                    {mission.status === 'À faire' && '●'}
                    {mission.status === 'Terminée' && '✓'}
                    {mission.status === 'Bloquée' && '⊗'}
                    {' '}
                    {mission.status}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  {mission.type === 'Intervention' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-[#0052CC] bg-blue-50 border border-blue-100">
                      <Wrench size={12} />
                      Intervention S.A.V
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200">
                      <ClipboardList size={12} />
                      Normal
                    </span>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{mission.dueDate}</p>
                  {mission.dueTime && <p className="text-sm text-red-600">{mission.dueTime}</p>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => handleOpenViewModal(mission)}
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => handleOpenEditModal(mission)}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded"
                      onClick={() => alert('Suppression de la mission simulée (aucune API connectée).')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
          </tbody>
        </table>
      </div>
      {totalMissions > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs sm:text-sm text-gray-600">
            Affichage de{' '}
            <span className="font-medium">
              {startIndex + 1}–{Math.min(endIndex, totalMissions)}
            </span>{' '}
            sur <span className="font-medium">{totalMissions}</span> missions
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border ${
                safeCurrentPage === 1
                  ? 'text-gray-400 border-gray-200 bg-white cursor-not-allowed'
                  : 'text-gray-700 border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              Précédent
            </button>
            <span className="text-xs sm:text-sm text-gray-600">
              Page <span className="font-medium">{safeCurrentPage}</span> sur{' '}
              <span className="font-medium">{totalPages}</span>
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border ${
                safeCurrentPage === totalPages
                  ? 'text-gray-400 border-gray-200 bg-white cursor-not-allowed'
                  : 'text-gray-700 border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* ═══ CREATE/EDIT MODAL ═══ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <ClipboardList size={22} className="text-[#0052CC]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalMode === 'create' ? 'Ajouter une mission' : 'Modifier la mission'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {modalMode === 'create'
                      ? 'Remplissez les détails pour assigner une nouvelle mission.'
                      : 'Mettez à jour les informations de la mission existante.'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Trash2 size={20} className="rotate-45" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="mission-form" onSubmit={handleSubmitModal} className="space-y-8">
                {/* Configuration Section */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Wrench size={14} />
                    Configuration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Type de mission</label>
                      <select
                        value={missionType}
                        onChange={(e) => { setMissionType(e.target.value); setSelectedInterventionId('') }}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white transition-all hover:border-gray-300"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Intervention">Intervention SAV</option>
                      </select>
                    </div>
                    {missionType === 'Intervention' && (
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Link2 size={14} className="text-[#0052CC]" />
                          Lier à une intervention
                        </label>
                        <select
                          value={selectedInterventionId}
                          onChange={(e) => setSelectedInterventionId(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white transition-all hover:border-gray-300"
                          required
                        >
                          <option value="">Sélectionner une intervention</option>
                          <optgroup label="🕒 En attente (non assignées)">
                            {linkableInterventions.filter(i => i.status === 'PENDING').map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.id} — {inv.client} — {inv.machine}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="✅ Affectées (déjà assignées)">
                            {linkableInterventions.filter(i => i.status === 'ASSIGNED').map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.id} — {inv.client} — {inv.machine} ({inv.assignedTo})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    )}
                  </div>

                  {missionType === 'Intervention' && selectedIntervention && (
                    <div className="mt-4 p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-xl border border-blue-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#0052CC] font-bold text-xs uppercase tracking-wider">
                          <AlertCircle size={14} />
                          Détails de l’intervention
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${interventionStatusColors[selectedIntervention.status] || 'bg-gray-100 text-gray-600'}`}>
                          {selectedIntervention.status === 'PENDING' && <Hourglass size={10} />}
                          {selectedIntervention.status === 'ASSIGNED' && <UserCheck size={10} />}
                          {selectedIntervention.statusLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Client</label>
                          <p className="text-sm font-semibold text-gray-800">{selectedIntervention.client}</p>
                          <p className="text-[10px] text-gray-400 font-semibold">{selectedIntervention.clientCode}</p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Équipement</label>
                          <p className="text-sm font-semibold text-gray-800">{selectedIntervention.machine}</p>
                          <p className="text-[10px] text-gray-400 font-semibold">{selectedIntervention.type}</p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Téléphone</label>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                            <Phone size={14} className="text-blue-300" />
                            {selectedIntervention.phone}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Date création</label>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                            <Calendar size={14} className="text-blue-300" />
                            {selectedIntervention.date}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Demande / problème</label>
                          <p className="text-sm text-gray-700 bg-white/60 p-2.5 rounded-lg border border-blue-50 italic">{selectedIntervention.request}</p>
                        </div>
                        {selectedIntervention.assignedTo && (
                          <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Déjà assignée à</label>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-[10px] font-bold">
                                {getAvatarFromName(selectedIntervention.assignedTo)}
                              </div>
                              <span className="text-sm font-semibold text-gray-800">{selectedIntervention.assignedTo}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                {/* Details Section */}
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText size={14} />
                    Détails de la mission
                  </h3>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      {missionType === 'Normal' ? 'Titre de la mission' : 'Titre de la sous-mission'}
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(event) => setFormTitle(event.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] transition-all hover:border-gray-300"
                      placeholder={missionType === 'Normal' ? "Ex: Maintenance préventive..." : "Ex: Vérification câblage..."}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      {missionType === 'Normal' ? 'Description détaillée' : 'Description technique'}
                    </label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(event) => setFormDescription(event.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] resize-none transition-all hover:border-gray-300"
                      placeholder="Décrivez précisément les actions à réaliser..."
                      required
                    />
                  </div>

                  {missionType === 'Normal' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Building2 size={16} className="text-gray-400" />
                          Site
                        </label>
                        <input
                          type="text"
                          value={formSite}
                          onChange={(e) => setFormSite(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] transition-all hover:border-gray-300"
                          placeholder="Nom du site"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                          <MapPin size={16} className="text-gray-400" />
                          Adresse
                        </label>
                        <input
                          type="text"
                          value={formAddress}
                          onChange={(e) => setFormAddress(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] transition-all hover:border-gray-300"
                          placeholder="Adresse complète"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Notes supplémentaires (optionnel)</label>
                    <textarea
                      rows={2}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] resize-none transition-all hover:border-gray-300"
                      placeholder="Consignes particulières, précautions, contacts sur place..."
                    />
                  </div>
                </section>

                {/* Assignment & Timing Section */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users size={14} />
                    Assignation & Délai
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700">Employé assigné</label>
                        <select
                          value={formEmployee}
                          onChange={(event) => setFormEmployee(event.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white transition-all hover:border-gray-300"
                          required
                        >
                          <option value="">Sélectionner</option>
                          {employeeOptions.map((employee) => (
                            <option key={employee} value={employee}>
                              {employee}
                            </option>
                          ))}
                        </select>
                      </div>
                      {modalMode === 'edit' && (
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-gray-700">Statut</label>
                          <select
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white transition-all hover:border-gray-300"
                          >
                            <option value="À faire">À faire</option>
                            <option value="En cours">En cours</option>
                            <option value="Terminée">Terminée</option>
                            <option value="Bloquée">Bloquée</option>
                          </select>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700">Priorité</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Critique', 'Haute', 'Moyenne', 'Basse'].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setFormPriority(p)}
                              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                                formPriority === p
                                  ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-sm'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700">Date de mission</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={formDueDate}
                            onChange={(event) => setFormDueDate(event.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] transition-all hover:border-gray-300"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                          <Clock size={14} className="text-gray-400" />
                          Heure de début
                        </label>
                        <div className="relative">
                          <input
                            type="time"
                            value={formDueTime}
                            onChange={(event) => setFormDueTime(event.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] transition-all hover:border-gray-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Attachments Section */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Paperclip size={14} />
                    Pièces jointes
                  </h3>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#0052CC] hover:bg-blue-50/50 transition-all cursor-pointer group bg-gray-50/50">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 group-hover:text-[#0052CC] transition-colors">
                        <FileText size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 group-hover:text-[#0052CC] transition-colors">
                          Cliquez pour ajouter des fichiers
                        </p>
                        <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 10MB)</p>
                      </div>
                    </div>
                  </div>
                </section>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 sticky bottom-0">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-white hover:shadow-sm transition-all active:scale-95"
              >
                Annuler
              </button>
              <button
                form="mission-form"
                type="submit"
                className="px-8 py-2.5 bg-[#0052CC] text-white rounded-lg text-sm font-semibold hover:bg-[#0042a3] hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
              >
                {modalMode === 'create' ? 'Créer la mission' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ VIEW MODAL ═══ */}
      {isViewOpen && viewMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* View Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-lg font-bold shadow-inner">
                  {viewMission.avatar}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{viewMission.employee}</h2>
                  <p className="text-xs text-gray-500 font-medium">Responsable de la mission</p>
                </div>
              </div>
              <button
                onClick={handleCloseViewModal}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Trash2 size={20} className="rotate-45" />
              </button>
            </div>

            {/* View Body */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Titre de la mission</p>
                  <p className="text-base font-semibold text-gray-900 leading-tight">{viewMission.title}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                    "{viewMission.description}"
                  </p>
                </div>

                {viewMission.interventionId && (
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1.5">Intervention liée</p>
                    <span className="font-mono text-sm font-bold text-[#0052CC]">{viewMission.interventionId}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Priorité</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${priorityColors[viewMission.priorityColor]}`}
                    >
                      {viewMission.priority === 'Critique' && '⚠️ '}
                      {viewMission.priority === 'Haute' && '↗ '}
                      {viewMission.priority === 'Moyenne' && '– '}
                      {viewMission.priority === 'Basse' && '↘ '}
                      {viewMission.priority}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Statut</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColors[viewMission.statusColor]}`}
                    >
                      {viewMission.status === 'En cours' && '● '}
                      {viewMission.status === 'À faire' && '● '}
                      {viewMission.status === 'Terminée' && '✓ '}
                      {viewMission.status === 'Bloquée' && '⊗ '}
                      {viewMission.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-blue-50 rounded-lg">
                      <Calendar size={16} className="text-[#0052CC]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Échéance</p>
                      <p className="text-sm font-semibold text-gray-900">{viewMission.dueDate}</p>
                      {viewMission.dueTime && <p className="text-xs text-red-500 font-medium">{viewMission.dueTime}</p>}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-orange-50 rounded-lg">
                      <Clock size={16} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Temps estimé</p>
                      <p className="text-sm font-semibold text-gray-900">{viewMission.duration}</p>
                    </div>
                  </div>
                </div>

                {(viewMission.site || viewMission.address) && (
                  <div className="pt-4 border-t border-gray-100 flex items-center gap-4">
                    {viewMission.site && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Building2 size={14} className="text-gray-400" />
                        <span className="font-medium">{viewMission.site}</span>
                      </div>
                    )}
                    {viewMission.address && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="font-medium truncate max-w-[200px]">{viewMission.address}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* View Footer */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={handleCloseViewModal}
                className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all active:scale-95 shadow-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const MissionTable = forwardRef(MissionTableInner)

export default MissionTable
