import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Crop, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { loadImageFromFile, processSignatureImage } from '../../utils/signatureImage'

// Zoom / pan / crop modal — dependency-free.
//
// Model (avatar-cropper style): the whole gray viewport IS the crop frame.
// The image is rendered behind it with a transform (scale + translate). The
// user zooms (buttons / slider) and pans (drag, mouse or touch) to place the
// signature inside the frame, then validates. On validation we map the
// viewport rectangle back to the *source* image pixels and process it into a
// clean transparent PNG. Because the math uses the real display scale and
// offset, the crop stays accurate at any zoom / pan.

const MIN_ZOOM = 1
const MAX_ZOOM = 5

function getNaturalSize(image) {
  return {
    natW: image ? image.naturalWidth || image.width : 0,
    natH: image ? image.naturalHeight || image.height : 0,
  }
}

function getCenteredOffset(viewportWidth, viewportHeight, imageWidth, imageHeight) {
  return {
    x: (viewportWidth - imageWidth) / 2,
    y: (viewportHeight - imageHeight) / 2,
  }
}

function clampImageOffset(next, scale, viewport, natW, natH) {
  const imgW = natW * scale
  const imgH = natH * scale
  let { x, y } = next

  x = imgW <= viewport.w
    ? (viewport.w - imgW) / 2
    : Math.min(0, Math.max(viewport.w - imgW, x))
  y = imgH <= viewport.h
    ? (viewport.h - imgH) / 2
    : Math.min(0, Math.max(viewport.h - imgH, y))

  return { x, y }
}

function getCropRegion({ baseScale, zoom, offset, viewport, natW, natH }) {
  const scale = baseScale * zoom
  const srcX = -offset.x / scale
  const srcY = -offset.y / scale
  const srcW = viewport.w / scale
  const srcH = viewport.h / scale
  const x = Math.max(0, srcX)
  const y = Math.max(0, srcY)
  const width = Math.min(natW - x, srcW - (x - srcX))
  const height = Math.min(natH - y, srcH - (y - srcY))

  return {
    x,
    y,
    width: Math.max(1, width),
    height: Math.max(1, height),
  }
}

function getPointFromEvent(event) {
  const e = event.touches ? event.touches[0] : event
  return { x: e.clientX, y: e.clientY }
}

function getImageStyle(image, natW, natH, displayScale, offset) {
  if (!image) return {}
  return {
    position: 'absolute',
    left: 0,
    top: 0,
    width: `${natW * displayScale}px`,
    height: `${natH * displayScale}px`,
    transform: `translate(${offset.x}px, ${offset.y}px)`,
    transformOrigin: 'top left',
    userSelect: 'none',
    pointerEvents: 'none',
    maxWidth: 'none',
  }
}

