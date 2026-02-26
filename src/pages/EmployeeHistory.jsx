import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { User, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

const statusColors = {
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
}

const priorityColors = {
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-700',
}

const mockHistory = [
  {
    id: 1,
    task: 'Réparation urgente pompe hydraulique',
    startDate: '2024-10-21 08:10',
    endDate: '2024-10-21 12:05',
    realDuration: '3h55',
    finalStatus: 'Terminée',
    statusColor: 'green',
    priority: 'Critique',
    priorityColor: 'red',
    remarks: 'Pièce remplacée, test validé avec le client.',
  },
  {
    id: 2,
    task: 'Inventaire pièces détachées Q4',
    startDate: '2024-10-19 09:00',
    endDate: '2024-10-20 17:30',
    realDuration: '7h30',
    finalStatus: 'Terminée',
    statusColor: 'green',
    priority: 'Haute',
    priorityColor: 'orange',
    remarks: 'Inventaire terminé, quelques écarts à analyser.',
  },
  {
    id: 3,
    task: 'Formation équipe nouveaux outils',
    startDate: '2024-10-18 14:00',
    endDate: '2024-10-18 16:00',
    realDuration: '2h00',
    finalStatus: 'Terminée',
    statusColor: 'green',
    priority: 'Moyenne',
    priorityColor: 'gray',
    remarks: 'Feedback positif de l’équipe.',
  },
  {
    id: 4,
    task: 'Installation nouveau système CRM',
    startDate: '2024-10-15 09:30',
    endDate: '2024-10-15 11:00',
    realDuration: '1h30',
    finalStatus: 'En retard',
    statusColor: 'orange',
    priority: 'Haute',
    priorityColor: 'orange',
    remarks: 'Blocage côté fournisseur, reprise prévue semaine prochaine.',
  },
]

export default function EmployeeHistory() {
  const { employeeId } = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(mockHistory)
      setIsLoading(false)
    }, 600)

    return () => clearTimeout(timer)
  }, [employeeId])

  const completedTasks = useMemo(
    () => items.filter((item) => item.finalStatus === 'Terminée').length,
    [items],
  )

  const lateTasks = useMemo(
    () => items.filter((item) => item.finalStatus === 'En retard').length,
    [items],
  )

  const averageDuration = useMemo(() => {
    if (items.length === 0) return '–'
    return '3h20'
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.finalStatus !== statusFilter) {
        return false
      }
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) {
        return false
      }

      if (fromDate) {
        const [startDay] = item.startDate.split(' ')
        if (startDay < fromDate) return false
      }
      if (toDate) {
        const [startDay] = item.startDate.split(' ')
        if (startDay > toDate) return false
      }

      return true
    })
  }, [items, statusFilter, priorityFilter, fromDate, toDate])

  const renderSkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-4 sm:px-6 py-3">
        <div className="h-4 w-40 bg-gray-200 rounded" />
      </td>
      <td className="px-4 sm:px-6 py-3">
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </td>
      <td className="px-4 sm:px-6 py-3">
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </td>
      <td className="px-4 sm:px-6 py-3">
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </td>
      <td className="px-4 sm:px-6 py-3">
        <div className="h-6 w-24 bg-gray-200 rounded-full" />
      </td>
      <td className="px-4 sm:px-6 py-3">
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </td>
    </tr>
  )

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-lg font-semibold">
                MD
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Marc Dubois</h1>
                <p className="text-sm text-gray-600">Technicien terrain • ID {employeeId || '001'}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <CheckCircle2 size={14} className="text-blue-500" />
                  Tâches terminées
                </div>
                <div className="text-lg font-semibold text-gray-900">{completedTasks}</div>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <AlertCircle size={14} className="text-orange-500" />
                  En retard
                </div>
                <div className="text-lg font-semibold text-gray-900">{lateTasks}</div>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <Clock size={14} className="text-green-600" />
                  Durée moyenne
                </div>
                <div className="text-lg font-semibold text-gray-900">{averageDuration}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User size={18} className="text-gray-500" />
              <span>Historique des tâches</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                />
                <span className="text-xs text-gray-500">au</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="Terminée">Terminée</option>
                <option value="En retard">En retard</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white"
              >
                <option value="all">Toutes priorités</option>
                <option value="Critique">Critique</option>
                <option value="Haute">Haute</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Basse">Basse</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Tâche
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Début
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Fin
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Durée réelle
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Statut final
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Remarques
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <>
                    {renderSkeletonRow()}
                    {renderSkeletonRow()}
                    {renderSkeletonRow()}
                  </>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 sm:px-6 py-8 text-center text-sm text-gray-500"
                    >
                      Aucun historique ne correspond aux filtres sélectionnés.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.task}</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${priorityColors[item.priorityColor]}`}
                            >
                              {item.priority === 'Critique' && '⚠️ '}
                              {item.priority === 'Haute' && '↗ '}
                              {item.priority === 'Moyenne' && '– '}
                              {item.priority === 'Basse' && '↘ '}
                              {item.priority}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <p className="text-sm text-gray-800">{item.startDate}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <p className="text-sm text-gray-800">{item.endDate}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <span className="text-sm text-gray-700">{item.realDuration}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[item.statusColor]}`}
                        >
                          {item.finalStatus}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <p className="text-sm text-gray-700 max-w-xs">{item.remarks}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
