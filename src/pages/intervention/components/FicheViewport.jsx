import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, Minus, Plus, ScanLine, X } from 'lucide-react'
import FicheContent from '../../../components/intervention/FicheContent'

// Same reference width as FichePreviewFrame: the official sheet is laid out at 560px
// and only ever scaled from the outside, never reflowed.
const FICHE_WIDTH = 560
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2
const ZOOM_STEP = 0.1

function useSheetHeight(sheetRef) {
  const [sheetHeight, setSheetHeight] = useState(Math.round(FICHE_WIDTH * 1.414))

  useLayoutEffect(() => {
    if (!sheetRef.current || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(([entry]) => setSheetHeight(entry.target.offsetHeight))
    observer.observe(sheetRef.current)
    return () => observer.disconnect()
  }, [sheetRef])

  return sheetHeight
}

// Scale that makes the sheet fit the area's width and, when fitHeight is set, its height too.
function useFitScale(ref, { padding = 0, sheetHeight, fitHeight = false } = {}) {
  const [fit, setFit] = useState(1)
  const measure = useCallback(() => {
    if (!ref.current) return
    const byWidth = (ref.current.clientWidth - padding) / FICHE_WIDTH
    const byHeight = fitHeight && sheetHeight ? (ref.current.clientHeight - padding) / sheetHeight : Infinity
    setFit(Math.max(MIN_ZOOM, Math.min(byWidth, byHeight)))
  }, [ref, padding, sheetHeight, fitHeight])

  useLayoutEffect(() => {
    measure()
    if (!ref.current || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(measure)
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [measure, ref])

  return fit
}

function ScaledSheet({ scale, sheetRef, sheetHeight, ficheProps }) {
  return (
    <div style={{ width: `${FICHE_WIDTH * scale}px`, height: `${sheetHeight * scale}px`, margin: '0 auto' }}>
      <div style={{ width: `${FICHE_WIDTH}px`, transformOrigin: 'top left', transform: `scale(${scale})` }}>
        <div
          ref={sheetRef}
          className="bg-white shadow-modal px-7 pt-5 pb-8 relative overflow-hidden border border-slate-300 text-slate-900 leading-none"
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          <FicheContent {...ficheProps} />
        </div>
      </div>
    </div>
  )
}

function ZoomControls({ zoom, onZoom, onFit, isFit }) {
  const pct = Math.round(zoom * 100)
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5" role="group" aria-label="Zoom de l'aperçu">
      <button
        type="button"
        onClick={() => onZoom(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
        disabled={zoom <= MIN_ZOOM}
        className="grid size-7 place-items-center rounded-md text-ink-muted hover:bg-slate-100 hover:text-ink disabled:opacity-40"
        aria-label="Dézoomer"
      >
        <Minus size={14} aria-hidden="true" />
      </button>
      <span className="w-11 text-center text-xs font-semibold tabular-nums text-ink" aria-live="polite">{pct}%</span>
      <button
        type="button"
        onClick={() => onZoom(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
        disabled={zoom >= MAX_ZOOM}
        className="grid size-7 place-items-center rounded-md text-ink-muted hover:bg-slate-100 hover:text-ink disabled:opacity-40"
        aria-label="Zoomer"
      >
        <Plus size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onFit}
        aria-pressed={isFit}
        className={`ml-0.5 inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold ${isFit ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-slate-100 hover:text-ink'}`}
      >
        <ScanLine size={13} aria-hidden="true" /> Ajuster
      </button>
    </div>
  )
}

function FullscreenPreview({ onClose, ficheProps, title }) {
  const areaRef = useRef(null)
  const sheetRef = useRef(null)
  const sheetHeight = useSheetHeight(sheetRef)
  const fit = useFitScale(areaRef, { padding: 64 })
  const [manualZoom, setManualZoom] = useState(null)
  const zoom = manualZoom ?? Math.min(fit, 1.6)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-slate-900/95" role="dialog" aria-modal="true" aria-label="Aperçu plein écran de la fiche">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-slate-900 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Aperçu plein écran</p>
          <h2 className="truncate text-sm font-semibold text-white">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <ZoomControls zoom={zoom} onZoom={setManualZoom} onFit={() => setManualZoom(null)} isFit={manualZoom === null} />
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"
            aria-label="Fermer l'aperçu plein écran"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div ref={areaRef} className="flex-1 overflow-auto px-4 py-8 sm:px-8">
        <ScaledSheet scale={zoom} sheetRef={sheetRef} sheetHeight={sheetHeight} ficheProps={ficheProps} />
      </div>
    </div>,
    document.body,
  )
}

/**
 * fitHeight: "Ajuster" also fits the sheet to the available height, so the whole
 * official sheet is visible without inner scrolling (the parent must give it a height).
 */
export default function FicheViewport({ title = 'Fiche d’intervention officielle', eyebrow = 'Aperçu en direct', reference, fitHeight = false, ...ficheProps }) {
  const areaRef = useRef(null)
  const sheetRef = useRef(null)
  const sheetHeight = useSheetHeight(sheetRef)
  const fit = useFitScale(areaRef, { sheetHeight, fitHeight })
  const [manualZoom, setManualZoom] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)
  // Inline, "fit" never enlarges beyond the reference size.
  const zoom = manualZoom ?? Math.min(fit, 1)

  return (
    <div className={`flex min-w-0 flex-col gap-3 ${fitHeight ? 'h-full min-h-0' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 basis-40">
          <p className="ui-eyebrow">{eyebrow}</p>
          <h2 className="text-sm font-semibold leading-snug text-ink text-pretty">{title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {reference}
          <ZoomControls zoom={zoom} onZoom={setManualZoom} onFit={() => setManualZoom(null)} isFit={manualZoom === null} />
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs font-semibold text-ink hover:bg-slate-50"
            aria-label="Afficher la fiche en plein écran"
          >
            <Maximize2 size={14} aria-hidden="true" /> <span className="hidden 2xl:inline">Plein écran</span>
          </button>
        </div>
      </div>
      <div ref={areaRef} className={fitHeight ? 'min-h-0 flex-1 overflow-auto' : 'overflow-x-auto pb-1'}>
        <ScaledSheet scale={zoom} sheetRef={sheetRef} sheetHeight={sheetHeight} ficheProps={ficheProps} />
      </div>
      {fullscreen && <FullscreenPreview onClose={() => setFullscreen(false)} ficheProps={ficheProps} title={title} />}
    </div>
  )
}
