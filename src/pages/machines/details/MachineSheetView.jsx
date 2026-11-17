import { useEffect, useState } from 'react'
import {
  AlertCircle, Bot, Building2, CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardCheck, Cpu,
  Download, Edit2, Eye, FileText, Hash, History, Image as ImageIcon, Lightbulb, Loader2, Maximize2,
  Package, ShieldCheck, ShieldOff, Sparkles, Trash2, Truck, User, Wrench, X,
} from 'lucide-react'
import PdfViewer from '../../../components/PdfViewer'
import { INTERVENTION_STATUS_BADGE, getInterventionStatusLabel } from '../../../utils/intervention'
import { ConfirmDialog } from '../../intervention/components/interventionUi'

const MACHINE_STATUS = {
  'en service': { label: 'En service', className: 'bg-teal-50 text-teal-800 ring-teal-200', dot: 'bg-teal-500' },
  'en panne': { label: 'En panne', className: 'bg-red-50 text-red-800 ring-red-200', dot: 'bg-red-500' },
  'en maintenance': { label: 'En maintenance', className: 'bg-amber-50 text-amber-900 ring-amber-200', dot: 'bg-amber-500' },
}

function machineStatus(raw) {
  const key = String(raw || '').trim().toLowerCase()
  return MACHINE_STATUS[key] || { label: raw || 'Statut inconnu', className: 'bg-slate-100 text-ink-soft ring-line', dot: 'bg-slate-400' }
}

function isBlank(v) {
  return v === null || v === undefined || String(v).trim() === ''
}

function fmtDate(value) {
  if (isBlank(value)) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function yesNo(v) {
  if (v === true || v === 'true' || v === 'Oui') return 'Oui'
  if (v === false || v === 'false' || v === 'Non') return 'Non'
  return v
}

const SECTIONS = [
  { key: 'general', label: 'Fiche technique', icon: Cpu },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'gallery', label: 'Photos', icon: ImageIcon },
  { key: 'intervention', label: 'Historique SAV', icon: History },
  { key: 'assistant', label: 'Assistant IA', icon: Bot },
]

/* ------------------------------------------------------------------ atoms */

function Panel({ title, icon: Icon, aside, children, className = '' }) {
  return (
    <section className={`overflow-hidden rounded-xl border border-line bg-white ${className}`}>
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          {Icon && <Icon size={15} className="text-brand-700" aria-hidden="true" />}
          {title}
        </h2>
        {aside}
      </header>
      {children}
    </section>
  )
}

function SpecRow({ label, value, mono }) {
  const empty = isBlank(value)
  return (
    <div className="grid grid-cols-[minmax(0,9.5rem)_1fr] gap-3 px-4 py-2.5 sm:px-5">
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd className={`min-w-0 break-words text-sm ${empty ? 'text-ink-faint' : 'font-medium text-ink'} ${mono && !empty ? 'font-mono tracking-wide' : ''}`}>
        {empty ? '—' : value}
      </dd>
    </div>
  )
}

