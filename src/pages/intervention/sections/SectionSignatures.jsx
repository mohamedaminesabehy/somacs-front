import { ClipboardCheck } from 'lucide-react'
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

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="pb-4 sm:pb-6 border-b-2 border-slate-100">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
          <ClipboardCheck className="text-green-600" size={24} />
          Clôture &amp; Signatures
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">Validez l&apos;intervention avec les signatures du technicien et du client</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SignatureCaptureCard
          title="Signature du Technicien"
          placeholder="Le technicien signe ici pour valider l'intervention"
          type="TECHNICIAN_SIGNATURE"
          signature={techSig}
          isBusy={uploadingSignatureType === 'TECHNICIAN_SIGNATURE'}
          canManageSignatures={canManageSignatures}
          signatureInputRef={{ current: signatureInputRefs.current['TECHNICIAN_SIGNATURE'] }}
          onFileChange={handleSignatureFileChange}
          onDelete={handleDeleteSignature}
        />
        <SignatureCaptureCard
          title="Signature & Cachet Client"
          placeholder="Le client appose sa signature et son cachet"
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
