import { Lock } from 'lucide-react'
import SignatureCaptureCard from './SignatureCaptureCard'

export default function SectionSignatures({
  getSignatureByType,
  uploadingSignatureType,
  canManageSignatures,
  signatureInputRefs,
  handleSignatureFileChange,
  handleDeleteSignature,
}) {
  const techSig = getSignatureByType('TECHNICIAN_SIGNATURE')
  const clientSig = getSignatureByType('CLIENT_SIGNATURE_STAMP')
  const signedCount = [techSig, clientSig].filter((s) => s?.url).length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Validation contradictoire</p>
          <p className="text-xs text-ink-muted">Le technicien et le client signent pour attester de l’intervention.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-2 w-28 overflow-hidden rounded-full bg-slate-200" role="img" aria-label={`${signedCount} signature(s) sur 2`}>
            <div className="h-full bg-teal-500 transition-all" style={{ width: `${signedCount * 50}%` }} />
          </div>
          <span className="text-sm font-bold text-ink tabular-nums">{signedCount}/2</span>
        </div>
      </div>

      {!canManageSignatures && (
        <p className="flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-medium text-ink-muted">
          <Lock size={13} aria-hidden="true" /> Signatures en lecture seule pour ce dossier.
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <SignatureCaptureCard
          title="Signature du technicien"
          placeholder="Photographiez ou importez la signature du technicien"
          type="TECHNICIAN_SIGNATURE"
          signature={techSig}
          isBusy={uploadingSignatureType === 'TECHNICIAN_SIGNATURE'}
          canManageSignatures={canManageSignatures}
          signatureInputRef={{ current: signatureInputRefs.current['TECHNICIAN_SIGNATURE'] }}
          onFileChange={handleSignatureFileChange}
          onDelete={handleDeleteSignature}
        />
        <SignatureCaptureCard
          title="Signature & cachet client"
          placeholder="Photographiez ou importez la signature et le cachet du client"
          type="CLIENT_SIGNATURE_STAMP"
          signature={clientSig}
          isBusy={uploadingSignatureType === 'CLIENT_SIGNATURE_STAMP'}
          canManageSignatures={canManageSignatures}
          signatureInputRef={{ current: signatureInputRefs.current['CLIENT_SIGNATURE_STAMP'] }}
          onFileChange={handleSignatureFileChange}
          onDelete={handleDeleteSignature}
        />
      </div>
    </div>
  )
}
