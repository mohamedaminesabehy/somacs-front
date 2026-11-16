import { useRef } from 'react'
import { Camera, Trash2, RefreshCw, CheckCircle2, PenLine } from 'lucide-react'

function formatSignatureDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function SignatureCaptureCard({
  title, placeholder, type,
  signature, isBusy, canManageSignatures,
  onFileChange, onDelete,
}) {
  const inputRef = useRef(null)
  const inputId = `signature-input-${type}`
  const disabled = !canManageSignatures || isBusy
  const hasSignature = Boolean(signature?.url)
  const openPicker = () => inputRef.current?.click()

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border bg-white transition-colors ${hasSignature ? 'border-teal-200' : 'border-line'}`}>
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <PenLine size={15} className="text-brand-600" aria-hidden="true" /> {title}
        </p>
        {hasSignature
          ? <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800 ring-1 ring-inset ring-teal-200"><CheckCircle2 size={11} aria-hidden="true" /> Signée</span>
          : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-ink-muted">En attente</span>}
      </div>

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        onChange={(event) => onFileChange(type, event)}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={openPicker}
        aria-label={hasSignature ? `${title} — remplacer` : `${title} — ajouter`}
        className={`relative m-4 aspect-[2.4/1] overflow-hidden rounded-xl border-2 border-dashed transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15
          ${hasSignature ? 'border-transparent bg-slate-50' : canManageSignatures ? 'border-brand-200 bg-brand-50/30 hover:border-brand-400 hover:bg-brand-50/60' : 'border-line bg-slate-50 cursor-default'}`}
      >
        {hasSignature ? (
          <img src={signature.url} alt={title} className="absolute inset-0 h-full w-full object-contain p-3" />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            {isBusy
              ? <RefreshCw size={20} className="animate-spin text-brand-600" aria-hidden="true" />
              : <Camera size={20} className={canManageSignatures ? 'text-brand-600' : 'text-ink-faint'} aria-hidden="true" />}
            <span className="text-xs font-medium text-ink-muted">{isBusy ? 'Enregistrement…' : placeholder}</span>
          </span>
        )}
        <span className="pointer-events-none absolute bottom-3 left-6 right-6 h-px bg-slate-300" aria-hidden="true" />
      </button>

      {hasSignature && (
        <div className="flex flex-col gap-2 border-t border-line bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{signature.signerName || 'Signataire non renseigné'}</p>
            <p className="text-xs text-ink-muted">{formatSignatureDate(signature.signedAt) || 'Date non renseignée'}</p>
          </div>
          {canManageSignatures && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={openPicker} disabled={isBusy} className="ui-btn-secondary ui-btn-sm">
                <Camera size={13} aria-hidden="true" /> Remplacer
              </button>
              <button type="button" onClick={() => onDelete(signature)} disabled={isBusy} aria-label="Supprimer la signature"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 ring-1 ring-inset ring-red-200 transition-colors hover:bg-red-50 disabled:opacity-60">
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