function CheckItem({ label, value }) {
  const v = yesNo(value)
  const ok = v === 'Oui'
  const ko = v === 'Non'
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
      <span className="text-sm text-ink-soft">{label}</span>
      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset
        ${ok ? 'bg-teal-50 text-teal-800 ring-teal-200' : ko ? 'bg-red-50 text-red-800 ring-red-200' : 'bg-slate-50 text-ink-muted ring-line'}`}>
        {ok && <Check size={11} strokeWidth={3} aria-hidden="true" />}
        {ko && <X size={11} strokeWidth={3} aria-hidden="true" />}
        {isBlank(v) ? 'Non contrôlé' : v}
      </span>
    </li>
  )
}

function NoteBlock({ label, value }) {
  if (isBlank(value)) return null
  return (
    <div className="flex flex-col gap-1.5 px-4 py-3 sm:px-5">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className="whitespace-pre-line rounded-lg border-l-2 border-brand-600 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-ink-soft">{value}</p>
    </div>
  )
}

function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-ink-faint">
        <Icon size={22} aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        {text && <p className="mt-1 max-w-sm text-sm text-ink-muted text-pretty">{text}</p>}
      </div>
      {action}
    </div>
  )
}

/* ---------------------------------------------------------------- gallery */

function Lightbox({ images, index, onClose, onNav }) {
  const img = images[index]
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNav(1)
      if (e.key === 'ArrowLeft') onNav(-1)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose, onNav])
  if (!img) return null
  return (
    <div role="dialog" aria-modal="true" aria-label="Visionneuse de photos" className="fixed inset-0 z-[130] flex flex-col bg-ink/95">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <p className="min-w-0 truncate text-sm font-medium">{img.name || 'Photo machine'} <span className="text-white/60 tabular-nums">· {index + 1}/{images.length}</span></p>
        <div className="flex items-center gap-1">
          <a href={img.url} download={img.name} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-lg hover:bg-white/10" aria-label="Télécharger la photo">
            <Download size={17} aria-hidden="true" />
          </a>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-lg hover:bg-white/10" aria-label="Fermer" autoFocus>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
        <img src={img.url} alt={img.name || 'Photo machine'} className="max-h-full max-w-full rounded-lg object-contain" />
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => onNav(-1)} className="absolute left-3 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Photo précédente">
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => onNav(1)} className="absolute right-3 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Photo suivante">
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function useLightbox(images) {
  const [index, setIndex] = useState(null)
  const nav = (step) => setIndex((i) => (i == null ? i : (i + step + images.length) % images.length))
  return { index, open: setIndex, close: () => setIndex(null), nav }
}

function HeroGallery({ images, selectedImage, setSelectedImage, previousImage, nextImage, onOpen, designation }) {
  if (!images.length) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-ink-faint">
        <ImageIcon size={28} aria-hidden="true" />
        <p className="text-sm">Aucune photo</p>
      </div>
    )
  }
  const currentIdx = Math.max(0, images.findIndex((img) => (img.publicId || img.url) === (selectedImage?.publicId || selectedImage?.url)))
  return (
    <div className="flex flex-col gap-2">
      <div className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-slate-100">
        <img src={selectedImage?.url} alt={`${designation} — photo ${currentIdx + 1}`} className="size-full object-cover" />
        <button type="button" onClick={() => onOpen(currentIdx)} className="absolute right-2 top-2 grid size-9 place-items-center rounded-lg bg-ink/60 text-white backdrop-blur hover:bg-ink/80" aria-label="Agrandir la photo">
          <Maximize2 size={16} aria-hidden="true" />
        </button>
        {images.length > 1 && (
          <>
            <button type="button" onClick={previousImage} className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-card hover:bg-white" aria-label="Photo précédente">
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={nextImage} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-card hover:bg-white" aria-label="Photo suivante">
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            <span className="absolute bottom-2 left-2 rounded-md bg-ink/60 px-2 py-0.5 text-xs font-medium tabular-nums text-white">{currentIdx + 1}/{images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => {
            const active = i === currentIdx
            return (
              <li key={img.publicId || img.url} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  aria-label={`Afficher la photo ${i + 1}`}
                  aria-current={active ? 'true' : undefined}
                  className={`block size-14 overflow-hidden rounded-lg ring-2 transition ${active ? 'ring-brand-600' : 'ring-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={img.url} alt="" className="size-full object-cover" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- sections */

function TechnicalSection({ machine, warrantyActive, createdAtLabel, updatedAtLabel }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Panel title="Identification" icon={Hash}>
        <dl className="divide-y divide-line">
          <SpecRow label="Code machine" value={machine.code} mono />
          <SpecRow label="Désignation" value={machine.designation} />
          <SpecRow label="Marque" value={machine.brand} />
          <SpecRow label="Modèle" value={machine.model} />
          <SpecRow label="N° de série" value={machine.serialNumber} mono />
          <SpecRow label="Catégorie" value={machine.category} />
          <SpecRow label="Année" value={machine.year} />
        </dl>
      </Panel>

      <Panel title="Approvisionnement & garantie" icon={Truck}>
        <dl className="divide-y divide-line">
          <SpecRow label="Fournisseur" value={machine.supplier} />
          <SpecRow label="Réf. fournisseur" value={machine.referenceFournisseur} mono />
          <SpecRow label="Bon de commande" value={machine.purchaseOrderNumber} mono />
          <SpecRow label="Date de réception" value={fmtDate(machine.receptionDate)} />
          <SpecRow label="Durée de garantie" value={machine.dureeGarantie} />
          <SpecRow
            label="Fin de garantie"
            value={machine.warrantyEndDate ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                {fmtDate(machine.warrantyEndDate)}
                <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${warrantyActive ? 'bg-teal-50 text-teal-800' : 'bg-red-50 text-red-800'}`}>
                  {warrantyActive ? 'Active' : 'Expirée'}
                </span>
              </span>
            ) : ''}
          />
          <SpecRow label="Emplacement interne" value={machine.emplacementInterne} />
        </dl>
      </Panel>

      <Panel title="Contrôle de réception" icon={ClipboardCheck}>
        <ul className="divide-y divide-line">
          <CheckItem label="Test de fonctionnement" value={machine.testFonctionnement} />
          <CheckItem label="Accessoires présents" value={machine.accessoiresPresents} />
          <CheckItem label="Documents présents" value={machine.documentsPresents} />
          <CheckItem label="Validé par le contrôle" value={machine.valideParControle} />
        </ul>
        <dl className="divide-y divide-line border-t border-line">
          <SpecRow label="État à réception" value={machine.etatReception} />
          <SpecRow label="État général" value={machine.etatGeneral} />
          <SpecRow label="Date de contrôle" value={fmtDate(machine.dateControle)} />
        </dl>
      </Panel>

      <Panel title="Constats & observations" icon={AlertCircle}>
        {[machine.problemeConstate, machine.descriptionProbleme, machine.actionRecommandee, machine.observationsReception, machine.notes].every(isBlank) ? (
          <p className="px-5 py-6 text-sm text-ink-muted">Aucun constat enregistré pour cette machine.</p>
        ) : (
          <div className="divide-y divide-line">
            <NoteBlock label="Problème constaté" value={machine.problemeConstate} />
            <NoteBlock label="Description du problème" value={machine.descriptionProbleme} />
            <NoteBlock label="Action recommandée" value={machine.actionRecommandee} />
            <NoteBlock label="Observations à réception" value={machine.observationsReception} />
            <NoteBlock label="Notes" value={machine.notes} />
          </div>
        )}
      </Panel>

      <Panel title="Traçabilité de la fiche" icon={History} className="xl:col-span-2">
        <dl className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0">
          <SpecRow label="Créée le" value={`${createdAtLabel}${machine.createdBy ? ` · ${machine.createdBy}` : ''}`} />
          <SpecRow label="Modifiée le" value={`${updatedAtLabel}${machine.updatedBy ? ` · ${machine.updatedBy}` : ''}`} />
        </dl>
      </Panel>
    </div>
  )
}

function docExt(doc) {
  return doc.name?.split('.').pop()?.toUpperCase() || 'FICHIER'
}

function DocumentsSection({ docs, pdfDoc, setPdfDoc, canManage, onEdit }) {
  if (!docs.length) {
    return (
      <Panel title="Documents" icon={FileText}>
        <EmptyState
          icon={FileText}
          title="Aucun document"
          text="Ajoutez manuels, certificats et bons de livraison depuis la modification de la fiche."
          action={canManage && <button type="button" onClick={onEdit} className="ui-btn-secondary ui-btn-sm"><Edit2 size={14} aria-hidden="true" /> Ajouter des documents</button>}
        />
      </Panel>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
      <Panel title="Documents" icon={FileText} aside={<span className="text-xs tabular-nums text-ink-faint">{docs.length}</span>}>
        <ul className="divide-y divide-line">
          {docs.map((doc) => {
            const ext = docExt(doc)
            const isPdf = ext === 'PDF' || doc.format === 'pdf'
            const active = pdfDoc && doc.publicId === pdfDoc.publicId
            return (
              <li key={doc.publicId || doc.url} className={`flex items-center gap-3 px-4 py-3 ${active ? 'bg-brand-50/60' : ''}`}>
                <span className={`flex h-10 w-9 shrink-0 items-end justify-center rounded-md pb-1 text-[9px] font-bold ${isPdf ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-ink-muted'}`}>{ext.slice(0, 4)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{doc.name}</span>
                  {doc.bytes && <span className="block text-xs tabular-nums text-ink-faint">{(doc.bytes / 1024).toFixed(0)} Ko</span>}
                </span>
                {isPdf && (
                  <button type="button" onClick={() => setPdfDoc(doc)} aria-pressed={active} className={`grid size-8 place-items-center rounded-md ${active ? 'bg-brand-600 text-white' : 'text-ink-muted hover:bg-slate-100'}`} aria-label={`Afficher ${doc.name}`}>
                    <Eye size={15} aria-hidden="true" />
                  </button>
                )}
                <a href={doc.url} download={doc.name} target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-slate-100" aria-label={`Télécharger ${doc.name}`}>
                  <Download size={15} aria-hidden="true" />
                </a>
              </li>
            )
          })}
        </ul>
      </Panel>
      <Panel title={pdfDoc?.name || 'Aperçu'} icon={Eye}>
        {pdfDoc ? (
          <div className="h-[70vh] min-h-[420px]">
            <PdfViewer url={pdfDoc.url} name={pdfDoc.name || 'Documentation machine'} embedded />
          </div>
        ) : (
          <EmptyState icon={Eye} title="Aucun PDF à afficher" text="Seuls les documents PDF peuvent être prévisualisés. Les autres formats sont téléchargeables." />
        )}
      </Panel>
    </div>
  )
}

