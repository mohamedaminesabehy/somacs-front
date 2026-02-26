import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ClipboardList, Package, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const allTasksMock = [
  {
    id: 1,
    icon: AlertCircle,
    title: 'Réparation urgente pompe hydraulique',
    description: 'Intervention client prioritaire - Site Marseille',
    employeeId: 1,
    priority: 'Critique',
    priorityColor: 'red',
    status: 'En cours',
    statusColor: 'yellow',
    scheduledTime: '08:30',
    date: 'today',
  },
  {
    id: 2,
    icon: Package,
    title: 'Inventaire pièces détachées Q4',
    description: 'Vérification stock et mise à jour base de données',
    employeeId: 1,
    priority: 'Haute',
    priorityColor: 'orange',
    status: 'À faire',
    statusColor: 'blue',
    scheduledTime: '10:00',
    date: 'today',
  },
  {
    id: 3,
    icon: ClipboardList,
    title: 'Rédaction rapport mensuel octobre',
    description: 'Synthèse activités et KPIs du mois',
    employeeId: 1,
    priority: 'Moyenne',
    priorityColor: 'gray',
    status: 'À faire',
    statusColor: 'blue',
    scheduledTime: '14:00',
    date: 'today',
  },
  {
    id: 4,
    icon: AlertCircle,
    title: 'Installation nouveau système CRM',
    description: 'En attente validation direction',
    employeeId: 1,
    priority: 'Haute',
    priorityColor: 'orange',
    status: 'Bloquée',
    statusColor: 'red',
    scheduledTime: 'Demain 09:00',
    date: 'upcoming',
  },
  {
    id: 5,
    icon: Users,
    title: "Formation équipe nouveaux outils",
    description: 'Session de formation interne - Salle B',
    employeeId: 1,
    priority: 'Moyenne',
    priorityColor: 'gray',
    status: 'En cours',
    statusColor: 'yellow',
    scheduledTime: 'Demain 15:00',
    date: 'upcoming',
  },
]

const priorityOrder = {
  Critique: 1,
  Haute: 2,
  Moyenne: 3,
  Basse: 4,
}

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

const quickStatusOptions = [
  { label: 'À faire' },
  { label: 'En cours' },
  { label: 'Terminée' },
  { label: 'Bloquée' },
]

export default function EmployeeTasks() {
  const [isLoading, setIsLoading] = useState(true)
  const [tasks, setTasks] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentEmployeeId = 1
      const employeeTasks = allTasksMock.filter((task) => task.employeeId === currentEmployeeId)
      setTasks(employeeTasks)
      setIsLoading(false)
    }, 600)

    return () => clearTimeout(timer)
  }, [])

  const todayTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.date === 'today')
        .sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99)),
    [tasks],
  )

  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.date === 'upcoming')
        .sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99)),
    [tasks],
  )

  const handleOpenDetails = (taskId) => {
    navigate(`/tasks/${taskId}`)
  }

  const handleQuickStatusChange = (taskId, nextStatus) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task

        let statusColor = task.statusColor
        if (nextStatus === 'À faire') statusColor = 'blue'
        if (nextStatus === 'En cours') statusColor = 'yellow'
        if (nextStatus === 'Terminée') statusColor = 'green'
        if (nextStatus === 'Bloquée') statusColor = 'red'

        return {
          ...task,
          status: nextStatus,
          statusColor,
        }
      }),
    )
  }

  const renderPriorityBadge = (task) => (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${priorityColors[task.priorityColor]}`}
    >
      {task.priority === 'Critique' && '⚠️ '}
      {task.priority === 'Haute' && '↗ '}
      {task.priority === 'Moyenne' && '– '}
      {task.priority === 'Basse' && '↘ '}
      {task.priority}
    </span>
  )

  const renderStatusBadge = (task) => (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColors[task.statusColor]}`}
    >
      {task.status === 'En cours' && '● '}
      {task.status === 'À faire' && '● '}
      {task.status === 'Terminée' && '✓ '}
      {task.status === 'Bloquée' && '⊗ '}
      {task.status}
    </span>
  )

  const renderSkeletonCard = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="h-6 w-24 bg-gray-200 rounded-full" />
        <div className="h-6 w-24 bg-gray-200 rounded-full" />
      </div>
    </div>
  )

  const renderTaskCard = (task) => {
    const Icon = task.icon

    return (
      <div
        key={task.id}
        onClick={() => handleOpenDetails(task.id)}
        className="w-full bg-white rounded-lg border border-gray-200 p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#E6F0FF] flex items-center justify-center">
              <Icon size={22} className="text-[#0052CC]" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-semibold text-gray-900">{task.title}</p>
              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
              <div className="mt-2 inline-flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                  Prévu à {task.scheduledTime}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            {renderPriorityBadge(task)}
            {renderStatusBadge(task)}
          </div>
        </div>
        <div
          className="flex flex-wrap gap-2 justify-start sm:justify-end pt-2 border-t border-gray-100"
          onClick={(event) => event.stopPropagation()}
        >
          {quickStatusOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => handleQuickStatusChange(task.id, option.label)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                task.status === option.label
                  ? 'bg-[#0052CC] text-white border-[#0052CC]'
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const renderSection = (title, sectionTasks) => (
    <section className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
        <span className="text-xs sm:text-sm text-gray-500">{sectionTasks.length} tâche(s)</span>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {renderSkeletonCard()}
          {renderSkeletonCard()}
        </div>
      ) : sectionTasks.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          Aucune tâche à afficher dans cette section.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">{sectionTasks.map((task) => renderTaskCard(task))}</div>
      )}
    </section>
  )

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Mes tâches du jour</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Vue simplifiée pour l&apos;employé, lisible à distance en atelier.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E6F0FF] text-[#0052CC] text-xs sm:text-sm font-medium">
          <span>Vue employé</span>
        </div>
      </div>

      <div className="space-y-8">
        {renderSection('Aujourd’hui', todayTasks)}
        {renderSection('À venir', upcomingTasks)}
      </div>
    </div>
  )
}
