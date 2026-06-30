import { useState, useEffect, useRef } from 'react'

/**
 * Detects browser zoom level changes and returns a percentage value.
 * Used to switch between horizontal/vertical progress indicators.
 */
export function useZoomDetection() {
  const [uiZoomPercent, setUiZoomPercent] = useState(100)
  const baseDprRef = useRef(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const toPercent = (value) => {
      const n = Number(value)
      if (!Number.isFinite(n) || n <= 0) return null
      return Math.round(n * 100)
    }

    const computeZoomPercent = () => {
      const base = baseDprRef.current || 1
      const current = window.devicePixelRatio || 1
      const byDpr = Math.round((current / base) * 100)

      const byWindowRatio =
        window.innerWidth > 0 && window.outerWidth > 0
          ? Math.round((window.outerWidth / window.innerWidth) * 100)
          : null

      const viewportScale = window.visualViewport?.scale
      const byViewport = toPercent(viewportScale)

      let next = byWindowRatio
      if (!next || next === 100) next = byViewport
      if (!next || next === 100) next = byDpr
      if (!next || !Number.isFinite(next)) next = 100

      setUiZoomPercent(next)
    }

    computeZoomPercent()
    window.addEventListener('resize', computeZoomPercent)
    window.visualViewport?.addEventListener('resize', computeZoomPercent)

    return () => {
      window.removeEventListener('resize', computeZoomPercent)
      window.visualViewport?.removeEventListener('resize', computeZoomPercent)
    }
  }, [])

  return uiZoomPercent
}
