import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Calendar, MapPin,
  Building2, Wrench, ClipboardList, AlertTriangle, Link2,
  User, FileText, Hash, ChevronRight, Edit2, Loader2,
  CheckSquare, Flag, BarChart2, Phone, Zap,
} from 'lucide-react'
import { getMissionStore, updateMissionInStore, interventionsList, getStatusColor } from '../../data/missionsData'

const PRIORITY_CONFIG = {
  Critique: { label: 'Critique', bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700 border border-red-200',      dot: 'bg-red-500',    color: 'text-red-600' },
  Haute:    { label: 'Haute',    bar: 'bg-orange-500',  badge: 'bg-orange-100 text-orange-700 border border-orange-200', dot: 'bg-orange-500', color: 'text-orange-600' },
  Moyenne:  { label: 'Moyenne',  bar: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700 border border-blue-200',    dot: 'bg-blue-500',   color: 'text-blue-600' },
  Basse:    { label: 'Basse',    bar: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border border-slate-200', dot: 'bg-slate-400',  color: 'text-slate-500' },
}

const STATUS_STEPS = ['À faire', 'En cours', 'Terminée']

const STATUS_CONFIG = {
  'À faire':  { icon: ClipboardList, color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',    badge: 'bg-blue-50 text-blue-700 border border-blue-200' },
  'En cours': { icon: Loader2,       color: 'text-amber-600', bg: 'bg-amber-50',  border: 'border-amber-300',   badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
  'Terminée': { icon: CheckCircle2,  color: 'text-green-600', bg: 'bg-green-50',  border: 'border-green-200',   badge: 'bg-green-50 text-green-700 border border-green-200' },
  'Bloquée':  { icon: XCircle,       color: 'text-red-600',   bg: 'bg-red-50',    border: 'border-red-200',     badge: 'bg-red-50 text-red-700 border border-red-200' },
}

function InfoRow({ icon: Icon, label, value, mono, accent }) {
  if (!value) return null
  return (
    <div className="py-3.5 border-b border-slate-50 last:border-0">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
        <Icon size={11} className={`${accent || 'text-slate-400'}`} />
        {label}
      </p>
      <p className={`text-sm font-bold text-slate-800 ${mono ? 'font-mono tracking-wider' : ''}`}>{value}</p>
    </div>
  )
}

export default function MissionDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const mission = getMissionStore().find((m) => m.id === Number(id))

  const [status, setStatus] = useState(mission?.status || 'À faire')
  const [notes, setNotes]   = useState(mission?.notes || '')
  const [saved, setSaved]   = useState(false)

  if (!mission) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 bg-white rounded-3xl border-2 border-slate-200 flex items-center justify-center shadow-sm">
          <AlertTriangle size={36} className="text-slate-300" />
        </div>
        <p className="text-slate-500 font-black text-lg">Mission introuvable</p>
        <button
          onClick={() => navigate('/missions/my')}
          className="flex items-center gap-2 px-6 py-3 bg-[#0052CC] text-white rounded-xl text-sm font-black shadow-lg shadow-blue-200 hover:bg-[#0042a3] transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={3} /> Retour à mes missions
        </button>
      </div>
    )
  }

  const intervention = mission.interventionId
    ? interventionsList.find((i) => i.id === mission.interventionId)
    : null

  const priority   = PRIORITY_CONFIG[mission.priority] || PRIORITY_CONFIG['Moyenne']
  const statusCfg  = STATUS_CONFIG[status] || STATUS_CONFIG['À faire']
  const StatusIcon = statusCfg.icon

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus)
    updateMissionInStore({ ...mission, status: newStatus, statusColor: getStatusColor(newStatus) })
  }

  const handleSaveNotes = () => {
    updateMissionInStore({ ...mission, status, notes })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const progressPct =
    status === 'À faire'  ? 0   :
    status === 'En cours' ? 50  :
    status === 'Terminée' ? 100 : 0

  return (
    <div className="flex flex-col h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="bg-white border-b-2 border-slate-200 px-8 py-5 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate('/missions/my')}
            className="w-11 h-11 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-400 font-semibold">
                <span>Mes missions</span>
                <ChevronRight size={13} className="text-slate-300" />
                <span className="font-black text-slate-800 max-w-xs truncate">{mission.title}</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">
              Réf. <span className="font-mono font-black text-slate-500">MIS-{String(mission.id).padStart(4,'0')}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border-2 ${statusCfg.badge}`}>
            <StatusIcon size={12} className={status === 'En cours' ? 'animate-spin' : ''} />
            {status}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black ${priority.badge}`}>
            <span className={`w-2 h-2 rounded-full ${priority.dot}`} />
            {priority.label}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left (2/3) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero card */}
            <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm">
              <div className={`h-1.5 ${priority.bar}`} />
              <div className="p-7">
                <div className="pb-6 border-b-2 border-slate-50 mb-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      mission.type === 'Intervention' ? 'bg-[#0052CC] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {mission.type === 'Intervention'
                        ? <Wrench size={26} />
                        : <ClipboardList size={26} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {mission.type === 'Intervention' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg bg-[#0052CC]/10 text-[#0052CC] uppercase tracking-wider">
                            <Wrench size={9} /> SAV
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${priority.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                          {priority.label}
                        </span>
                      </div>
                      <h1 className="text-xl font-black text-slate-900 leading-tight">{mission.title}</h1>
                      <p className="text-sm text-slate-500 mt-1.5 leading-relaxed font-medium">{mission.description}</p>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                {status !== 'Bloquée' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Progression</p>
                      <span className={`text-sm font-black ${progressPct === 100 ? 'text-green-600' : 'text-[#0052CC]'}`}>{progressPct}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${progressPct === 100 ? 'bg-green-500' : 'bg-[#0052CC]'}`}
                        style={{ width: progressPct + '%' }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-300">
                      <span>À faire</span><span>En cours</span><span>Terminée</span>
                    </div>
                  </div>
                )}
                {status === 'Bloquée' && (
                  <div className="flex items-center gap-3 px-5 py-3.5 bg-red-50 border-2 border-red-200 rounded-xl">
                    <XCircle size={16} className="text-red-500 shrink-0" />
                    <p className="text-sm font-bold text-red-600">Mission bloquée — action requise avant de continuer.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Workflow stepper */}
            <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm">
              <div className="px-7 pt-6 pb-5 border-b-2 border-slate-50">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                  <BarChart2 className="text-[#0052CC]" size={22} />
                  Avancement de la mission
                </h2>
                <p className="text-sm text-slate-400 font-medium mt-0.5">Mettez à jour votre progression en temps réel</p>
              </div>
              <div className="p-7 space-y-7">
                {/* Step track */}
                <div className="flex items-start">
                  {STATUS_STEPS.map((s, i) => {
                    const done    = STATUS_STEPS.indexOf(status) > i
                    const current = status === s && status !== 'Bloquée'
                    return (
                      <div key={s} className="flex items-start flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300 ${
                            done    ? 'bg-[#0052CC] border-[#0052CC] text-white shadow-md shadow-blue-200' :
                            current ? 'bg-white border-[#0052CC] text-[#0052CC] shadow-lg' :
                                      'bg-white border-slate-200 text-slate-300'
                          }`}>
                            {done ? <CheckCircle2 size={18} /> : i + 1}
                          </div>
                          <span className={`mt-2 text-xs font-black text-center ${
                            current ? 'text-[#0052CC]' : done ? 'text-slate-600' : 'text-slate-300'
                          }`}>{s}</span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mt-5 mx-2 rounded-full transition-all duration-500 ${done ? 'bg-[#0052CC]' : 'bg-slate-100'}`} />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Status buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['À faire', 'En cours', 'Terminée', 'Bloquée'].map((s) => {
                    const cfg    = STATUS_CONFIG[s]
                    const Icon   = cfg.icon
                    const active = status === s
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleStatusChange(s)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-xs font-black transition-all duration-200 ${
                          active
                            ? cfg.bg + ' ' + cfg.border + ' ' + cfg.color + ' shadow-sm'
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:shadow-sm'
                        }`}
                      >
                        <Icon size={18} className={s === 'En cours' && active ? 'animate-spin' : ''} />
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm">
              <div className="px-7 pt-6 pb-5 border-b-2 border-slate-50">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                  <Edit2 className="text-[#0052CC]" size={20} />
                  Notes de terrain
                </h2>
                <p className="text-sm text-slate-400 font-medium mt-0.5">Observations, matériels utilisés, contacts sur place</p>
              </div>
              <div className="p-7">
                <div className="space-y-3 group">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                    <span className="w-2 h-2 bg-[#0052CC] rounded-full"></span>
                    Compte-rendu d'intervention
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={5}
                    placeholder="Ex : Prévoir kit joints HYD-4400, contacter M. Bernard à l'accueil..."
                    className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all resize-none shadow-sm hover:border-slate-300 leading-relaxed"
                  />
                </div>

                {/* Info tip */}
                <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#0052CC] text-white rounded-lg flex items-center justify-center shrink-0">
                    <Zap size={15} />
                  </div>
                  <p className="text-xs font-bold text-blue-800 leading-relaxed">
                    Ces notes seront visible par votre chef d'équipe et attachées au dossier d'intervention lié.
                  </p>
                </div>

                <div className="flex justify-end mt-5">
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className={`flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 ${
                      saved
                        ? 'bg-green-500 text-white shadow-green-200'
                        : 'bg-[#0052CC] text-white hover:bg-[#0042a3] shadow-blue-200 hover:shadow-lg'
                    }`}
                  >
                    {saved ? <><CheckCircle2 size={15} strokeWidth={3} /> Enregistré</> : <><FileText size={15} /> Enregistrer les notes</>}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* ── Right (1/3) ── */}
          <div className="space-y-5">

            {/* Info card */}
            <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm">
              <div className="px-6 pt-6 pb-4 border-b-2 border-slate-50">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Hash size={15} className="text-[#0052CC]" /> Fiche mission
                </h3>
              </div>
              <div className="px-6 py-2">
                <InfoRow icon={Hash}      label="Référence"      value={'MIS-' + String(mission.id).padStart(4,'0')} mono accent="text-[#0052CC]" />
                <InfoRow icon={User}      label="Technicien"     value={mission.employee}    accent="text-slate-400" />
                <InfoRow icon={Flag}      label="Priorité"       value={mission.priority}    accent={priority.color} />
                <InfoRow icon={Calendar}  label="Date prévue"    value={mission.dueDate}     accent="text-slate-400" />
                <InfoRow icon={Clock}     label="Heure"          value={mission.dueTime}     accent="text-slate-400" />
                <InfoRow icon={Clock}     label="Durée estimée" value={mission.duration}    accent="text-slate-400" />
                <InfoRow icon={Building2} label="Site"           value={mission.site}        accent="text-slate-400" />
                <InfoRow icon={MapPin}    label="Adresse"        value={mission.address}     accent="text-slate-400" />
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm">
              <div className="px-6 pt-6 pb-4 border-b-2 border-slate-50">
                <h3 className="text-sm font-black text-slate-900">Actions rapides</h3>
              </div>
              <div className="p-5 space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleStatusChange('En cours')}
                  disabled={status === 'En cours' || status === 'Terminée'}
                  className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl bg-[#0052CC] text-white text-sm font-black uppercase tracking-wide hover:bg-[#0042a3] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-lg shadow-blue-100 active:scale-95"
                >
                  <Loader2 size={16} /> Démarrer la mission
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Terminée')}
                  disabled={status === 'Terminée'}
                  className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl bg-green-500 text-white text-sm font-black uppercase tracking-wide hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-lg shadow-green-100 active:scale-95"
                >
                  <CheckSquare size={16} /> Marquer terminée
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Bloquée')}
                  disabled={status === 'Bloquée' || status === 'Terminée'}
                  className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl bg-white border-2 border-red-200 text-red-600 text-sm font-black uppercase tracking-wide hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                >
                  <XCircle size={16} /> Signaler un blocage
                </button>
              </div>
            </div>

            {/* Linked intervention */}
            {intervention && (
              <div className="bg-white rounded-2xl border-2 border-[#0052CC]/20 overflow-hidden shadow-sm">
                <div className="px-6 pt-6 pb-4 border-b-2 border-blue-50 flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#0052CC] rounded-lg flex items-center justify-center">
                    <Link2 size={13} className="text-white" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900">Dossier SAV lié</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-[#0052CC] text-sm">{intervention.id}</span>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
                      intervention.status === 'PENDING'     ? 'bg-amber-50 text-amber-700 border border-amber-200'   :
                      intervention.status === 'ASSIGNED'    ? 'bg-blue-50 text-blue-700 border border-blue-200'      :
                      intervention.status === 'IN_PROGRESS' ? 'bg-orange-50 text-orange-700 border border-orange-200':
                      intervention.status === 'TESTING'     ? 'bg-purple-50 text-purple-700 border border-purple-200':
                                                              'bg-green-50 text-green-700 border border-green-200'
                    }`}>{intervention.statusLabel}</span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <User size={12} className="text-slate-300 shrink-0" /><span className="font-bold">{intervention.client}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <Wrench size={12} className="text-slate-300 shrink-0" /><span className="font-medium">{intervention.machine}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <Phone size={12} className="text-slate-300 shrink-0" /><span className="font-medium">{intervention.phone}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-500">
                      <MapPin size={12} className="text-slate-300 shrink-0" /><span className="font-medium">{intervention.address}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-400 italic leading-relaxed">"{intervention.request}"</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/interventions/' + intervention.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-[#0052CC] text-[#0052CC] text-xs font-black uppercase tracking-wider hover:bg-[#0052CC] hover:text-white transition-all active:scale-95"
                  >
                    Ouvrir le dossier <ChevronRight size={13} strokeWidth={3} />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