export default function SignatureCropModal({ file, title, onCancel, onValidate }) {
  const viewportRef = useRef(null)
  const [image, setImage] = useState(null)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [viewport, setViewport] = useState({ w: 0, h: 0 })
  const [baseScale, setBaseScale] = useState(1) // contain-fit scale (source→display)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 }) // top-left of image in viewport px
  const dragRef = useRef(null)

  // ── Load the captured image (persistent data URL, no early revoke) ──
  useEffect(() => {
    let cancelled = false
    setError('')
    setImage(null)
    loadImageFromFile(file)
      .then((img) => {
        if (!cancelled) setImage(img)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Impossible d'afficher l'image, veuillez réessayer")
        }
      })
    return () => {
      cancelled = true
    }
  }, [file])

  const { natW, natH } = getNaturalSize(image)
  const displayScale = baseScale * zoom

  // Keep the image covering the viewport when possible; clamp panning.
  const clampOffset = useCallback(
    (next, scale = displayScale, vp = viewport) => {
      return clampImageOffset(next, scale, vp, natW, natH)
    },
    [displayScale, viewport, natW, natH],
  )

  const fitImage = useCallback(() => {
    if (!image || !viewportRef.current) return
    const w = viewportRef.current.clientWidth
    const h = viewportRef.current.clientHeight
    const vp = { w, h }
    setViewport(vp)
    const fit = Math.min(w / natW, h / natH) || 1
    setBaseScale(fit)
    setZoom(1)
    const imgW = natW * fit
    const imgH = natH * fit
    setOffset(getCenteredOffset(w, h, imgW, imgH))
  }, [image, natW, natH])

  useEffect(() => {
    fitImage()
    window.addEventListener('resize', fitImage)
    return () => window.removeEventListener('resize', fitImage)
  }, [fitImage])

  // ── Zoom keeping the viewport centre stable ──
  const applyZoom = useCallback(
    (nextZoom) => {
      const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom))
      const oldScale = baseScale * zoom
      const newScale = baseScale * z
      const cx = viewport.w / 2
      const cy = viewport.h / 2
      // Source point under the viewport centre stays under the centre.
      const srcX = (cx - offset.x) / oldScale
      const srcY = (cy - offset.y) / oldScale
      const nextOffset = {
        x: cx - srcX * newScale,
        y: cy - srcY * newScale,
      }
      setZoom(z)
      setOffset(clampOffset(nextOffset, newScale, viewport))
    },
    [baseScale, zoom, offset, viewport, clampOffset],
  )

  // ── Pan (mouse + touch) ──
  const onDragStart = (event) => {
    if (!image) return
    const p = getPointFromEvent(event)
    dragRef.current = { start: p, origin: { ...offset } }
  }

  const onDragMove = useCallback(
    (event) => {
      if (!dragRef.current) return
      if (event.cancelable) event.preventDefault()
      const p = getPointFromEvent(event)
      const dx = p.x - dragRef.current.start.x
      const dy = p.y - dragRef.current.start.y
      const next = {
        x: dragRef.current.origin.x + dx,
        y: dragRef.current.origin.y + dy,
      }
      setOffset(clampOffset(next))
    },
    [clampOffset],
  )

  useEffect(() => {
    const stop = () => {
      dragRef.current = null
    }
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('touchmove', onDragMove, { passive: false })
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchend', stop)
    return () => {
      window.removeEventListener('mousemove', onDragMove)
      window.removeEventListener('touchmove', onDragMove)
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('touchend', stop)
    }
  }, [onDragMove])

  const handleValidate = async () => {
    if (!image || !viewport.w) return
    setProcessing(true)
    try {
      // Map the viewport (the crop frame) back to source-image pixels.
      const region = getCropRegion({ baseScale, zoom, offset, viewport, natW, natH })
      const result = await processSignatureImage(image, region)
      if (!result?.blob) {
        throw new Error('Traitement échoué')
      }
      onValidate(result)
    } catch (err) {
      setError(err?.message || 'Le traitement de la signature a échoué.')
      setProcessing(false)
    }
  }

  const imgStyle = getImageStyle(image, natW, natH, displayScale, offset)

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-white w-[min(100%,38rem)] max-h-[94dvh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
              <Crop size={18} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs sm:text-sm">Recadrer la signature</h3>
              <p className="text-[10px] font-semibold text-slate-400">{title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors"
            aria-label="Annuler"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 bg-slate-100 flex-1 overflow-hidden">
          <p className="text-[10px] sm:text-xs text-slate-500 font-semibold text-center mb-3">
            Zoomez et déplacez l'image pour cadrer la signature dans le cadre. Le fond blanc sera supprimé automatiquement.
          </p>
          <div
            ref={viewportRef}
            className="relative mx-auto overflow-hidden rounded-xl bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#f8fafc_0%_50%)] bg-[length:18px_18px] touch-none"
            style={{ width: '100%', height: '50vh', cursor: image ? 'grab' : 'default' }}
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
          >
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <p className="text-xs font-bold text-red-500 text-center">{error}</p>
              </div>
            ) : !image ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs font-semibold text-slate-400">Chargement…</p>
              </div>
            ) : (
              <>
                <img src={image._dataUrl} alt={title} draggable={false} style={imgStyle} />
                {/* Crop frame border */}
                <div className="absolute inset-0 pointer-events-none border-2 border-brand-600 rounded-xl" />
              </>
            )}
          </div>

          {/* Zoom controls */}
          {image && !error && (
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => applyZoom(zoom - 0.25)}
                disabled={zoom <= MIN_ZOOM}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Zoom arrière"
              >
                <ZoomOut size={16} />
              </button>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step="0.01"
                value={zoom}
                onChange={(e) => applyZoom(Number(e.target.value))}
                className="flex-1 accent-brand-600"
                aria-label="Niveau de zoom"
              />
              <button
                type="button"
                onClick={() => applyZoom(zoom + 0.25)}
                disabled={zoom >= MAX_ZOOM}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Zoom avant"
              >
                <ZoomIn size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-100 shrink-0 flex items-center gap-3">
          <button
            type="button"
            onClick={fitImage}
            disabled={processing || !image}
            className="inline-flex items-center gap-1.5 px-3 py-3 rounded-xl border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RotateCcw size={14} />
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleValidate}
            disabled={processing || !image || !!error}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-xl bg-brand-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            <Check size={14} />
            {processing ? 'Traitement…' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  )
}
