import { Download, ExternalLink, Eye, File, FileImage, Paperclip, X } from 'lucide-react'
import { DetailCard } from './DetailCard'
import { downloadDocument } from './missionDetailsUtils'

function DocumentRow({ doc, onView }) {
  const isImage = doc.type === 'image'
  const thumb = isImage ? doc.url : doc.isPdf ? doc.displayUrl : null
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-white p-2 pr-2.5 transition-colors hover:border-brand-200">
      <button
        type="button"
        onClick={() => onView(doc)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-canvas ring-1 ring-inset ring-line">
          {thumb ? (
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : isImage ? (
            <FileImage size={18} aria-hidden="true" className="text-ink-muted" />
          ) : (
            <File size={18} aria-hidden="true" className="text-ink-muted" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">{doc.name || 'Document'}</span>
          <span className="block text-xs text-ink-muted">{doc.isPdf ? 'PDF' : isImage ? 'Image' : 'Fichier'} · Voir</span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => onView(doc)}
        aria-label={`Prévisualiser ${doc.name || 'le document'}`}
        className="ui-icon-btn hidden sm:inline-flex"
      >
        <Eye size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => downloadDocument(doc.downloadUrl || doc.url, doc.name)}
        aria-label={`Télécharger ${doc.name || 'le document'}`}
        className="ui-icon-btn"
      >
        <Download size={16} aria-hidden="true" />
      </button>
    </li>
  )
}

export default function MissionDocumentsCard({ attachments, onView }) {
  return (
    <DetailCard
      icon={Paperclip}
      title="Documents"
      action={attachments.length > 0 && (
        <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-bold text-ink-muted ring-1 ring-inset ring-line">{attachments.length}</span>
      )}
    >
      {attachments.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {attachments.map((doc, idx) => (
            <DocumentRow key={doc.publicId || doc.url || idx} doc={doc} onView={onView} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-8 text-center">
          <Paperclip size={20} aria-hidden="true" className="text-ink-faint" />
          <p className="text-sm text-ink-muted">Aucun document joint à cette mission.</p>
        </div>
      )}
    </DetailCard>
  )
}

export function DocumentViewer({ doc, onClose }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true" aria-label={`Aperçu : ${doc.name}`}>
      <div className="absolute inset-0 bg-navy-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-raised animate-in fade-in zoom-in-95 duration-200">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="ui-eyebrow">Aperçu du document</p>
            <p className="truncate text-sm font-bold text-ink">{doc.name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {doc.isPdf && (
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="ui-icon-btn" aria-label="Ouvrir dans un nouvel onglet">
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            )}
            <button type="button" onClick={() => downloadDocument(doc.downloadUrl || doc.url, doc.name)} className="ui-icon-btn" aria-label="Télécharger">
              <Download size={16} aria-hidden="true" />
            </button>
            <button type="button" onClick={onClose} className="ui-icon-btn" aria-label="Fermer l’aperçu">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="overflow-auto bg-canvas p-3 sm:p-4">
          {doc.type === 'image' ? (
            <img src={doc.url} alt={doc.name} className="mx-auto h-auto max-h-[78vh] w-auto rounded-xl object-contain" />
          ) : doc.isPdf ? (
            <div className="overflow-hidden rounded-xl border border-line bg-white">
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(doc.url)}&embedded=true`}
                title={doc.name}
                className="h-[70vh] w-full border-0"
              />
              <div className="flex flex-wrap items-center justify-center gap-3 border-t border-line p-3">
                <p className="text-xs text-ink-muted">Le PDF ne s’affiche pas ?</p>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="ui-btn-secondary ui-btn-sm">
                  <ExternalLink size={14} aria-hidden="true" />
                  Ouvrir dans un nouvel onglet
                </a>
              </div>
            </div>
          ) : (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-3 rounded-xl border border-line bg-white">
              <File size={40} aria-hidden="true" className="text-ink-faint" />
              <p className="text-sm font-semibold text-ink">{doc.name}</p>
              <button type="button" onClick={() => downloadDocument(doc.downloadUrl || doc.url, doc.name)} className="ui-btn-primary">
                <Download size={16} aria-hidden="true" />
                Télécharger le fichier
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
