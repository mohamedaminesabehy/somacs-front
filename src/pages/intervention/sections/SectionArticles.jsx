import { Plus, Trash2, Package, Banknote } from 'lucide-react'

export default function SectionArticles({ parts, addPart, removePart, updatePart, laborPrice, setLaborPrice }) {
  const totalQty = parts.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0)
  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-slate-50/70 px-4 py-3">
          <p className="text-sm text-ink-muted">
            <span className="font-semibold text-ink tabular-nums">{parts.length}</span> référence{parts.length > 1 ? 's' : ''}
            <span className="mx-1.5 text-ink-faint" aria-hidden="true">·</span>
            <span className="font-semibold text-ink tabular-nums">{totalQty}</span> unité{totalQty > 1 ? 's' : ''}
          </p>
          <button type="button" onClick={addPart} className="ui-btn-primary ui-btn-sm">
            <Plus size={14} aria-hidden="true" /> Ajouter un article
          </button>
        </div>

        {parts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-ink-faint ring-1 ring-inset ring-line">
              <Package size={22} aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-ink">Aucun article utilisé</p>
            <p className="text-xs text-ink-muted">Ajoutez les pièces et consommables remplacés pendant l’intervention.</p>
          </div>
        ) : (
          <ol className="divide-y divide-line">
            {parts.map((part, index) => (
              <li key={part.id} className="grid grid-cols-[2rem_1fr_auto] items-start gap-3 px-4 py-3 sm:grid-cols-[2rem_10rem_1fr_6rem_auto] sm:items-center">
                <span className="mt-2 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-ink-muted tabular-nums sm:mt-0">{index + 1}</span>
                <div className="col-span-1 flex min-w-0 flex-col gap-2 sm:contents">
                  <label className="sr-only" htmlFor={`part-ref-${part.id}`}>Référence</label>
                  <input id={`part-ref-${part.id}`} type="text" value={part.reference} onChange={(e) => updatePart(part.id, 'reference', e.target.value)}
                    placeholder="REF-…" className="ui-input h-10 w-full font-mono text-sm font-semibold text-brand-700" />
                  <label className="sr-only" htmlFor={`part-des-${part.id}`}>Désignation</label>
                  <input id={`part-des-${part.id}`} type="text" value={part.designation} onChange={(e) => updatePart(part.id, 'designation', e.target.value)}
                    placeholder="Désignation de l’article" className="ui-input h-10 w-full text-sm" />
                  <div className="flex items-center gap-2 sm:block">
                    <label className="text-xs font-semibold text-ink-muted sm:sr-only" htmlFor={`part-qty-${part.id}`}>Quantité</label>
                    <input id={`part-qty-${part.id}`} type="number" min="0" value={part.quantity} onChange={(e) => updatePart(part.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="ui-input h-10 w-20 text-center text-sm font-semibold tabular-nums sm:w-full" />
                  </div>
                </div>
                <button type="button" onClick={() => removePart(part.id)} aria-label={`Retirer l’article ${index + 1}`}
                  className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl text-ink-faint transition-colors hover:bg-red-50 hover:text-red-600 sm:mt-0">
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-navy p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/15">
            <Banknote size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">Prix main d&apos;œuvre (HT)</p>
            <p className="text-xs text-brand-100/80">Coût de la main d&apos;œuvre hors taxes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="laborPrice" className="sr-only">Prix main d&apos;œuvre en dinars</label>
          <input id="laborPrice" type="number" min="0" value={laborPrice} onChange={(e) => setLaborPrice(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/15 bg-white/10 px-4 text-right font-display text-lg font-bold text-white outline-none tabular-nums focus:border-brand-300 focus:ring-4 focus:ring-brand-400/25 sm:w-36" />
          <span className="font-display text-base font-bold text-brand-200">DT</span>
        </div>
      </div>
    </div>
  )
}
