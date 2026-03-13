import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Calendar, MapPin,
  Building2, Wrench, ClipboardList, AlertTriangle, Link2,
  User, FileText, Hash, ChevronRight, Edit2, Loader2,
  CheckSquare, Flag, BarChart2, Phone, Zap, Info,
  ExternalLink, MessageSquare, History, Save, Trash2,
  MoreVertical, Share2, Printer, Paperclip, File, Image, X,
  Download, Eye, Plus
} from 'lucide-react'
import { getMissionStore, updateMissionInStore, interventionsList, getStatusColor } from '../../data/missionsData'

const PRIORITY_CONFIG = {
  Critique: { label: 'Critique', bar: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-100',      dot: 'bg-red-500',    color: 'text-red-600' },
  Haute:    { label: 'Haute',    bar: 'bg-orange-500',  badge: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-500', color: 'text-orange-600' },
  Moyenne:  { label: 'Moyenne',  bar: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-100',    dot: 'bg-blue-500',   color: 'text-blue-600' },
  Basse:    { label: 'Basse',    bar: 'bg-slate-400',   badge: 'bg-slate-50 text-slate-600 border-slate-100', dot: 'bg-slate-400',  color: 'text-slate-500' },
}

const STATUS_STEPS = ['À faire', 'En cours', 'Terminée']

const STATUS_CONFIG = {
  'À faire':  { icon: ClipboardList, color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',    badge: 'bg-blue-50 text-blue-700 border border-blue-200' },
  'En cours': { icon: Loader2,       color: 'text-amber-600', bg: 'bg-amber-50',  border: 'border-amber-300',   badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
  'Terminée': { icon: CheckCircle2,  color: 'text-green-600', bg: 'bg-green-50',  border: 'border-green-200',   badge: 'bg-green-50 text-green-700 border border-green-200' },
  'Bloquée':  { icon: XCircle,       color: 'text-red-600',   bg: 'bg-red-50',    border: 'border-red-200',     badge: 'bg-red-50 text-red-700 border border-red-200' },
}

function SectionHeader({ icon: Icon, title, children }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
          <Icon size={18} />
        </div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function InfoItem({ label, value, icon: Icon, colorClass = "text-slate-500" }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className={`mt-0.5 ${colorClass}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-slate-700">{value || 'Non spécifié'}</p>
      </div>
    </div>
  )
}

export default function MissionDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const mission = getMissionStore().find((m) => m.id === Number(id))

  const [status, setStatus] = useState(mission?.status || 'À faire')
  const [notes, setNotes]   = useState(mission?.notes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveToast, setShowSaveToast] = useState(false)
  
  // Mock attachments state
  const [attachments, setAttachments] = useState([
    { id: 1, name: 'Plan_Technique.pdf', type: 'pdf', size: '2.4 MB', date: '08/03/2026' },
    { id: 2, name: 'Photo_Site_Entree.jpg', type: 'image', size: '1.8 MB', date: '09/03/2026' }
  ])

  useEffect(() => {
    if (mission) {
      setStatus(mission.status)
      setNotes(mission.notes || '')
    }
  }, [mission])

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

  const handleSave = () => {
    setIsSaving(true)
    updateMissionInStore({ ...mission, status, notes })
    setTimeout(() => {
      setIsSaving(false)
      setShowSaveToast(true)
      setTimeout(() => setShowSaveToast(false), 3000)
    }, 600)
  }

  const progressPct =
    status === 'À faire'  ? 10  :
    status === 'En cours' ? 50  :
    status === 'Terminée' ? 100 : 0

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/missions/my')}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <button onClick={() => navigate('/missions/my')} className="hover:text-[#0052CC]">Missions</button>
                <ChevronRight size={10} />
                <span className="text-slate-500">Détails</span>
              </div>
              <h1 className="text-sm font-black text-slate-900 leading-none mt-1">
                {mission.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 mr-4">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${priority.badge}`}>
                {priority.label}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${statusCfg.badge}`}>
                {status}
              </span>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Mission Content (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Mission Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      mission.type === 'Intervention' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {mission.type === 'Intervention' ? <Wrench size={24} /> : <ClipboardList size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                          {mission.type}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          ID: MIS-{String(mission.id).padStart(4,'0')}
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900">{mission.title}</h2>
                    </div>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none mb-8">
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {mission.description}
                  </p>
                </div>

                {/* Progress Visual */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Progression globale</span>
                    <span className="text-xs font-black text-[#0052CC]">{progressPct}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#0052CC] transition-all duration-500 ease-out"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-3">
                    {STATUS_STEPS.map((step, idx) => (
                      <div key={step} className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mb-1 ${
                          STATUS_STEPS.indexOf(status) >= idx ? 'bg-[#0052CC]' : 'bg-slate-300'
                        }`} />
                        <span className={`text-[10px] font-bold ${
                          status === step ? 'text-[#0052CC]' : 'text-slate-400'
                        }`}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow / Status Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <SectionHeader icon={Zap} title="Actions & État" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {['À faire', 'En cours', 'Terminée', 'Bloquée'].map((s) => {
                    const cfg = STATUS_CONFIG[s]
                    const Icon = cfg.icon
                    const isActive = status === s
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          isActive 
                            ? `${cfg.border} ${cfg.bg} ${cfg.color} scale-[1.02] shadow-sm` 
                            : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200 hover:bg-white hover:text-slate-600'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-white shadow-sm' : 'bg-slate-200/50'}`}>
                          <Icon size={20} className={isActive && s === 'En cours' ? 'animate-spin' : ''} />
                        </div>
                        <span className="text-xs font-black">{s}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <SectionHeader icon={FileText} title="Notes & Observations" />
                <div className="relative mt-4">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ajoutez vos remarques, observations ou détails techniques ici..."
                    className="w-full h-40 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-[#0052CC]/10 focus:border-[#0052CC] outline-none transition-all resize-none"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">
                    <Edit2 size={10} />
                    Modification en direct
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Linked Intervention (Moved to first position) */}
            {intervention && (
              <div className="bg-white rounded-2xl border-2 border-blue-600/10 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-12 -mt-12 opacity-50" />
                <div className="p-6 relative">
                  <SectionHeader icon={Wrench} title="Intervention liée">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-[#0052CC] text-[10px] font-black uppercase tracking-wider">
                      SAV
                    </span>
                  </SectionHeader>
                  
                  <div className="space-y-4 mt-2">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Référence</p>
                        <p className="text-sm font-black text-slate-900">{intervention.id}</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-blue-600">
                        <Hash size={18} />
                      </div>
                    </div>

                    <div className="flex items-start gap-3 px-1">
                      <div className="mt-1 text-slate-400">
                        <Zap size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Machine</p>
                        <p className="text-sm font-bold text-slate-700">{intervention.machine}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate(`/interventions/${intervention.id}`)}
                      className="w-full mt-2 py-3 bg-[#0052CC] text-white rounded-xl text-xs font-black hover:bg-[#0042a3] transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2 group"
                    >
                      Ouvrir le dossier
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <SectionHeader icon={Info} title="Détails" />
                <div className="mt-2">
                  <InfoItem label="Date d'échéance" value={mission.dueDate} icon={Calendar} />
                  <InfoItem label="Heure prévue" value={mission.dueTime} icon={Clock} />
                  <InfoItem label="Durée estimée" value={mission.duration} icon={Zap} colorClass="text-amber-500" />
                  <InfoItem label="Assigné à" value={mission.employee} icon={User} colorClass="text-blue-500" />
                </div>
              </div>
            </div>

            {/* Location & Primary Document Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <SectionHeader icon={MapPin} title="Lieu & Document">
                  <button className="text-[10px] font-black text-[#0052CC] flex items-center gap-1 hover:underline">
                    OUVRIR MAPS <ExternalLink size={10} />
                  </button>
                </SectionHeader>
                <div className="mt-2">
                  <div className="p-3 bg-slate-50 rounded-xl mb-4 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-bold mb-1">
                      <Building2 size={14} className="text-slate-400" />
                      {mission.site}
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed pl-5">
                      {mission.address || 'Adresse non renseignée'}
                    </p>
                    {intervention?.phone && (
                      <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-600 font-bold text-[11px]">
                          <Phone size={12} className="text-blue-500" />
                          {intervention.phone}
                        </div>
                        <a 
                          href={`tel:${intervention.phone}`}
                          className="px-3 py-1 bg-white border border-slate-200 text-[10px] font-black text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          APPELER
                        </a>
                      </div>
                    )}
                  </div>
                  {/* Mission Document Preview (Replacing Map) */}
                  {attachments.length > 0 ? (
                    <div className="aspect-video bg-slate-100 rounded-xl border border-slate-200 overflow-hidden group relative cursor-pointer shadow-sm">
                      {attachments[0].type === 'image' ? (
                        <div className="w-full h-full relative">
                          <img 
                            src={`https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=1470&auto=format&fit=crop`} // Technical photo placeholder
                            alt={attachments[0].name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-[9px] font-black text-blue-600 shadow-sm">
                            PHOTO TECHNIQUE
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500 group-hover:bg-red-100 transition-colors">
                          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-2">
                            <File size={24} strokeWidth={2} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest px-4 text-center truncate w-full">
                            {attachments[0].name}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button className="p-2 bg-white rounded-lg text-slate-900 shadow-xl hover:scale-110 transition-transform">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 bg-white rounded-lg text-slate-900 shadow-xl hover:scale-110 transition-transform">
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                      <Paperclip size={24} className="text-slate-300 mb-2" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">Aucun document affecté</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Sticky Action Bar (SaaS Style) ── */}
      <footer className="sticky bottom-0 z-40 bg-white border-t border-slate-200 py-4 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="hidden md:flex items-center gap-3 text-slate-400">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
              <Info size={14} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Dernière modification : Aujourd'hui</span>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => navigate('/missions/my')}
              className="flex-1 md:flex-none px-6 py-3 rounded-xl text-[11px] font-black text-slate-500 uppercase tracking-wider hover:bg-slate-50 transition-all border-2 border-transparent"
            >
              Annuler les modifs
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-3.5 bg-[#0052CC] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-[#0042a3] hover:shadow-blue-300 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Enregistrer les changements
            </button>
          </div>
        </div>
      </footer>

      {/* Save Toast */}
      {showSaveToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
            <span className="text-sm font-bold">Modifications enregistrées avec succès</span>
          </div>
        </div>
      )}
    </div>
  )
}
