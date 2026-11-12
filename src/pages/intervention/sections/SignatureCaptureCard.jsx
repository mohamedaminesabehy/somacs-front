import { Camera, Trash2 } from 'lucide-react'

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
  signatureInputRef, onFileChange, onDelete,
}) {
  const inputId = `signature-input-${type}`
  const borderClass = canManageSignatures
    ? 'bg-slate-50 border-slate-200 hover:border-brand-600 cursor-pointer'
    : 'bg-slate-50 border-slate-200 cursor-default'

  return (
    <div className="space-y-3 sm:space-y-4">
      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{title}</p>
      <input
        id={inputId}
        ref={signatureInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={!canManageSignatures || isBusy}
        onChange={(event) => onFileChange(type, event)}
      />
      <button
        type="button"
        disabled={!canManageSignatures || isBusy}
        onClick={() => signatureInputRef?.current?.click()}
        className={`relative aspect-[2.5/1] sm:aspect-[2/1] w-full overflow-hidden rounded-2xl border-2 border-dashed transition-all ${borderClass}`}
      >
        {signature?.url ? (
          <img src={signature.url} alt={title} className="absolute inset-0 h-full w-full object-contain bg-white p-3" />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <Camera size={20} className={canManageSignatures ? 'text-brand-600' : 'text-slate-300'} />
            <span className={['text-[9px] sm:text-[10px] font-black uppercase transition-colors', canManageSignatures ? 'text-slate-400' : 'text-slate-300'].join(' ')}>
              {isBusy ? 'Enregistrement...' : placeholder}
            </span>
          </span>
        )}
      </button>
      {signature?.url && (
        <SignatureInfo
          signature={signature}
          canManageSignatures={canManageSignatures}
          isBusy={isBusy}
          signatureInputRef={signatureInputRef}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}

function SignatureInfo({ signature, canManageSignatures, isBusy, signatureInputRef, onDelete }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-700 truncate">{signature.signerName || 'Non renseigné'}</p>
        <p className="text-[9px] font-semibold text-slate-400">
          {formatSignatureDate(signature.signedAt) || 'Date non renseignée'}
        </p>
      </div>
      {canManageSignatures && (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => signatureInputRef?.current?.click()} disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-white hover:bg-slate-800 transition-colors disabled:opacity-60">
            <Camera size={13} /> Remplacer
          </button>
          <button type="button" onClick={() => onDelete(signature)} disabled={isBusy}
            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-60"
            aria-label="Supprimer la signature">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
