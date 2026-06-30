import React, { useCallback, useEffect, useRef, useState } from 'react'
import FicheContent from './FicheContent'

const FICHE_WIDTH = 560

export default function FichePreviewFrame({
  interventionData,
  parts,
  laborPrice,
  logo,
  technicianSignatureUrl,
  clientSignatureUrl,
  rounded = false,
}) {
  const wrapperRef = useRef(null)
  const [scale, setScale] = useState(1)

  const computeScale = useCallback(() => {
    if (!wrapperRef.current) return
    const available = wrapperRef.current.clientWidth
    setScale(Math.min(1, available / FICHE_WIDTH))
  }, [])

  useEffect(() => {
    computeScale()
    window.addEventListener('resize', computeScale)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', computeScale)
    }
    return () => {
      window.removeEventListener('resize', computeScale)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', computeScale)
      }
    }
  }, [computeScale])

  return (
    <div ref={wrapperRef} className="flex-1 overflow-y-auto bg-slate-100 no-scrollbar p-3">
      <div style={{ width: `${FICHE_WIDTH * scale}px`, height: `${Math.round(FICHE_WIDTH * scale * 1.414)}px`, margin: '0 auto' }}>
        <div style={{ width: `${FICHE_WIDTH}px`, transformOrigin: 'top left', transform: `scale(${scale})` }}>
          <div className={`bg-white shadow-2xl px-7 pt-5 pb-8 relative transition-all duration-700 overflow-hidden border border-slate-300 text-slate-900 leading-none ${rounded ? 'rounded-none' : ''}`} style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            <FicheContent
              interventionData={interventionData}
              parts={parts}
              laborPrice={laborPrice}
              logo={logo}
              technicianSignatureUrl={technicianSignatureUrl}
              clientSignatureUrl={clientSignatureUrl}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
