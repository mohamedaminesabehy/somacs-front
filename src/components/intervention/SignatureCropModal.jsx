import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Crop, RotateCcw, X } from 'lucide-react'
import {
  detectSignatureRegion,
  loadImageFromFile,
  processSignatureImage,
} from '../../utils/signatureImage'

// Lightweight, dependency-free crop modal.
// The user drags a rectangle over the captured photo to keep only the useful
// signature area. The selection is rendered in display pixels and converted
// back to source pixels on validation, then processed (white removed, trimmed,
// optimised) into a transparent PNG.

const HANDLE = 14

export default function SignatureCropModal({ file, title, onCancel, onValidate }) {
  const containerRef = useRef(null)
  const imgRef = useRef(null)
  const [image, setImage] = useState(null)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  // Selection in *display* coordinates (relative to the rendered image).
  const [layout, setLayout] = useState(null) // { dispW, dispH, scale }
  const [sel, setSel] = useState(null) // { x, y, w, h } in display px
  const dragRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setError('')
    loadImageFromFile(file)
      .then((img) => {
        if (!cancelled) setImage(img)
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger l'image.")
      })
    return () => {
      cancelled = true
    }
  }, [file])

  const computeLayout = useCallback(() => {
    if (!image || !containerRef.current) return
    const maxW = containerRef.current.clientWidth
    const maxH = containerRef.current.clientHeight
    const natW = image.naturalWidth || image.width
    const natH = image.naturalHeight || image.height
    const scale = Math.min(maxW / natW, maxH / natH, 1)
    const dispW = Math.round(natW * scale)
    const dispH = Math.round(natH * scale)
    setLayout({ dispW, dispH, scale, natW, natH })

    // Initial selection: auto-detected ink region, else centred 80%.
    const region = detectSignatureRegion(image)
    if (region) {
      setSel({
        x: region.x * scale,
        y: region.y * scale,
        w: region.width * scale,
        h: region.height * scale,
      })
    } else {
      setSel({
        x: dispW * 0.1,
        y: dispH * 0.1,
        w: dispW * 0.8,
        h: dispH * 0.8,
      })
    }
  }, [image])

  useEffect(() => {
    computeLayout()
    window.addEventListener('resize', computeLayout)
    return () => window.removeEventListener('resize', computeLayout)
  }, [computeLayout])

  const clampSel = useCallback(
    (next) => {
      if (!layout) return next
      const minSize = 24
      let { x, y, w, h } = next
      w = Math.max(minSize, Math.min(w, layout.dispW))
      h = Math.max(minSize, Math.min(h, layout.dispH))
      x = Math.max(0, Math.min(x, layout.dispW - w))
      y = Math.max(0, Math.min(y, layout.dispH - h))
      return { x, y, w, h }
    },
    [layout],
  )

  const pointFromEvent = (event) => {
    const rect = imgRef.current.getBoundingClientRect()
    const cx = event.touches ? event.touches[0].clientX : event.clientX
    const cy = event.touches ? event.touches[0].clientY : event.clientY
    return { x: cx - rect.left, y: cy - rect.top }
  }

  const onPointerDown = (mode) => (event) => {
    event.preventDefault()
    event.stopPropagation()
    const p = pointFromEvent(event)
    dragRef.current = { mode, start: p, origin: sel }
  }

  const onPointerMove = useCallback(
    (event) => {
      if (!dragRef.current || !sel) return
      const p = pointFromEvent(event)
      const { mode, start, origin } = dragRef.current
      const dx = p.x - start.x
      const dy = p.y - start.y
      let next = { ...origin }

      if (mode === 'move') {
        next.x = origin.x + dx
        next.y = origin.y + dy
      } else {
        if (mode.includes('e')) next.w = origin.w + dx
        if (mode.includes('s')) next.h = origin.h + dy
        if (mode.includes('w')) {
          next.x = origin.x + dx
          next.w = origin.w - dx
        }
        if (mode.includes('n')) {
          next.y = origin.y + dy
          next.h = origin.h - dy
        }
      }
      setSel(clampSel(next))
    },
    [sel, clampSel],
  )

  useEffect(() => {
    const stop = () => {
      dragRef.current = null
    }
    window.addEventListener('mousemove', onPointerMove)
    window.addEventListener('touchmove', onPointerMove, { passive: false })
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchend', stop)
    return () => {
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('touchmove', onPointerMove)
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('touchend', stop)
    }
  }, [onPointerMove])

  const resetSelection = () => computeLayout()

  const handleValidate = async () => {
    if (!image || !layout || !sel) return
    setProcessing(true)
    try {
      const region = {
        x: sel.x / layout.scale,
        y: sel.y / layout.scale,
        width: sel.w / layout.scale,
        height: sel.h / layout.scale,
      }
      const result = await processSignatureImage(image, region)
      onValidate(result)
    } catch {
      setError('Le traitement de la signature a échoué.')
      setProcessing(false)
    }
  }

  const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
  const handleStyle = (pos) => {
    if (!sel) return {}
    const map = {
      nw: { left: sel.x, top: sel.y },
      n: { left: sel.x + sel.w / 2, top: sel.y },
      ne: { left: sel.x + sel.w, top: sel.y },
      e: { left: sel.x + sel.w, top: sel.y + sel.h / 2 },
      se: { left: sel.x + sel.w, top: sel.y + sel.h },
      s: { left: sel.x + sel.w / 2, top: sel.y + sel.h },
      sw: { left: sel.x, top: sel.y + sel.h },
      w: { left: sel.x, top: sel.y + sel.h / 2 },
    }
    const cursorMap = {
      nw: 'nwse-resize', se: 'nwse-resize',
      ne: 'nesw-resize', sw: 'nesw-resize',
      n: 'ns-resize', s: 'ns-resize',
      e: 'ew-resize', w: 'ew-resize',
    }
    return {
      left: map[pos].left - HANDLE / 2,
      top: map[pos].top - HANDLE / 2,
      width: HANDLE,
      height: HANDLE,
      cursor: cursorMap[pos],
    }
  }

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
            Sélectionnez uniquement la zone de la signature. Le fond blanc sera supprimé automatiquement.
          </p>
          <div
            ref={containerRef}
            className="relative mx-auto flex items-center justify-center bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#f8fafc_0%_50%)] bg-[length:18px_18px] rounded-xl overflow-hidden"
            style={{ width: '100%', height: '52vh' }}
          >
            {error ? (
              <p className="text-xs font-bold text-red-500 px-4 text-center">{error}</p>
            ) : !layout ? (
              <p className="text-xs font-semibold text-slate-400">Chargement…</p>
            ) : (
              <div
                className="relative"
                style={{ width: layout.dispW, height: layout.dispH }}
              >
                <img
                  ref={imgRef}
                  src={image?.src}
                  alt={title}
                  draggable={false}
                  className="absolute inset-0 w-full h-full select-none"
                />
                {sel && (
                  <>
                    {/* Dim overlay outside selection */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'rgba(15,23,42,0.5)',
                        clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${sel.x}px ${sel.y}px, ${sel.x}px ${sel.y + sel.h}px, ${sel.x + sel.w}px ${sel.y + sel.h}px, ${sel.x + sel.w}px ${sel.y}px, ${sel.x}px ${sel.y}px)`,
                      }}
                    />
                    <div
                      className="absolute border-2 border-[#0052CC] cursor-move"
                      style={{ left: sel.x, top: sel.y, width: sel.w, height: sel.h }}
                      onMouseDown={onPointerDown('move')}
                      onTouchStart={onPointerDown('move')}
                    />
                    {handles.map((pos) => (
                      <div
                        key={pos}
                        className="absolute bg-white border-2 border-[#0052CC] rounded-sm"
                        style={handleStyle(pos)}
                        onMouseDown={onPointerDown(pos)}
                        onTouchStart={onPointerDown(pos)}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-100 shrink-0 flex items-center gap-3">
          <button
            type="button"
            onClick={resetSelection}
            disabled={processing || !layout}
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
            disabled={processing || !layout || !!error}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#0052CC] text-white text-[10px] font-black uppercase tracking-wider hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            <Check size={14} />
            {processing ? 'Traitement…' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  )
}
