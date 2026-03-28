import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  ClipboardList,
  Wrench,
  CheckCircle2,
  Building2,
  Phone,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Link2,
  AlertCircle,
  Hourglass,
  UserCheck,
  Users,
  Paperclip,
  Zap,
  Settings,
  Hash,
  ArrowRight,
  Target,
  Send
} from 'lucide-react'
import { apiFetch } from '../../api/apiClient'

function getAvatarFromName(name) {
  if (!name) return ''
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

function getStatusLabel(status) {
  if (status === 'PENDING') return 'En attente'
  if (status === 'ASSIGNED') return 'Affectée'
  if (status === 'IN_PROGRESS') return 'En cours'
  if (status === 'TESTING') return 'En test'
  if (status === 'CLOSED') return 'Clôturé'
  return status || ''
}

function formatClientAddress(client) {
  if (!client) return ''
  if (client.address) return String(client.address)
  const city = client.city ? String(client.city).trim() : ''
  const zone = client.zone ? String(client.zone).trim() : ''
  if (!city && !zone) return ''
  return zone ? `${city}, ${zone}` : city
}

// ── Steps definition ──────────────────────────────────────────────────────────
const steps = [
  { id: 1, title: 'Type',        description: 'Nature de la mission', icon: Target },
  { id: 2, title: 'Details',     description: 'Contenu & lieu',       icon: ClipboardList },
  { id: 3, title: 'Affectation', description: 'Technicien & delai',   icon: Users },
  { id: 4, title: 'Validation',  description: 'Confirmation',          icon: CheckCircle2 },
]

const statusColors = {
  PENDING:     'bg-amber-50 text-amber-700 border border-amber-200',
  ASSIGNED:    'bg-blue-50 text-blue-700 border border-blue-200',
  IN_PROGRESS: 'bg-orange-50 text-orange-700 border border-orange-200',
  TESTING:     'bg-purple-50 text-purple-700 border border-purple-200',
  CLOSED:      'bg-green-50 text-green-700 border border-green-200',
}

export default function AssignMission() {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentStep, setCurrentStep] = useState(1)
  const [interventionsList, setInterventionsList] = useState([])
  const [employeeList, setEmployeeList] = useState([])
  const [attachments, setAttachments] = useState([])

  // Step 1 — Type
  const [missionType, setMissionType] = useState('') // 'Normal' | 'Intervention'

  // Step 2 — Details
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    site: '',
    address: '',
    interventionId: '',
  })

  // Step 3 — Affectation
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [priority, setPriority] = useState('Moyenne')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  useEffect(() => {
    ;(async () => {
      try {
        const response = await apiFetch('/interventions', { auth: true })
        if (!response.ok) return
        const data = await response.json()
        const normalized = Array.isArray(data)
          ? data.map((i) => ({
              id: i.id,
              client: i.client || i.clientName || '',
              machine: i.machine || i.machineType || i.machineEntity?.designation || '',
              type: i.type || i.interventionType || '',
              status: i.status || 'PENDING',
              statusLabel: getStatusLabel(i.status),
              date: i.date || i.interventionDate || '',
              phone: i.phone || i.clientPhone || i.clientEntity?.phone || '',
              clientCode: i.clientCode || i.clientEntity?.code || '',
              site: i.siteName || i.site || i.machineEntity?.site || '',
              address: i.clientAddress || i.address || formatClientAddress(i.clientEntity) || '',
              request: i.request || i.problemDescription || '',
              assignedTo: i.assignedTo || i.assignee || i.technicianName || null,
            }))
          : []
        setInterventionsList(normalized)
      } catch {}
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const response = await apiFetch('/users')
        if (!response.ok) return
        const data = await response.json()
        const users = Array.isArray(data) ? data : []
        const normalized = users
          .filter((u) => u && u.isActive !== false)
          .map((u) => ({
            id: u.id,
            name: u.name,
            role: u.role,
            avatar: getAvatarFromName(u.name),
            active: 0,
          }))
        setEmployeeList(normalized)
      } catch {}
    })()
  }, [])

  const linkableInterventions = useMemo(
    () => interventionsList.filter((i) => i.status === 'PENDING' || i.status === 'ASSIGNED'),
    [interventionsList],
  )

  const selectedIntervention = linkableInterventions.find(
    (i) => i.id === formData.interventionId
  )
  const selectedEmployeeObj = employeeList.find((e) => e.name === selectedEmployee)
  const prefillDoneRef = useRef(false)
  const prefillInterventionId = location.state?.prefillInterventionId || ''

  useEffect(() => {
    if (prefillDoneRef.current) return
    if (!prefillInterventionId) return

    prefillDoneRef.current = true
    setMissionType('Intervention')
    setCurrentStep(2)
    setFormData((prev) => ({
      ...prev,
      interventionId: prefillInterventionId,
      title: prev.title || `Intervention SAV — ${prefillInterventionId}`,
      description: '',
    }))
  }, [prefillInterventionId])

  useEffect(() => {
    if (missionType !== 'Intervention') return
    if (!selectedIntervention) return
    setFormData((prev) => ({
      ...prev,
      site: selectedIntervention.site || selectedIntervention.client || '',
      address: selectedIntervention.address || '',
    }))
  }, [missionType, selectedIntervention])

  const canGoNext = () => {
    if (currentStep === 1) return missionType !== ''
    if (currentStep === 2) {
      if (missionType === 'Normal') return formData.title.trim() !== '' && formData.description.trim() !== ''
      if (missionType === 'Intervention') return formData.interventionId !== '' && formData.title.trim() !== ''
    }
    if (currentStep === 3) return selectedEmployee !== '' && dueDate !== ''
    return true
  }

  const nextStep = () => {
    if (canGoNext()) setCurrentStep((prev) => Math.min(prev + 1, steps.length))
  }
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

  const handlePickFiles = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const maxBytes = 10 * 1024 * 1024
    const allowed = files.filter((f) => f.size <= maxBytes)
    if (allowed.length !== files.length) {
      alert('Certains fichiers dépassent 10MB et ont été ignorés.')
    }
    setAttachments((prev) => {
      const next = [...prev, ...allowed].slice(0, 10)
      const uniq = new Map()
      for (const f of next) {
        const key = `${f.name}_${f.size}_${f.lastModified}`
        if (!uniq.has(key)) uniq.set(key, f)
      }
      return Array.from(uniq.values())
    })
    e.target.value = ''
  }

  const removeAttachment = (file) => {
    setAttachments((prev) =>
      prev.filter(
        (f) => !(f.name === file.name && f.size === file.size && f.lastModified === file.lastModified),
      ),
    )
  }

  const handleSubmit = async () => {
    const empName = selectedEmployee
    const missionTitle = formData.title
    try {
      const employeeUserId = selectedEmployeeObj?.id || null
      if (!employeeUserId) {
        alert('Veuillez sélectionner un technicien valide.')
        return
      }
      const missionPayload = {
        title: formData.title,
        description:
          missionType === 'Intervention'
            ? formData.description
            : formData.description,
        employee: empName,
        employeeUserId,
        priority,
        status: 'À faire',
        dueDate: dueDate || "Aujourd'hui",
        dueTime: dueTime || null,
        type: missionType,
        interventionId: missionType === 'Intervention' ? formData.interventionId : null,
        site: formData.site,
        address: formData.address,
      }

      const response = await apiFetch('/missions', {
        method: 'POST',
        body: missionPayload,
        auth: true,
      })
      if (!response.ok) {
        alert('Erreur lors de la création de la mission.')
        return
      }
      const createdMission = await response.json().catch(() => null)

      if (missionType === 'Intervention' && formData.interventionId) {
        await apiFetch(`/interventions/${formData.interventionId}`, {
          method: 'PATCH',
          body: { status: 'ASSIGNED', assignedTo: empName },
          auth: true,
        })
      }

      if (createdMission?.id && attachments.length > 0) {
        const form = new FormData()
        for (const file of attachments) {
          form.append('files', file)
        }
        const uploadRes = await apiFetch(`/missions/${createdMission.id}/attachments`, {
          method: 'POST',
          body: form,
          auth: true,
        })
        if (!uploadRes.ok) {
          alert('Mission créée, mais erreur lors de l’upload des fichiers.')
          navigate('/missions')
          return
        }
      }

      navigate('/missions?toast=assigned', { state: { toast: 'assigned' } })
    } catch (error) {
      alert('Impossible de joindre le serveur.')
    }
  }

  // ── Priority config ───────────────────────────────────────────────────────
  const priorityConfig = {
    Critique: { color: 'bg-red-50 border-red-400 text-red-700',    dot: 'bg-red-500',    label: 'Critique' },
    Haute:    { color: 'bg-orange-50 border-orange-400 text-orange-700', dot: 'bg-orange-500', label: 'Haute' },
    Moyenne:  { color: 'bg-blue-50 border-blue-400 text-blue-700', dot: 'bg-blue-500',   label: 'Moyenne' },
    Basse:    { color: 'bg-slate-50 border-slate-300 text-slate-600', dot: 'bg-slate-400', label: 'Basse' },
  }

  // ── Render step content ───────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      // ─────────────────────────────────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="pb-4 sm:pb-6 border-b-2 border-slate-100">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                <Target className="text-[#0052CC]" size={24} />
                Choisissez le type de mission
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Selectionnez si vous affectez une mission interne ou une intervention SAV liee a un dossier client.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Normal */}
              <button
                type="button"
                onClick={() => setMissionType('Normal')}
                className={`group relative flex flex-col items-start gap-4 sm:gap-5 p-5 sm:p-8 rounded-3xl border-2 text-left transition-all duration-300 ${
                  missionType === 'Normal'
                    ? 'border-[#0052CC] bg-[#0052CC]/5 shadow-xl shadow-blue-100'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all ${
                  missionType === 'Normal' ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                }`}>
                  <ClipboardList size={24} className="sm:hidden" />
                  <ClipboardList size={32} className="hidden sm:block" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">Mission Normale</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Tache interne : maintenance preventive, inventaire, installation, formation ou rapport operationnel.
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['Maintenance', 'Inventaire', 'Formation', 'Rapport'].map((tag) => (
                    <span key={tag} className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg tracking-wider ${
                      missionType === 'Normal' ? 'bg-[#0052CC]/10 text-[#0052CC]' : 'bg-slate-100 text-slate-400'
                    }`}>{tag}</span>
                  ))}
                </div>
                {missionType === 'Normal' && (
                  <div className="absolute top-5 right-5 w-8 h-8 bg-[#0052CC] rounded-full flex items-center justify-center shadow-lg">
                    <Check size={16} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </button>

              {/* Intervention SAV */}
              <button
                type="button"
                onClick={() => setMissionType('Intervention')}
                className={`group relative flex flex-col items-start gap-4 sm:gap-5 p-5 sm:p-8 rounded-3xl border-2 text-left transition-all duration-300 ${
                  missionType === 'Intervention'
                    ? 'border-[#0052CC] bg-[#0052CC]/5 shadow-xl shadow-blue-100'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all ${
                  missionType === 'Intervention' ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                }`}>
                  <Wrench size={24} className="sm:hidden" />
                  <Wrench size={32} className="hidden sm:block" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">Intervention SAV</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Liee a un dossier d'intervention existant. Affecte automatiquement un technicien au dossier client.
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['SAV', 'Reparation', 'Garantie', 'Installation'].map((tag) => (
                    <span key={tag} className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg tracking-wider ${
                      missionType === 'Intervention' ? 'bg-[#0052CC]/10 text-[#0052CC]' : 'bg-slate-100 text-slate-400'
                    }`}>{tag}</span>
                  ))}
                </div>
                {missionType === 'Intervention' && (
                  <div className="absolute top-5 right-5 w-8 h-8 bg-[#0052CC] rounded-full flex items-center justify-center shadow-lg">
                    <Check size={16} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            </div>

            {/* Info banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Zap size={20} className="text-amber-500 fill-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 mb-1">Comment ca fonctionne ?</p>
                <ul className="text-xs font-medium text-slate-500 space-y-1 list-none">
                  <li className="flex items-center gap-2"><ArrowRight size={12} className="text-[#0052CC]" /> <strong>Mission Normale</strong> — tache libre affectee directement a un technicien.</li>
                  <li className="flex items-center gap-2"><ArrowRight size={12} className="text-[#0052CC]" /> <strong>Intervention SAV</strong> — lie la mission a un dossier. Le statut du dossier passe automatiquement a "Affectee".</li>
                </ul>
              </div>
            </div>
          </div>
        )

      // ─────────────────────────────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="pb-4 sm:pb-6 border-b-2 border-slate-100">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                {missionType === 'Normal'
                  ? <><ClipboardList className="text-[#0052CC]" size={24} /> Details de la mission</>
                  : <><Wrench className="text-[#0052CC]" size={24} /> Details de l'intervention SAV</>
                }
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {missionType === 'Normal'
                  ? 'Renseignez le contenu, le site et les informations operationnelles.'
                  : "Selectionnez le dossier d'intervention a lier et precisez la tache."}
              </p>
            </div>

            {/* ── INTERVENTION SAV: dossier selector ── */}
            {missionType === 'Intervention' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <Link2 size={14} className="text-[#0052CC]" />
                    Lier a un dossier d'intervention
                  </label>
                  <select
                    name="interventionId"
                    value={formData.interventionId}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-xl focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all font-semibold text-slate-700 appearance-none cursor-pointer shadow-sm hover:border-slate-300"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  >
                    <option value="">-- Selectionner un dossier --</option>
                    <optgroup label="En attente (non assignees)">
                      {linkableInterventions.filter((i) => i.status === 'PENDING').map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.id} — {inv.client} — {inv.machine}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Affectees (deja assignees)">
                      {linkableInterventions.filter((i) => i.status === 'ASSIGNED').map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.id} — {inv.client} — {inv.machine} ({inv.assignedTo})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Intervention details card */}
                {selectedIntervention && (
                  <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border-2 border-blue-100 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-[#0052CC] bg-blue-100 px-3 py-1.5 rounded-xl">
                          {selectedIntervention.id}
                        </span>
                        <span className="text-xs font-bold text-slate-500">{selectedIntervention.type}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${statusColors[selectedIntervention.status] || ''}`}>
                        {selectedIntervention.status === 'PENDING' && <Hourglass size={12} />}
                        {selectedIntervention.status === 'ASSIGNED' && <UserCheck size={12} />}
                        {selectedIntervention.statusLabel}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Client</p>
                        <p className="text-sm font-bold text-slate-900">{selectedIntervention.client}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{selectedIntervention.clientCode}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Equipement</p>
                        <p className="text-sm font-bold text-slate-900">{selectedIntervention.machine}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Telephone</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                          <Phone size={13} className="text-blue-300" />
                          {selectedIntervention.phone}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Site</p>
                        <p className="text-sm font-medium text-slate-700">{selectedIntervention.site || '—'}</p>
                        <p className="text-xs text-slate-600 mt-1 break-words">{selectedIntervention.address || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Date creation</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                          <Calendar size={13} className="text-blue-300" />
                          {selectedIntervention.date}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Demande / Probleme</p>
                        <p className="text-sm text-slate-700 bg-white/60 p-3 rounded-xl border border-blue-50 italic leading-relaxed">
                          "{selectedIntervention.request}"
                        </p>
                      </div>
                      {selectedIntervention.assignedTo && (
                        <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0052CC] to-blue-700 text-white flex items-center justify-center text-[10px] font-black">
                            {selectedIntervention.assignedTo.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase">Deja affectee a</p>
                            <p className="text-xs font-bold text-slate-700">{selectedIntervention.assignedTo}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── COMMON fields ── */}
            <div className="space-y-6">
              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                  <span className="w-2 h-2 bg-[#0052CC] rounded-full"></span>
                  {missionType === 'Normal' ? 'Titre de la mission' : 'Titre de la sous-mission SAV'}
                </label>
                <div className="relative">
                  <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={20} />
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder={missionType === 'Normal' ? 'Ex: Maintenance preventive groupe electrogene...' : 'Ex: Remplacement verin hydraulique...'}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-slate-800 font-semibold shadow-sm hover:border-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                  <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                  Description / Instructions techniques
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Decrivez precisement les actions a realiser, les outils necessaires, les consignes de securite..."
                  className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-xl focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-slate-800 font-medium resize-none leading-relaxed shadow-sm hover:border-slate-300"
                />
              </div>

              {/* Site fields */}
              {(missionType === 'Normal' || missionType === 'Intervention') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 group">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                      <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                      Site
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={20} />
                      <input
                        type="text"
                        name="site"
                        value={formData.site}
                        onChange={handleChange}
                        placeholder="Nom du site / client"
                        className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-slate-800 font-semibold shadow-sm hover:border-slate-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-3 group">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                      <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                      Adresse
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={20} />
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Adresse complete"
                        className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-slate-800 font-semibold shadow-sm hover:border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pièces jointes */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-[#0052CC] hover:bg-blue-50/30 transition-all cursor-pointer group bg-slate-50/30">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
                  className="hidden"
                  id="mission-attachments"
                  onChange={handlePickFiles}
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 group-hover:text-[#0052CC] transition-colors">
                    <Paperclip size={24} />
                  </div>
                  <label
                    htmlFor="mission-attachments"
                    className="text-sm font-bold text-slate-500 group-hover:text-[#0052CC] transition-colors cursor-pointer"
                  >
                    Ajouter des pieces jointes
                  </label>
                  <p className="text-xs text-slate-400">PDF, JPG, PNG — Max 10MB</p>
                </div>
                {attachments.length > 0 && (
                  <div className="mt-4 w-full max-w-md mx-auto text-left space-y-2">
                    {attachments.map((file) => (
                      <div
                        key={`${file.name}_${file.size}_${file.lastModified}`}
                        className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-700 truncate">{file.name}</p>
                          <p className="text-[10px] font-bold text-slate-400">
                            {Math.ceil(file.size / 1024)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(file)}
                          className="text-[10px] font-black text-red-600 hover:text-red-700"
                        >
                          Retirer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      // ─────────────────────────────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="pb-4 sm:pb-6 border-b-2 border-slate-100">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                <Users className="text-[#0052CC]" size={24} />
                Affectation du technicien
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Selectionnez le technicien, definissez la priorite et le planning de la mission.
              </p>
            </div>

            {/* Employee grid */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <User size={14} className="text-[#0052CC]" />
                Choisir le technicien
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {employeeList.map((emp) => {
                  const isSelected = selectedEmployee === emp.name
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setSelectedEmployee(emp.name)}
                      className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-[#0052CC] bg-[#0052CC]/5 shadow-lg shadow-blue-100'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${
                          isSelected ? 'bg-[#0052CC] text-white' : 'bg-gradient-to-br from-slate-100 to-slate-50 text-slate-500'
                        }`}>
                          {emp.avatar}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          emp.active === 0 ? 'bg-green-500' : emp.active <= 1 ? 'bg-yellow-400' : 'bg-red-400'
                        }`} title={`${emp.active} mission(s) en cours`}></div>
                      </div>
                      <div className="overflow-hidden">
                        <p className={`text-sm font-black truncate ${isSelected ? 'text-[#0052CC]' : 'text-slate-900'}`}>{emp.name}</p>
                        <p className="text-[11px] font-semibold text-slate-400 truncate">{emp.role}</p>
                        <p className={`text-[10px] font-bold mt-0.5 ${
                          emp.active === 0 ? 'text-green-500' : emp.active <= 1 ? 'text-yellow-500' : 'text-red-400'
                        }`}>
                          {emp.active === 0 ? 'Disponible' : `${emp.active} mission${emp.active > 1 ? 's' : ''} active${emp.active > 1 ? 's' : ''}`}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-[#0052CC] rounded-full flex items-center justify-center shadow-md">
                          <Check size={13} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <AlertCircle size={14} className="text-orange-500" />
                Priorite
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(priorityConfig).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPriority(key)}
                    className={`relative flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all duration-200 ${
                      priority === key ? cfg.color + ' shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${priority === key ? cfg.dot : 'bg-slate-200'}`}></div>
                    <span className={`text-xs font-black ${priority === key ? '' : 'text-slate-500'}`}>{cfg.label}</span>
                    {priority === key && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-current rounded-full flex items-center justify-center opacity-30">
                        <Check size={10} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                  <Calendar size={14} className="text-[#0052CC]" />
                  Date de mission
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full px-5 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all font-bold text-slate-700 shadow-sm hover:border-slate-300"
                />
              </div>
              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                  <Clock size={14} className="text-[#0052CC]" />
                  Heure de debut
                </label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-5 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all font-bold text-slate-700 shadow-sm hover:border-slate-300"
                />
              </div>
            </div>
          </div>
        )

      // ─────────────────────────────────────────────────────────────────────
      case 4:
        return (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="pb-4 sm:pb-6 border-b-2 border-slate-100">
              <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                    <CheckCircle2 size={22} className="sm:hidden" />
                    <CheckCircle2 size={28} className="hidden sm:block" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">Confirmation & validation</h2>
                  <p className="text-sm text-slate-500 font-medium">Verifiez les informations avant de confirmer l'affectation.</p>
                </div>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Type & Mission */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-blue-200">
                  {missionType === 'Normal' ? <ClipboardList className="text-[#0052CC]" size={22} /> : <Wrench className="text-[#0052CC]" size={22} />}
                  <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                    {missionType === 'Normal' ? 'Mission Normale' : 'Intervention SAV'}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Titre</p>
                    <p className="text-sm font-bold text-slate-900">{formData.title || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Description</p>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">{formData.description || '—'}</p>
                  </div>
                  {missionType === 'Intervention' && selectedIntervention && (
                    <div>
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Dossier lie</p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-[#0052CC] bg-blue-100 px-2.5 py-1 rounded-lg">{selectedIntervention.id}</span>
                        <span className="text-xs text-slate-600 font-semibold">{selectedIntervention.client} — {selectedIntervention.machine}</span>
                      </div>
                    </div>
                  )}
                  {missionType === 'Normal' && formData.site && (
                    <div>
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Site</p>
                      <p className="text-sm font-semibold text-slate-700">{formData.site}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Technicien & planning */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl border-2 border-orange-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-orange-200">
                  <Users className="text-orange-600" size={22} />
                  <span className="text-xs font-black uppercase tracking-wider text-orange-900">Technicien & Planning</span>
                </div>
                <div className="space-y-3">
                  {selectedEmployeeObj && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0052CC] to-blue-700 text-white flex items-center justify-center font-black text-sm shadow-sm">
                        {selectedEmployeeObj.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{selectedEmployeeObj.name}</p>
                        <p className="text-xs text-slate-500 font-semibold">{selectedEmployeeObj.role}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Priorite</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${priorityConfig[priority]?.color || ''}`}>
                        <span className={`w-2 h-2 rounded-full ${priorityConfig[priority]?.dot || ''}`}></span>
                        {priority}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Date</p>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                        <Calendar size={13} className="text-orange-300" />
                        {dueDate ? dueDate.split('-').reverse().join('/') : '—'}
                      </div>
                    </div>
                    {dueTime && (
                      <div>
                        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Heure</p>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                          <Clock size={13} className="text-orange-300" />
                          {dueTime}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow impact notice */}
            {missionType === 'Intervention' && selectedIntervention && (
              <div className="bg-gradient-to-r from-[#0052CC]/5 to-blue-50 border-2 border-[#0052CC]/20 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0052CC] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
                  <AlertCircle size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#0052CC] mb-1">Impact sur le dossier d'intervention</p>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">
                    Apres confirmation, le dossier <span className="font-black text-[#0052CC]">{selectedIntervention.id}</span> passera
                    automatiquement au statut <span className="font-black text-blue-700">"Affectee"</span> et
                    <span className="font-black text-slate-800"> {selectedEmployee || 'le technicien selectionne'}</span> sera
                    designe comme responsable de cette intervention.
                  </p>
                </div>
              </div>
            )}

            {/* Reminder */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Zap size={18} className="text-amber-500 fill-amber-400" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Rappel</p>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed italic">
                  "Une fois confirmee, la mission sera visible dans le tableau de bord du technicien et dans la liste des missions terrain."
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      {/* ── TOP HEADER ── */}
      <div className="bg-white border-b-2 border-slate-200 px-4 sm:px-8 py-3 sm:py-5 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <button
            onClick={() => navigate('/missions')}
            className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-xl transition-all active:scale-95 shadow-sm shrink-0"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#0052CC] to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
                <Send size={14} className="text-white sm:hidden" />
                <Send size={18} className="text-white hidden sm:block" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight truncate">Affecter une mission</h1>
                <p className="hidden sm:block text-xs text-slate-500 font-semibold">
                  {missionType === '' && 'Etape 1 sur 4 — Choisissez le type de mission'}
                  {missionType === 'Normal' && currentStep > 1 && 'Mission normale — ' + (currentStep === 2 ? 'Details' : currentStep === 3 ? 'Affectation' : 'Validation')}
                  {missionType === 'Intervention' && currentStep > 1 && 'Intervention SAV — ' + (currentStep === 2 ? 'Details' : currentStep === 3 ? 'Affectation' : 'Validation')}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold shrink-0">
          <span className="text-[#0052CC] font-black">Etape {currentStep}</span>
          <span className="text-slate-300">/</span>
          <span>{steps.length}</span>
        </div>
      </div>

      {/* ── MOBILE STEPPER (visible < md) ── */}
      <div className="md:hidden bg-white border-b border-slate-100 px-4 py-3 shrink-0">
        <div className="flex items-center max-w-xs mx-auto">
          {steps.map((step, idx) => {
            const isActive = currentStep === step.id
            const isDone = currentStep > step.id
            const Icon = step.icon
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-200 scale-110'
                    : isDone ? 'bg-green-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isDone ? <Check size={14} strokeWidth={3} /> : <Icon size={14} className={isActive ? 'stroke-[3px]' : 'stroke-[2px]'} />}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wide leading-none ${
                    isActive ? 'text-[#0052CC]' : isDone ? 'text-green-500' : 'text-slate-300'
                  }`}>{step.title}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1.5 rounded-full mb-3.5 transition-all duration-500 ${
                    currentStep > step.id ? 'bg-[#0052CC]' : 'bg-slate-100'
                  }`} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT STEPPER (desktop only) ── */}
        <div className="hidden md:flex md:w-[260px] lg:w-[300px] border-r border-slate-100 bg-slate-50/30 flex-col p-6 lg:p-8 shrink-0">
          <div className="space-y-2 mb-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Etapes</h4>
            <div className="h-1 w-12 bg-[#0052CC] rounded-full"></div>
          </div>

          <div className="space-y-1">
            {steps.map((step) => {
              const isActive = currentStep === step.id
              const isDone = currentStep > step.id
              const Icon = step.icon
              return (
                <div key={step.id} className="relative pb-10 last:pb-0">
                  {step.id !== steps.length && (
                    <div className={`absolute left-6 top-14 bottom-0 w-0.5 rounded-full ${isDone ? 'bg-[#0052CC]' : 'bg-slate-100'}`}></div>
                  )}
                  <div className="flex items-start gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 z-10 ${
                      isActive
                        ? 'bg-[#0052CC] text-white shadow-xl shadow-blue-200 scale-110'
                        : isDone
                          ? 'bg-green-500 text-white shadow-lg shadow-green-100'
                          : 'bg-white text-slate-300 border-2 border-slate-100'
                    }`}>
                      {isDone ? <Check size={20} className="stroke-[4px]" /> : <Icon size={20} className={isActive ? 'stroke-[3px]' : 'stroke-[2px]'} />}
                    </div>
                    <div className="pt-1">
                      <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${isActive ? 'text-[#0052CC]' : isDone ? 'text-green-500' : 'text-slate-300'}`}>
                        Etape 0{step.id}
                      </p>
                      <p className={`text-base font-black tracking-tight ${isActive ? 'text-slate-900' : isDone ? 'text-slate-600' : 'text-slate-400'}`}>
                        {step.title}
                      </p>
                      <p className={`text-[11px] font-bold mt-0.5 ${isActive ? 'text-slate-500' : isDone ? 'text-slate-400' : 'text-slate-300'}`}>
                        {step.description}
                      </p>
                      {isDone && <span className="text-[9px] font-black text-green-500 uppercase tracking-wider">Termine</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Type badge in sidebar */}
          {missionType && (
            <div className="mt-auto bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Type selectionne</p>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${missionType === 'Normal' ? 'bg-slate-50 border border-slate-200' : 'bg-blue-50 border border-blue-100'}`}>
                {missionType === 'Normal' ? <ClipboardList size={18} className="text-slate-500" /> : <Wrench size={18} className="text-[#0052CC]" />}
                <div>
                  <p className={`text-sm font-black ${missionType === 'Normal' ? 'text-slate-700' : 'text-[#0052CC]'}`}>
                    {missionType === 'Normal' ? 'Mission Normale' : 'Intervention SAV'}
                  </p>
                  {missionType === 'Intervention' && formData.interventionId && (
                    <p className="text-[10px] font-bold text-[#0052CC] mt-0.5">{formData.interventionId}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!missionType && (
            <div className="mt-auto bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Zap size={16} className="text-orange-400 fill-orange-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conseil</span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">
                "Affectez une Intervention SAV pour lier directement la mission a un dossier client et mettre a jour son statut automatiquement."
              </p>
            </div>
          )}
        </div>

        {/* ── CENTER FORM ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-white flex flex-col">
          <div className="flex-1 px-4 py-6 sm:px-8 sm:py-10 lg:px-12 lg:py-14 max-w-4xl mx-auto w-full">
            <div className="h-full flex flex-col">
              <div className="flex-1">
                {renderStep()}
              </div>

              {/* Navigation buttons */}
              <div className="mt-6 sm:mt-12 pt-5 sm:pt-8 border-t-2 border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all ${
                    currentStep === 1
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 shadow-sm hover:shadow-md'
                  }`}
                >
                  <ChevronLeft size={18} />
                  Precedent
                </button>

                {currentStep < steps.length ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canGoNext()}
                    className={`group flex items-center gap-2 sm:gap-3 px-6 sm:px-10 py-3 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl active:scale-95 ${
                      canGoNext()
                        ? 'bg-gradient-to-r from-slate-900 to-slate-800 hover:from-[#0052CC] hover:to-blue-700 text-white hover:shadow-blue-300 shadow-slate-300'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    Continuer
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 sm:px-12 py-3 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl shadow-green-300 active:scale-95"
                  >
                    <Check size={18} strokeWidth={3} />
                    <span>Confirmer l'affectation</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
