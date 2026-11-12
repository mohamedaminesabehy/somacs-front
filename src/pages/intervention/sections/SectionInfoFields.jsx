import { Building2, User, Phone, MapPin, FileText, Settings, Zap, Hash, Cpu } from 'lucide-react'

const INPUT_BASE = "w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:ring-4 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm hover:border-slate-300"
const INPUT_BLUE = `${INPUT_BASE} focus:border-brand-600 focus:ring-brand-600/10`
const INPUT_ORANGE = `${INPUT_BASE} focus:border-orange-500 focus:ring-orange-500/10`
const INPUT_READONLY = "w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm"

function FieldLabel({ children, color = 'blue' }) {
  const dotColorMap = { blue: 'bg-brand-600', orange: 'bg-orange-500' }
  const focusColorMap = { blue: 'group-focus-within:text-brand-600', orange: 'group-focus-within:text-orange-500' }
  const dotColor = dotColorMap[color] || 'bg-slate-300'
  const focusColor = focusColorMap[color] || ''
  return (
    <label className={`text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 ${focusColor} transition-colors`}>
      <span className={`w-1.5 h-1.5 ${dotColor} rounded-full`}></span>
      {children}
    </label>
  )
}

function getClientAddress(selectedClient, interventionData) {
  if (!selectedClient) return interventionData.clientAddress
  const trimmed = String(selectedClient.address || '').trim()
  if (trimmed) return trimmed
  const city = selectedClient.city || ''
  const zone = selectedClient.zone ? ', ' + selectedClient.zone : ''
  return city + zone
}

function getMachineModelValue(selectedMachine, interventionData) {
  if (!selectedMachine) return interventionData.machineModel
  const model = String(selectedMachine.model || '').trim()
  return model || selectedMachine.year
}

export function ClientInfoFields({
  interventionData,
  selectedClient,
  clients,
  isReadOnly,
  handleChange,
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
        <User size={12} className="text-brand-600" />
        Identification Client
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2 sm:space-y-3 group">
          <FieldLabel color="blue">Client</FieldLabel>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
            {isReadOnly ? (
              <input type="text" value={interventionData.clientName || ''} readOnly className={INPUT_READONLY} />
            ) : (
              <select name="clientId" value={interventionData.clientId} onChange={handleChange} className={INPUT_BLUE}>
                <option value="">Sélectionner un client</option>
                {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            )}
          </div>
        </div>
        <div className="space-y-2 sm:space-y-3 group">
          <FieldLabel color="muted">Code Client</FieldLabel>
          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
            <input type="text" name="clientCode" value={selectedClient?.code || interventionData.clientCode || ''} readOnly className={INPUT_BLUE} />
          </div>
        </div>
        <div className="space-y-2 sm:space-y-3 group">
          <FieldLabel color="muted">Demandeur</FieldLabel>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
            <input type="text" name="requestorName" value={interventionData.requestorName} onChange={handleChange} className={INPUT_BLUE} />
          </div>
        </div>
        <div className="space-y-2 sm:space-y-3 group">
          <FieldLabel color="muted">Téléphone</FieldLabel>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
            <input type="tel" name="clientPhone" value={selectedClient?.phone || interventionData.clientPhone || ''} readOnly className={INPUT_BLUE} />
          </div>
        </div>
        <div className="md:col-span-2 space-y-2 sm:space-y-3 group">
          <FieldLabel color="muted">E-mail</FieldLabel>
          <div className="relative">
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
            <input type="email" name="clientEmail" value={selectedClient?.email || interventionData.clientEmail || ''} readOnly className={INPUT_BLUE} />
          </div>
        </div>
        <div className="md:col-span-2 space-y-2 sm:space-y-3 group">
          <FieldLabel color="muted">Adresse</FieldLabel>
          <div className="relative">
            <MapPin className="absolute left-4 top-4 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
            <textarea
              name="clientAddress"
              value={getClientAddress(selectedClient, interventionData)}
              readOnly
              className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold h-20 sm:h-24 resize-none shadow-sm hover:border-slate-300 leading-relaxed"
            />
          </div>
        </div>
        <div className="md:col-span-2 space-y-2 sm:space-y-3 group">
          <FieldLabel color="muted">Site / Localisation</FieldLabel>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
            <input
              type="text"
              name="siteName"
              value={interventionData.siteName || ''}
              onChange={handleChange}
              readOnly={isReadOnly}
              className={INPUT_BLUE}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function EquipmentInfoFields({
  interventionData,
  selectedMachine,
  machines,
  isReadOnly,
  handleChange,
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
        <Settings size={12} className="text-orange-500" />
        Fiche Technique Équipement
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2 sm:space-y-3 group">
          <FieldLabel color="orange">Équipement</FieldLabel>
          <div className="relative">
            <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
            {isReadOnly ? (
              <input type="text" value={interventionData.machineType || ''} readOnly className={INPUT_READONLY} />
            ) : (
              <select name="machineId" value={interventionData.machineId} onChange={handleChange} className={INPUT_ORANGE}>
                <option value="">Sélectionner une machine</option>
                {machines.map((m) => (<option key={m.id} value={m.id}>{m.designation}</option>))}
              </select>
            )}
          </div>
        </div>
        <div className="space-y-2 sm:space-y-3 group">
          <FieldLabel color="muted">Marque</FieldLabel>
          <input type="text" name="machineBrand" value={selectedMachine?.brand || interventionData.machineBrand || ''} readOnly
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm hover:border-slate-300" />
        </div>
        <div className="space-y-2 sm:space-y-3 group">
          <FieldLabel color="muted">Modèle</FieldLabel>
          <input
            type="text"
            name="machineModel"
            value={getMachineModelValue(selectedMachine, interventionData)}
            readOnly
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm hover:border-slate-300"
          />
        </div>
        <div className="space-y-2 sm:space-y-3 group">
          <FieldLabel color="muted">Numéro de Série</FieldLabel>
          <div className="relative">
            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input type="text" name="serialNumber" value={selectedMachine?.serialNumber || interventionData.serialNumber || ''} readOnly
              className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-bold font-mono tracking-wider shadow-sm hover:border-slate-300" />
          </div>
        </div>
      </div>
    </div>
  )
}
