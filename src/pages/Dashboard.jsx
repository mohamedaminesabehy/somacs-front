import { useRef } from 'react'
import { Calendar, Clock, CheckCircle2, AlertCircle, Download, Plus } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import TaskTable from '../components/TaskTable'

export default function Dashboard() {
  const taskTableRef = useRef(null)

  const handleCreateTaskClick = () => {
    if (taskTableRef.current && taskTableRef.current.openCreateModal) {
      taskTableRef.current.openCreateModal()
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Gestion des tâches</h2>
          <p className="text-gray-600">Suivez et organisez toutes les tâches de votre équipe.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 justify-start md:justify-end">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-800 hover:bg-gray-50 transition-colors font-medium">
            <Download size={18} />
            Exporter
          </button>
          <button
            type="button"
            onClick={handleCreateTaskClick}
            className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-lg hover:bg-[#0042a3] transition-colors font-medium"
          >
            <Plus size={18} />
            Créer une tâche
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Calendar}
          title="Tâches du jour"
          value="12"
          subtitle="+3 depuis hier"
          color="blue"
        />
        <MetricCard
          icon={Clock}
          title="En cours"
          value="28"
          subtitle="8 prioritaires"
          color="orange"
        />
        <MetricCard
          icon={CheckCircle2}
          title="Terminées"
          value="156"
          subtitle="+12 cette semaine"
          color="green"
        />
        <MetricCard
          icon={AlertCircle}
          title="Bloquées"
          value="5"
          subtitle="Attention requise"
          color="red"
        />
      </div>

      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6">
          <h3 className="text-xl font-bold text-gray-800">Toutes les tâches</h3>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Rechercher une tâche..."
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
            />
            <select className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white">
              <option>Tous les employés</option>
            </select>
            <select className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white">
              <option>Tous les statuts</option>
            </select>
            <select className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white">
              <option>Toutes priorités</option>
            </select>
            <input
              type="date"
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
            />
          </div>
        </div>
        <TaskTable ref={taskTableRef} />
      </div>
    </div>
  )
}
