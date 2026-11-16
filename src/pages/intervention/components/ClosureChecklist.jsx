import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'

/**
 * Éléments réellement exigés par le backend pour passer en CLOSED
 * (InterventionsService.assertValidUpdate). Ne pas ajouter de champ facultatif.
 */
export function buildClosureChecklist({ interventionData, technicianSignatureUrl, clientSignatureUrl }) {
  return [
    { key: 'technician', label: 'Technicien renseigné', hint: 'Aucun technicien n’est associé au dossier.', section: 1, done: Boolean(String(interventionData.technicianName || '').trim()) },
    { key: 'date', label: 'Date d’intervention', hint: 'La date d’intervention est vide.', section: 1, done: Boolean(String(interventionData.interventionDate || '').trim()) },
    { key: 'detail', label: 'Détail de l’intervention', hint: 'Décrivez les travaux réalisés dans « Diagnostic ».', section: 2, done: Boolean(String(interventionData.interventionDetail || '').trim()) },
    { key: 'techSignature', label: 'Signature technicien', hint: 'Ajoutez la signature du technicien.', section: 4, done: Boolean(technicianSignatureUrl) },
    { key: 'clientSignature', label: 'Signature / cachet client', hint: 'Ajoutez la signature ou le cachet du client.', section: 4, done: Boolean(clientSignatureUrl) },
  ]
}

export default function ClosureChecklist({ items, sectionTitles, onGoToSection }) {
  const missing = items.filter((item) => !item.done)
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-600">
        {missing.length === 0
          ? 'Toutes les informations obligatoires sont présentes. Après clôture, le dossier ne sera plus modifiable.'
          : `${missing.length} élément${missing.length > 1 ? 's' : ''} obligatoire${missing.length > 1 ? 's' : ''} manquant${missing.length > 1 ? 's' : ''} avant la clôture.`}
      </p>
      <ul className="flex flex-col gap-2" aria-label="Checklist de clôture">
        {items.map((item) => (
          <li key={item.key} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${item.done ? 'border-teal-200 bg-teal-50/60' : 'border-amber-200 bg-amber-50/70'}`}>
            {item.done
              ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-teal-600" aria-hidden="true" />
              : <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                {item.label}
                <span className="sr-only">{item.done ? ' : complet' : ' : manquant'}</span>
              </p>
              {!item.done && <p className="text-xs text-slate-600">{item.hint}</p>}
            </div>
            {!item.done && onGoToSection && (
              <button type="button" onClick={() => onGoToSection(item.section)} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                {sectionTitles?.[item.section] || `Section ${item.section}`} <ArrowRight size={12} aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
