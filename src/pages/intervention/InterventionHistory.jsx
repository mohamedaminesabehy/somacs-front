import React, { useState, useMemo } from 'react'
import { 
  History, 
  Search, 
  Filter, 
  ChevronRight, 
  AlertTriangle, 
  Wrench, 
  CheckCircle2, 
  Clock,
  ArrowRight
} from 'lucide-react'

const mockHistory = [
  {
    id: 'H-2024-001',
    machine: 'Pont Élévateur 4T',
    serial: 'SN-99184688',
    client: 'Garage Central',
    lastFailure: 'Fuite hydraulique vérin gauche',
    date: '15/02/2024',
    frequency: 3,
    status: 'RÉSOLU',
    severity: 'High'
  },
  {
    id: 'H-2024-002',
    machine: 'Compresseur Industriel',
    serial: 'SN-8827110',
    client: 'Usine MetalPlus',
    lastFailure: 'Surchauffe moteur',
    date: '10/01/2024',
    frequency: 1,
    status: 'SOUS SURVEILLANCE',
    severity: 'Medium'
  },
  {
    id: 'H-2024-003',
    machine: 'Chariot Élévateur',
    serial: 'SN-7736225',
    client: 'Logistique Express',
    lastFailure: 'Problème batterie / charge',
    date: '05/03/2024',
    frequency: 5,
    status: 'RÉCURRENT',
    severity: 'Critical'
  }
]

export default function InterventionHistory() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredHistory = useMemo(() => {
    return mockHistory.filter(item => 
      item.machine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Historique des Pannes & Récurrences</h1>
        <p className="text-slate-500 mt-1">Analyse des pannes passées par équipement et par client.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Pannes Récurrentes</p>
            <p className="text-2xl font-bold text-slate-900">12</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            <Wrench size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Interventions ce mois</p>
            <p className="text-2xl font-bold text-slate-900">45</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Taux de résolution</p>
            <p className="text-2xl font-bold text-slate-900">94%</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher une machine, un numéro de série..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-slate-600 font-medium">
          <Filter size={18} />
          <span>Filtres avancés</span>
        </button>
      </div>

      {/* History List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Équipement</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client & Site</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dernière Panne</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Fréquence</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{item.machine}</span>
                      <span className="text-xs text-slate-500 font-mono">{item.serial}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-700">{item.client}</div>
                    <div className="text-xs text-slate-400">Siège Social</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600 italic">"{item.lastFailure}"</div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock size={12} /> {item.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                      item.frequency > 3 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.frequency}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.severity === 'Critical' ? 'bg-red-100 text-red-700' : 
                      item.severity === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-slate-200 rounded-lg transition text-[#0052CC] font-bold text-sm flex items-center gap-1 ml-auto">
                      Détails <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
