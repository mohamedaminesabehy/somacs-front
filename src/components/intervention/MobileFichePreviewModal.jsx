import React from 'react'
import { Eye, Plus } from 'lucide-react'
import FichePreviewFrame from './FichePreviewFrame'

export default function MobileFichePreviewModal({
  onClose,
  interventionData,
  parts,
  laborPrice,
  logo,
  technicianSignatureUrl,
  clientSignatureUrl,
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 xl:hidden animate-in fade-in duration-300">
      <div className="bg-white w-[min(100%,42rem)] h-[92dvh] max-h-[92dvh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
              <Eye size={18} />
            </div>
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs sm:text-sm">AperÃ§u de la fiche officielle</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors"
          >
            <Plus size={20} className="rotate-45" />
          </button>
        </div>

        <FichePreviewFrame
          interventionData={interventionData}
          parts={parts}
          laborPrice={laborPrice}
          logo={logo}
          technicianSignatureUrl={technicianSignatureUrl}
          clientSignatureUrl={clientSignatureUrl}
        />

        <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
          >
            Fermer l'aperÃ§u
          </button>
        </div>
      </div>
    </div>
  )
}
