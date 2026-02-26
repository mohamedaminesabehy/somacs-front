import { forwardRef, useImperativeHandle, useState } from 'react'
import { AlertCircle, Package, ClipboardList, Users, Eye, Edit, Trash2, MapPin, Building2, Phone, Calendar, Wrench, Paperclip, FileText } from 'lucide-react'

const initialTasks = [
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
  },
  {
    id: 5,
    icon: Users,
    title: "Formation équipe nouveaux outils",
    description: 'Session de formation interne - Salle B',
    employee: 'Sarah Martin',
    avatar: 'S',
    priority: 'Moyenne',
    priorityColor: 'gray',
    status: 'En cours',
    statusColor: 'yellow',
    dueDate: '27 Oct 2024',
    duration: '2h',
  },
  {
    id: 6,
    icon: Package,
    title: 'Répondre emails clients en attente',
    description: 'Traitement boîte de réception support',
    employee: 'Marc Dubois',
    avatar: 'M',
    priority: 'Basse',
    priorityColor: 'gray',
    status: 'À faire',
    statusColor: 'blue',
    dueDate: '28 Oct 2024',
    duration: '1h',
  },
]

const interventions = [
  {
    id: 102,
    client: 'Société X',
    date: '20/02/2026',
    phone: '01 23 45 67 89',
    request: 'Panne climatisation salle serveur',
    reclamationDate: '19/02/2026',
    material: 'Compresseur, Gaz R32',
  },
  {
    id: 103,
    client: 'Clinique Y',
    date: '21/02/2026',
    phone: '04 56 78 90 12',
    request: 'Maintenance préventive ascenseur bloc B',
    reclamationDate: '20/02/2026',
    material: 'Huile hydraulique, Filtres',
  },
]

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

