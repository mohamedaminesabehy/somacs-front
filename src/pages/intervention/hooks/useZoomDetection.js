import { useState, useEffect, useRef } from 'react'

// ─── Pure helper functions (extracted to reduce duplication & complexity) ──────

/**
 * Safely converts a value to a rounded percentage.
 * Returns null if value is not a positive finite number.
 */
export function getZoomPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100)
}

/**
 * Returns the zoom level derived from the device pixel ratio.
 */
export function getDevicePixelRatioZoom(baseDpr) {
  const base = baseDpr || 1
  const current = window.devicePixelRatio || 1
  return Math.round((current / base) * 100)
}

/**
 * Returns the zoom level derived from outer/inner width ratio.
 * Returns null if dimensions are not valid.
 */
export function getViewportWidthZoom() {
  if (window.innerWidth <= 0 || window.outerWidth <= 0) return null
  return Math.round((window.outerWidth / window.innerWidth) * 100)
}

/**
 * Returns the zoom level from the Visual Viewport API scale.
 * Returns null if not available.
 */
export function getVisualViewportZoom() {
  return getZoomPercent(window.visualViewport?.scale)
}

/**
 * Resolves the best zoom percentage from multiple detection methods.
 * Priority: window ratio → viewport scale → device pixel ratio → 100.
 */
export function detectZoomLevel(baseDpr) {
  const byWindowRatio = getViewportWidthZoom()
  const byViewport = getVisualViewportZoom()
  const byDpr = getDevicePixelRatioZoom(baseDpr)

  let result = byWindowRatio
  if (!result || result === 100) result = byViewport
  if (!result || result === 100) result = byDpr
  if (!result || !Number.isFinite(result)) result = 100

  return result
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Detects browser zoom level changes and returns a percentage value.
 * Used to switch between horizontal/vertical progress indicators.
 */
export function useZoomDetection() {
  const [uiZoomPercent, setUiZoomPercent] = useState(100)
  const baseDprRef = useRef(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const computeZoomPercent = () => {
      setUiZoomPercent(detectZoomLevel(baseDprRef.current))
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
