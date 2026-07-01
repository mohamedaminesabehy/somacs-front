import { Clock, AlertCircle, Wrench, PhoneCall } from 'lucide-react'

export default function SectionDiagnostic({ interventionData, handleChange, setInterventionData }) {
  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="pb-4 sm:pb-6 border-b-2 border-slate-100">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
          <AlertCircle className="text-blue-600" size={24} />
          D&eacute;tail de l&apos;Intervention
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">Diagnostic, rapport d&apos;expertise et d&eacute;tail des travaux effectu&eacute;s</p>
      </div>

      <div className="space-y-6 sm:space-y-8">
        <InterventionTypeField interventionData={interventionData} handleChange={handleChange} />
        <ProblemDescriptionField interventionData={interventionData} handleChange={handleChange} />
        <PhoneDiagnosticField interventionData={interventionData} handleChange={handleChange} />
        <SolutionField interventionData={interventionData} handleChange={handleChange} />
        <TestResultFields interventionData={interventionData} handleChange={handleChange} setInterventionData={setInterventionData} />
        <TimeFields interventionData={interventionData} handleChange={handleChange} />
      </div>
    </div>
  )
}

function InterventionTypeField({ interventionData, handleChange }) {
  return (
    <div className="space-y-2 sm:space-y-3 group">
      <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-blue-600 transition-colors">
        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
        Type d&apos;Intervention
      </label>
      <select name="interventionType" value={interventionData.interventionType} onChange={handleChange}
        className="w-full px-4 py-3 sm:py-4 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all font-bold text-sm sm:text-base text-blue-700 appearance-none cursor-pointer shadow-sm hover:border-slate-300"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
      >
        <option value="Réparation">{'🔧'} Réparation</option>
        <option value="Installation">{'⚡'} Installation</option>
        <option value="Garantie">{'🛡️'} Sous Garantie</option>
        <option value="Devis">{'📄'} Établissement Devis</option>
        <option value="Formation">{'🎓'} Formation</option>
        <option value="Livraison">{'📦'} Livraison</option>
      </select>
    </div>
  )
}

function ProblemDescriptionField({ interventionData, handleChange }) {
  return (
    <div className="space-y-2 sm:space-y-3 group">
      <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-blue-600 transition-colors">
        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
        Type de panne
      </label>
      <div className="relative">
        <textarea name="problemDescription" value={interventionData.problemDescription} onChange={handleChange}
          placeholder="Décrivez précisément le type de panne constaté..."
          className="w-full px-4 py-3 sm:py-4 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-medium h-24 sm:h-28 resize-none leading-relaxed shadow-sm hover:border-slate-300" />
        <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-semibold">
          {interventionData.problemDescription.length} caractères
        </div>
      </div>
    </div>
  )
}

function PhoneDiagnosticField({ interventionData, handleChange }) {
  return (
    <div className="space-y-2 sm:space-y-3 group">
      <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-blue-600 transition-colors">
        <PhoneCall size={12} className="text-blue-600" />
        Diagnostic Téléphonique
      </label>
      <textarea name="telephoneDiagnostic" value={interventionData.telephoneDiagnostic} onChange={handleChange}
        placeholder="Résumé du diagnostic réalisé par téléphone avant l'intervention sur site..."
        className="w-full px-4 py-3 sm:py-4 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-medium h-28 sm:h-32 resize-none leading-relaxed shadow-sm hover:border-slate-300" />
    </div>
  )
}

function SolutionField({ interventionData, handleChange }) {
  return (
    <div className="space-y-2 sm:space-y-3 group">
      <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-blue-600 transition-colors">
        <Wrench size={12} className="text-blue-600" />
        Solution d&apos;intervention
      </label>
      <textarea name="interventionDetail" value={interventionData.interventionDetail} onChange={handleChange}
        placeholder="Décrivez précisément les actions correctives réalisées sur l'équipement..."
        className="w-full px-4 py-3 sm:py-4 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-medium min-h-[140px] sm:min-h-[160px] resize-none leading-relaxed shadow-sm hover:border-slate-300" />
    </div>
  )
}

function TestResultFields({ interventionData, handleChange, setInterventionData }) {
  const ouiClass = interventionData.essaiConcluant === true
    ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
  const nonClass = interventionData.essaiConcluant === false
    ? 'bg-red-50 border-red-500 text-red-700 shadow-sm'
    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      <div className="space-y-2 sm:space-y-3 group">
        <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-blue-600 transition-colors">
          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
          Nombre d&apos;Essai
        </label>
        <input type="number" name="numEssai" value={interventionData.numEssai} onChange={handleChange} min="0" step="1"
          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-bold shadow-sm hover:border-slate-300" />
      </div>
      <div className="space-y-2 sm:space-y-3">
        <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
          Essai Concluant
        </label>
        <div className="flex gap-2 sm:gap-3">
          <button type="button"
            onClick={() => setInterventionData(prev => ({ ...prev, essaiConcluant: true }))}
            className={`flex-1 py-3 sm:py-3.5 rounded-xl font-black text-[11px] sm:text-sm uppercase tracking-wider transition-all border-2 ${ouiClass}`}>
            ✓ Oui
          </button>
          <button type="button"
            onClick={() => setInterventionData(prev => ({ ...prev, essaiConcluant: false }))}
            className={`flex-1 py-3 sm:py-3.5 rounded-xl font-black text-[11px] sm:text-sm uppercase tracking-wider transition-all border-2 ${nonClass}`}>
            ✕ Non
          </button>
        </div>
      </div>
    </div>
  )
}

function TimeFields({ interventionData, handleChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      <div className="space-y-2 sm:space-y-3 group">
        <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-green-600 transition-colors">
          <Clock size={12} className="text-green-600" />
          Entrée
        </label>
        <input type="time" name="startTime" value={interventionData.startTime} onChange={handleChange}
          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:ring-4 focus:ring-green-600/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-bold shadow-sm hover:border-slate-300" />
      </div>
      <div className="space-y-2 sm:space-y-3 group">
        <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-green-600 transition-colors">
          <Clock size={12} className="text-green-600" />
          Sortie
        </label>
        <input type="time" name="endTime" value={interventionData.endTime} onChange={handleChange}
          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:ring-4 focus:ring-green-600/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-bold shadow-sm hover:border-slate-300" />
      </div>
      <div className="space-y-2 sm:space-y-3 group">
        <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-green-600 transition-colors">
          <Clock size={12} className="text-green-600" />
          Total
        </label>
        <input type="text" name="totalTime" value={interventionData.totalTime} readOnly
          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:ring-4 focus:ring-green-600/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-bold shadow-sm hover:border-slate-300" />
      </div>
    </div>
  )
}
