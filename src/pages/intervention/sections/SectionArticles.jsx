import { Plus, Trash2, Package } from 'lucide-react'

export default function SectionArticles({ parts, addPart, removePart, updatePart, laborPrice, setLaborPrice }) {
  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="pb-4 sm:pb-6 border-b-2 border-slate-100">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
          <Package className="text-purple-600" size={24} />
          Articles Utilisés &amp; Tarification
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">Gérez les pièces consommables et le coût de main d&apos;œuvre</p>
      </div>

      <PartsTable parts={parts} addPart={addPart} removePart={removePart} updatePart={updatePart} />
      <LaborPriceBox laborPrice={laborPrice} setLaborPrice={setLaborPrice} />
    </div>
  )
}

function PartsTable({ parts, addPart, removePart, updatePart }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-wider">{parts.length} Référence{parts.length > 1 ? 's' : ''}</span>
        </div>
        <button onClick={addPart}
          className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-[#0052CC] hover:bg-[#0052CC]/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all border border-blue-200">
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {/* Mobile Card Layout */}
      <div className="block sm:hidden divide-y divide-slate-100">
        {parts.map((part) => (
          <PartCardMobile key={part.id} part={part} updatePart={updatePart} removePart={removePart} />
        ))}
        {parts.length === 0 && <PartsEmptyState />}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <th className="px-6 py-4">Référence</th>
              <th className="px-6 py-4">Désignation</th>
              <th className="px-6 py-4 w-28 text-center">Quantité</th>
              <th className="px-6 py-4 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {parts.map((part) => (
              <PartRowDesktop key={part.id} part={part} updatePart={updatePart} removePart={removePart} />
            ))}
            {parts.length === 0 && (
              <tr><td colSpan="4" className="px-6 py-12 text-center"><PartsEmptyState /></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PartCardMobile({ part, updatePart, removePart }) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-2">
          <input type="text" value={part.reference} onChange={(e) => updatePart(part.id, 'reference', e.target.value)}
            placeholder="Référence"
            className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#0052CC] outline-none" />
          <input type="text" value={part.designation} onChange={(e) => updatePart(part.id, 'designation', e.target.value)}
            placeholder="Désignation"
            className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold text-slate-600 outline-none" />
        </div>
        <button onClick={() => removePart(part.id)} className="p-2 text-slate-300 hover:text-red-500 ml-2">
          <Trash2 size={18} />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantité:</span>
        <input type="number" value={part.quantity} onChange={(e) => updatePart(part.id, 'quantity', parseInt(e.target.value) || 0)}
          className="w-20 bg-slate-50 rounded-lg px-3 py-1.5 text-center font-black text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#0052CC]/20" />
      </div>
    </div>
  )
}

function PartRowDesktop({ part, updatePart, removePart }) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4">
        <input type="text" value={part.reference} onChange={(e) => updatePart(part.id, 'reference', e.target.value)}
          placeholder="REF-..."
          className="w-full bg-transparent border-none p-0 focus:ring-0 font-mono font-bold text-[#0052CC] outline-none" />
      </td>
      <td className="px-6 py-4">
        <input type="text" value={part.designation} onChange={(e) => updatePart(part.id, 'designation', e.target.value)}
          placeholder="Désignation de l'article"
          className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-slate-600 outline-none" />
      </td>
      <td className="px-6 py-4">
        <input type="number" value={part.quantity} onChange={(e) => updatePart(part.id, 'quantity', parseInt(e.target.value) || 0)}
          className="w-full bg-slate-50 rounded-lg px-3 py-1 text-center font-black text-slate-700 outline-none focus:ring-2 focus:ring-[#0052CC]/20" />
      </td>
      <td className="px-6 py-4 text-right">
        <button onClick={() => removePart(part.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors">
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  )
}

function PartsEmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-12">
      <Package size={24} className="text-slate-200" />
      <p className="text-sm font-semibold text-slate-400">Aucun article ajouté</p>
      <p className="text-xs text-slate-300">Cliquez sur &quot;Ajouter&quot; pour commencer</p>
    </div>
  )
}

function LaborPriceBox({ laborPrice, setLaborPrice }) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Prix Main d&apos;Œuvre (HT)</p>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Coût de la main d&apos;œuvre hors taxes</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <input type="number" value={laborPrice} onChange={(e) => setLaborPrice(e.target.value)}
            className="w-full sm:w-32 bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 text-right font-black text-white focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC] outline-none text-base sm:text-lg" />
          <span className="text-base sm:text-lg font-black text-slate-400">DT</span>
        </div>
      </div>
    </div>
  )
}