function getAvatarFromName(name) {
  if (!name) return ''
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

function TaskTableInner(props, ref) {
  const [tasks, setTasks] = useState(initialTasks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [formTaskId, setFormTaskId] = useState(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formEmployee, setFormEmployee] = useState('')
  const [formPriority, setFormPriority] = useState('Moyenne')
  const [formDueDate, setFormDueDate] = useState('')
  const [formDuration, setFormDuration] = useState('')
  
  // Nouveaux états pour le type de tâche et les interventions
  const [taskType, setTaskType] = useState('Normal')
  const [selectedInterventionId, setSelectedInterventionId] = useState('')
  const [formSite, setFormSite] = useState('')
  const [formAddress, setFormAddress] = useState('')

  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewTask, setViewTask] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const employeeOptions = Array.from(new Set(tasks.map((task) => task.employee)))
  const selectedIntervention = interventions.find(i => i.id === parseInt(selectedInterventionId))

  const totalTasks = tasks.length
  const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedTasks = tasks.slice(startIndex, endIndex)

  const handleOpenCreateModal = () => {
    setModalMode('create')
    setFormTaskId(null)
    setFormTitle('')
    setFormDescription('')
    setFormEmployee(employeeOptions[0] || '')
    setFormPriority('Moyenne')
    setFormDueDate('')
    setFormDuration('')
    // Reset nouveaux champs
    setTaskType('Normal')
    setSelectedInterventionId('')
    setFormSite('')
    setFormAddress('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (task) => {
    setModalMode('edit')
    setFormTaskId(task.id)
    setFormTitle(task.title)
    setFormDescription(task.description)
    setFormEmployee(task.employee)
    setFormPriority(task.priority)
    setFormDueDate(task.dueDate)
    setFormDuration(task.duration)
    // Nouveaux champs
    setTaskType(task.type || 'Normal')
    setFormSite(task.site || '')
    setFormAddress(task.address || '')
    setSelectedInterventionId(task.interventionId || '')
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

    if (taskType === 'Intervention' && !selectedInterventionId) {
      alert('Veuillez sélectionner une intervention.')
      return
    }

    const baseTask = {
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
      status: modalMode === 'create' ? 'À faire' : tasks.find((task) => task.id === formTaskId)?.status || 'À faire',
      statusColor:
        modalMode === 'create'
          ? 'blue'
          : tasks.find((task) => task.id === formTaskId)?.statusColor || 'blue',
      dueDate: formDueDate || "Aujourd'hui",
      duration: formDuration || '1h',
      icon: taskType === 'Intervention' ? AlertCircle : ClipboardList,
      type: taskType,
      site: taskType === 'Normal' ? formSite : selectedIntervention?.client,
      address: taskType === 'Normal' ? formAddress : 'N/A',
      interventionId: taskType === 'Intervention' ? selectedInterventionId : null,
    }

    if (modalMode === 'create') {
      const nextId = tasks.length ? Math.max(...tasks.map((task) => task.id)) + 1 : 1
      const newTask = {
        id: nextId,
        ...baseTask,
      }
      setTasks((prev) => [newTask, ...prev]) // Put new tasks at the top
    } else {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== formTaskId) return task
          return {
            ...task,
            ...baseTask,
          }
        }),
      )
    }

    setIsModalOpen(false)
  }

  useImperativeHandle(ref, () => ({
    openCreateModal: handleOpenCreateModal,
  }))

  const handleOpenViewModal = (task) => {
    setViewTask(task)
    setIsViewOpen(true)
  }

  const handleCloseViewModal = () => {
    setIsViewOpen(false)
    setViewTask(null)
  }
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden relative">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tâche</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employé</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Priorité</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date limite</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Durée</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
          {paginatedTasks.map((task) => {
            const IconComponent = task.icon
            return (
              <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <IconComponent size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-500">{task.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs font-bold">
                      {task.avatar}
                    </div>
                    <span className="text-sm text-gray-900">{task.employee}</span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${priorityColors[task.priorityColor]}`}>
                    {task.priority === 'Critique' && '⚠️ '}
                    {task.priority === 'Haute' && '↗ '}
                    {task.priority === 'Moyenne' && '– '}
                    {task.priority === 'Basse' && '↘ '}
                    {task.priority}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[task.statusColor]}`}>
                    {task.status === 'En cours' && '●'}
                    {task.status === 'À faire' && '●'}
                    {task.status === 'Terminée' && '✓'}
                    {task.status === 'Bloquée' && '⊗'}
                    {' '}
                    {task.status}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{task.dueDate}</p>
                  {task.dueTime && <p className="text-sm text-red-600">{task.dueTime}</p>}
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <span className="text-sm text-gray-600">{task.duration}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => handleOpenViewModal(task)}
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => handleOpenEditModal(task)}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded"
                      onClick={() => alert('Suppression de la tâche simulée (aucune API connectée).')}
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
      {totalTasks > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs sm:text-sm text-gray-600">
            Affichage de{' '}
            <span className="font-medium">
              {startIndex + 1}–{Math.min(endIndex, totalTasks)}
            </span>{' '}
            sur <span className="font-medium">{totalTasks}</span> tâches
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
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-lg">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 bg-[#E6F0FF] rounded-lg flex items-center justify-center">
                <ClipboardList size={22} className="text-[#0052CC]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {modalMode === 'create' ? 'Ajouter une tâche' : 'Modifier la tâche'}
                </h2>
                <p className="text-sm text-gray-600">
                  {modalMode === 'create'
                    ? 'Définir une nouvelle tâche pour un employé.'
                    : 'Adapter les informations avant de valider la mise à jour.'}
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmitModal} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de tâche
                  </label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Intervention">Intervention</option>
                  </select>
                </div>
                {taskType === 'Intervention' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lier à une intervention
                    </label>
                    <select
                      value={selectedInterventionId}
                      onChange={(e) => setSelectedInterventionId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white"
                      required
                    >
                      <option value="">Sélectionner une intervention</option>
                      {interventions.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          Intervention #{inv.id} – {inv.client} – {inv.date}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {taskType === 'Intervention' && selectedIntervention && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <div className="flex items-center gap-2 text-[#0052CC] font-bold text-xs uppercase tracking-wider mb-1">
                    <AlertCircle size={14} />
                    Informations de l'intervention
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Client</label>
                      <p className="text-sm font-medium text-gray-800">{selectedIntervention.client}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Téléphone</label>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-800">
                        <Phone size={12} className="text-gray-400" />
                        {selectedIntervention.phone}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Demande client</label>
                      <p className="text-sm font-medium text-gray-800">{selectedIntervention.request}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Date réclamation</label>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-800">
                        <Calendar size={12} className="text-gray-400" />
                        {selectedIntervention.reclamationDate}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Matériel prévu</label>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-800">
                        <Wrench size={12} className="text-gray-400" />
                        {selectedIntervention.material}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {taskType === 'Normal' ? 'Titre de la tâche' : 'Titre de la sous-mission'}
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(event) => setFormTitle(event.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                  placeholder={taskType === 'Normal' ? "Ex: Maintenance préventive..." : "Ex: Vérification câblage..."}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {taskType === 'Normal' ? 'Description détaillée' : 'Description technique'}
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(event) => setFormDescription(event.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] resize-none"
                  placeholder="Décrivez précisément les actions à réaliser..."
                  required
                />
              </div>

              {taskType === 'Normal' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Building2 size={16} className="text-gray-400" />
                      Site
                    </label>
                    <input
                      type="text"
                      value={formSite}
                      onChange={(e) => setFormSite(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                      placeholder="Nom du site"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin size={16} className="text-gray-400" />
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                      placeholder="Adresse complète"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employé assigné
                  </label>
                  <select
                    value={formEmployee}
                    onChange={(event) => setFormEmployee(event.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorité
                  </label>
                  <select
                    value={formPriority}
                    onChange={(event) => setFormPriority(event.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white"
                  >
                    <option>Critique</option>
                    <option>Haute</option>
                    <option>Moyenne</option>
                    <option>Basse</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Paperclip size={16} className="text-gray-400" />
                  Pièces jointes
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-[#0052CC] hover:bg-blue-50 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center gap-1">
                    <FileText size={24} className="text-gray-400 group-hover:text-[#0052CC]" />
                    <p className="text-xs text-gray-500 group-hover:text-gray-700">Cliquez pour ajouter des documents ou photos</p>
                    <p className="text-[10px] text-gray-400">PDF, JPG, PNG (Max 10MB)</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date limite
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(event) => setFormDueDate(event.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée estimée
                  </label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(event) => setFormDuration(event.target.value)}
                    placeholder="Ex: 4h, 2h30"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-medium hover:bg-[#0042a3]"
                >
                  {modalMode === 'create' ? 'Ajouter' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isViewOpen && viewTask && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-lg">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-sm font-bold">
                {viewTask.avatar}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{viewTask.employee}</h2>
                <p className="text-sm text-gray-500">Détails de la tâche assignée</p>
              </div>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Tâche</p>
                <p className="text-gray-900">{viewTask.title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Description</p>
                <p className="text-gray-700">{viewTask.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Priorité</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${priorityColors[viewTask.priorityColor]}`}
                  >
                    {viewTask.priority === 'Critique' && '⚠️ '}
                    {viewTask.priority === 'Haute' && '↗ '}
                    {viewTask.priority === 'Moyenne' && '– '}
                    {viewTask.priority === 'Basse' && '↘ '}
                    {viewTask.priority}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Statut</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[viewTask.statusColor]}`}
                  >
                    {viewTask.status === 'En cours' && '● '}
                    {viewTask.status === 'À faire' && '● '}
                    {viewTask.status === 'Terminée' && '✓ '}
                    {viewTask.status === 'Bloquée' && '⊗ '}
                    {viewTask.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Date limite</p>
                  <p className="text-gray-900">{viewTask.dueDate}</p>
                  {viewTask.dueTime && <p className="text-xs text-red-600">{viewTask.dueTime}</p>}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Durée estimée</p>
                  <p className="text-gray-900">{viewTask.duration}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCloseViewModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
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

const TaskTable = forwardRef(TaskTableInner)

export default TaskTable