function GallerySection({ images, onOpen, canManage, onEdit }) {
  if (!images.length) {
    return (
      <Panel title="Photos" icon={ImageIcon}>
        <EmptyState
          icon={ImageIcon}
          title="Aucune photo"
          text="Les photos facilitent l’identification de l’équipement sur site."
          action={canManage && <button type="button" onClick={onEdit} className="ui-btn-secondary ui-btn-sm"><Edit2 size={14} aria-hidden="true" /> Ajouter des photos</button>}
        />
      </Panel>
    )
  }
  return (
    <Panel title="Photos" icon={ImageIcon} aside={<span className="text-xs tabular-nums text-ink-faint">{images.length}</span>}>
      <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, i) => (
          <li key={img.publicId || img.url}>
            <button type="button" onClick={() => onOpen(i)} className="group relative block aspect-square w-full overflow-hidden rounded-lg border border-line bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20">
              <img src={img.url} alt={img.name || `Photo ${i + 1}`} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-ink/70 to-transparent px-2 pb-1.5 pt-6 text-left text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {img.name || `Photo ${i + 1}`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function HistorySection({ loading, error, items, total, page, totalPages, setPage, onOpen }) {
  if (loading) {
    return (
      <Panel title="Historique SAV" icon={History}>
        <div className="flex flex-col gap-3 p-5">{[0, 1, 2].map((i) => <div key={i} className="ui-skeleton h-16 rounded-lg" />)}</div>
      </Panel>
    )
  }
  if (error) {
    return <Panel title="Historique SAV" icon={History}><p className="px-5 py-6 text-sm text-red-700" role="alert">{error}</p></Panel>
  }
  if (!total) {
    return <Panel title="Historique SAV" icon={History}><EmptyState icon={Wrench} title="Aucune intervention" text="Aucune intervention SAV n’a encore été enregistrée pour cette machine." /></Panel>
  }
  return (
    <Panel title="Historique SAV" icon={History} aside={<span className="text-xs tabular-nums text-ink-faint">{total} intervention{total > 1 ? 's' : ''}</span>}>
      <ol className="relative flex flex-col px-4 py-4 sm:px-5">
        <span className="absolute bottom-6 left-[1.65rem] top-6 w-px bg-line sm:left-[1.9rem]" aria-hidden="true" />
        {items.map((it) => (
          <li key={it.id} className="relative flex gap-4 py-2">
            <span className="relative z-10 mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-brand-600">
              <Wrench size={11} className="text-brand-700" aria-hidden="true" />
            </span>
            <button type="button" onClick={() => onOpen(it.id)} className="min-w-0 flex-1 rounded-lg border border-line bg-white px-4 py-3 text-left transition hover:border-brand-200 hover:shadow-card">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-700">{it.id}</span>
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${INTERVENTION_STATUS_BADGE[it.status] || 'bg-slate-100 text-ink-soft'}`}>{getInterventionStatusLabel(it.status)}</span>
                <span className="ml-auto text-xs tabular-nums text-ink-faint">{fmtDate(it.date) || it.date}</span>
              </span>
              <span className="mt-1.5 block text-sm font-medium text-ink text-pretty">{it.typeOfFault}</span>
              {it.interventionSolution && <span className="mt-1 block line-clamp-2 text-xs text-ink-muted">Solution : {it.interventionSolution}</span>}
              {it.technician && <span className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-muted"><User size={12} aria-hidden="true" /> {it.technician}</span>}
            </button>
          </li>
        ))}
      </ol>
      {totalPages > 1 && (
        <nav aria-label="Pagination de l’historique" className="flex items-center justify-between border-t border-line px-4 py-3 sm:px-5">
          <button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1} className="ui-btn-secondary ui-btn-sm"><ChevronLeft size={14} aria-hidden="true" /> Précédent</button>
          <span className="text-xs tabular-nums text-ink-muted">Page {page} sur {totalPages}</span>
          <button type="button" onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="ui-btn-secondary ui-btn-sm">Suivant <ChevronRight size={14} aria-hidden="true" /></button>
        </nav>
      )}
    </Panel>
  )
}

function AssistantSection({ machine, issueInput, setIssueInput, analyzeIssue, loading, error, result }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <Panel title="Décrire la panne" icon={Bot}>
        <form className="flex flex-col gap-3 p-4 sm:p-5" onSubmit={(e) => { e.preventDefault(); analyzeIssue() }}>
          <label htmlFor="ai-issue" className="text-xs font-medium text-ink-muted">
            Symptômes observés sur {machine.designation}
          </label>
          <textarea
            id="ai-issue"
            rows={6}
            value={issueInput}
            onChange={(e) => setIssueInput(e.target.value)}
            placeholder="Ex. L’appareil affiche une erreur E12 au démarrage et le cycle s’interrompt après 5 minutes…"
            className="ui-textarea"
          />
          <button type="submit" disabled={loading || !issueInput.trim()} className="ui-btn-primary">
            {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
            {loading ? 'Analyse en cours…' : 'Analyser la panne'}
          </button>
          <p className="text-xs leading-relaxed text-ink-faint">Suggestions indicatives, à valider par un technicien qualifié.</p>
        </form>
      </Panel>
      <Panel title="Diagnostic suggéré" icon={Lightbulb}>
        <div aria-live="polite">
          {error ? (
            <p className="m-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-inset ring-red-200" role="alert">
              <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> {error}
            </p>
          ) : loading ? (
            <div className="flex flex-col gap-3 p-5">{[0, 1, 2, 3].map((i) => <div key={i} className="ui-skeleton h-5 rounded" />)}</div>
          ) : result ? (
            <div className="grid grid-cols-1 divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0">
              <div className="flex flex-col gap-3 p-4 sm:p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">Causes possibles</p>
                <ol className="flex flex-col gap-2">
                  {result.causes.map((c, i) => (
                    <li key={c} className="flex gap-2.5 text-sm text-ink-soft"><span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-50 text-[11px] font-bold text-amber-800 tabular-nums">{i + 1}</span>{c}</li>
                  ))}
                </ol>
              </div>
              <div className="flex flex-col gap-3 p-4 sm:p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">Solutions recommandées</p>
                <ul className="flex flex-col gap-2">
                  {result.solutions.map((s) => (
                    <li key={s} className="flex gap-2.5 text-sm text-ink-soft"><Check size={15} className="mt-0.5 shrink-0 text-teal-600" aria-hidden="true" />{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <EmptyState icon={Sparkles} title="En attente d’une description" text="Décrivez les symptômes pour obtenir des causes probables et des pistes de résolution." />
          )}
        </div>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------- view */

export default function MachineSheetView(props) {
  const {
    machine, navigate, id, error, canManageMachines, deleting, onConfirmDelete,
    activeTab, setActiveTab, docs, pdfDoc, setPdfDoc, images, selectedImage, setSelectedImage, previousImage, nextImage,
    warrantyActive, createdAtLabel, updatedAtLabel, interventionCards, interventionsLoading, interventionsError,
    paginatedHistory, safeHistoryPage, historyTotalPages, setHistoryPage,
    issueInput, setIssueInput, analyzeIssue, assistantLoading, assistantError, assistantResult,
  } = props
  const [confirmDelete, setConfirmDelete] = useState(false)
  const lightbox = useLightbox(images)
  const status = machineStatus(machine.status)
  const lastIntervention = interventionCards[0]
  const isClientMachine = machine.ownerType === 'CLIENT'
  const goEdit = () => navigate(isClientMachine ? `/machines/${id}/edit-client` : `/machines/${id}/edit`)
  const openIntervention = (iid) => navigate(`/interventions/${iid}`)

  const counts = { documents: docs.length, gallery: images.length, intervention: interventionCards.length }

  const kpis = [
    { label: 'Interventions SAV', value: interventionsLoading ? '…' : interventionCards.length, icon: Wrench },
    { label: 'Dernière intervention', value: lastIntervention ? (fmtDate(lastIntervention.date) || lastIntervention.date) : 'Aucune', icon: CalendarDays },
    { label: 'Garantie', value: warrantyActive === null ? 'Non définie' : warrantyActive ? `Jusqu’au ${fmtDate(machine.warrantyEndDate)}` : 'Expirée', icon: warrantyActive === false ? ShieldOff : ShieldCheck, tone: warrantyActive === false ? 'text-red-700' : warrantyActive ? 'text-teal-700' : '' },
    { label: 'Documents · photos', value: `${docs.length} · ${images.length}`, icon: Package },
  ]

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 pt-3 text-xs text-ink-muted sm:px-6">
          <button type="button" onClick={() => navigate('/machines')} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium hover:bg-slate-100 hover:text-ink">
            <ChevronLeft size={14} aria-hidden="true" /> Parc machines
          </button>
          <span aria-hidden="true">/</span>
          <span className="truncate font-mono">{machine.code || `#${machine.id}`}</span>
        </div>

        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <HeroGallery
            images={images}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            previousImage={previousImage}
            nextImage={nextImage}
            onOpen={lightbox.open}
            designation={machine.designation}
          />

          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-navy px-2 py-1 font-mono text-xs font-bold tracking-wider text-white">{machine.code || `#${machine.id}`}</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${status.className}`}>
                    <span className={`size-1.5 rounded-full ${status.dot}`} aria-hidden="true" /> {status.label}
                  </span>
                  {machine.category && <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-ink-soft">{machine.category}</span>}
                  {isClientMachine && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200">
                      <User size={11} aria-hidden="true" /> Machine Client
                    </span>
                  )}
                </div>
                <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink text-balance sm:text-3xl">{machine.designation}</h1>
                <p className="mt-1 text-sm text-ink-muted">
                  {[machine.brand, machine.model].filter(Boolean).join(' · ') || 'Marque et modèle non renseignés'}
                </p>
              </div>
              {canManageMachines && (
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => setConfirmDelete(true)} disabled={deleting} className="ui-btn-secondary text-red-700 hover:bg-red-50" aria-label="Supprimer la machine">
                    <Trash2 size={15} aria-hidden="true" /> <span className="hidden sm:inline">Supprimer</span>
                  </button>
                  <button type="button" onClick={goEdit} className="ui-btn-primary">
                    <Edit2 size={15} aria-hidden="true" /> Modifier
                  </button>
                </div>
              )}
            </div>

            <dl className="grid grid-cols-1 overflow-hidden rounded-xl border border-line bg-slate-50/60 sm:grid-cols-3">
              {[
                { label: 'N° de série', value: machine.serialNumber, mono: true, icon: Hash },
                { label: 'Fournisseur', value: machine.supplier, icon: Building2 },
                { label: 'Réception', value: fmtDate(machine.receptionDate), icon: CalendarDays },
              ].map(({ label, value, mono, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                  <Icon size={15} className="shrink-0 text-ink-faint" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="text-[11px] font-medium text-ink-faint">{label}</dt>
                    <dd className={`truncate text-sm font-semibold text-ink ${mono ? 'font-mono tracking-wide' : ''}`}>{isBlank(value) ? '—' : value}</dd>
                  </div>
                </div>
              ))}
            </dl>

            <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {kpis.map(({ label, value, icon: Icon, tone }) => (
                <li key={label} className="flex flex-col gap-1 rounded-xl border border-line bg-white px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs text-ink-muted"><Icon size={13} aria-hidden="true" /> {label}</span>
                  <span className={`truncate text-sm font-semibold tabular-nums ${tone || 'text-ink'}`}>{value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <nav aria-label="Sections de la fiche" className="mx-auto w-full max-w-7xl overflow-x-auto px-4 sm:px-6">
          <ul className="flex gap-1">
            {SECTIONS.map(({ key, label, icon: Icon }) => {
              const active = activeTab === key
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(key)}
                    aria-current={active ? 'page' : undefined}
                    className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${active ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-muted hover:text-ink'}`}
                  >
                    <Icon size={15} aria-hidden="true" /> {label}
                    {counts[key] > 0 && <span className={`rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${active ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-ink-muted'}`}>{counts[key]}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-inset ring-red-200">
            <AlertCircle size={16} aria-hidden="true" /> {error}
          </p>
        )}
        {activeTab === 'general' && (
          <>
            {isClientMachine && (
              <Panel title="Client propriétaire" icon={User}>
                <div className="relative overflow-hidden">
                  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-navy font-display text-base font-bold text-white">
                      {String(machine.client || '?').charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">Propriétaire</p>
                      <p className="mt-0.5 font-display text-base font-bold text-ink">{machine.client || '—'}</p>
                      <div className="mt-1.5 grid grid-cols-1 gap-y-1 text-xs text-ink-muted sm:grid-cols-2">
                        {machine.clientSite && (
                          <span className="flex items-center gap-1.5">
                            <Building2 size={12} className="shrink-0 text-ink-faint" aria-hidden="true" />
                            {machine.clientSite}
                          </span>
                        )}
                        {machine.clientContact && (
                          <span className="flex items-center gap-1.5">
                            <User size={12} className="shrink-0 text-ink-faint" aria-hidden="true" />
                            {machine.clientContact}
                            {machine.clientContactPhone ? ` · ${machine.clientContactPhone}` : ''}
                          </span>
                        )}
                        {machine.workshopStatus === 'IN_WORKSHOP' && (
                          <span className="flex items-center gap-1.5 text-amber-700 font-semibold sm:col-span-2">
                            <Wrench size={12} aria-hidden="true" />
                            En atelier SOMACS
                            {machine.workshopReceivedAt ? ` depuis le ${fmtDate(machine.workshopReceivedAt)}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    {machine.clientId && (
                      <button
                        type="button"
                        onClick={() => navigate(`/clients/${machine.clientId}/360`)}
                        className="ui-btn-secondary shrink-0"
                      >
                        <Eye size={14} aria-hidden="true" /> Fiche client
                      </button>
                    )}
                  </div>
                </div>
              </Panel>
            )}
            <TechnicalSection machine={machine} warrantyActive={warrantyActive} createdAtLabel={createdAtLabel} updatedAtLabel={updatedAtLabel} />
          </>
        )}
        {activeTab === 'documents' && <DocumentsSection docs={docs} pdfDoc={pdfDoc} setPdfDoc={setPdfDoc} canManage={canManageMachines} onEdit={goEdit} />}
        {activeTab === 'gallery' && <GallerySection images={images} onOpen={lightbox.open} canManage={canManageMachines} onEdit={goEdit} />}
        {activeTab === 'intervention' && (
          <HistorySection
            loading={interventionsLoading}
            error={interventionsError}
            items={paginatedHistory}
            total={interventionCards.length}
            page={safeHistoryPage}
            totalPages={historyTotalPages}
            setPage={setHistoryPage}
            onOpen={openIntervention}
          />
        )}
        {activeTab === 'assistant' && (
          <AssistantSection
            machine={machine}
            issueInput={issueInput}
            setIssueInput={setIssueInput}
            analyzeIssue={analyzeIssue}
            loading={assistantLoading}
            error={assistantError}
            result={assistantResult}
          />
        )}
      </main>

      {lightbox.index != null && <Lightbox images={images} index={lightbox.index} onClose={lightbox.close} onNav={lightbox.nav} />}

      <ConfirmDialog
        open={confirmDelete}
        tone="danger"
        title="Supprimer cette machine ?"
        message={`« ${machine.designation} » (${machine.code || `#${machine.id}`}) sera retirée du parc. Les interventions existantes restent consultables.`}
        confirmLabel="Supprimer définitivement"
        busy={deleting}
        busyLabel="Suppression…"
        onClose={() => !deleting && setConfirmDelete(false)}
        onConfirm={async () => { await onConfirmDelete(); setConfirmDelete(false) }}
      />
    </div>
  )
}
