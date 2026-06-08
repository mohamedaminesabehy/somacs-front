// ──────────────────────────────────────────────────────────────────────────
// Signature image helpers — lightweight, dependency-free (Canvas API only).
// Used to crop a captured signature/stamp, remove the white background so it
// looks like a real handwritten signature, auto-trim empty borders, optimise
// the size, then export a clean transparent PNG ready for Cloudinary upload.
// ──────────────────────────────────────────────────────────────────────────

const MAX_OUTPUT_WIDTH = 900
const MAX_OUTPUT_HEIGHT = 450

/** Load a File/Blob into an HTMLImageElement (respecting EXIF-less bitmap). */
export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }
    img.src = url
  })
}

/** Draw an image (or a crop region of it) onto a fresh canvas. */
function drawToCanvas(image, region) {
  const sx = region ? region.x : 0
  const sy = region ? region.y : 0
  const sw = region ? region.width : image.naturalWidth || image.width
  const sh = region ? region.height : image.naturalHeight || image.height

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(sw))
  canvas.height = Math.max(1, Math.round(sh))
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
  return { canvas, ctx }
}

/**
 * Replace the white/near-white background with transparency, with a soft
 * (anti-aliased) edge so the ink keeps clean borders. Mutates the ImageData.
 */
function removeWhiteBackground(imageData, { bgThreshold = 242, edgeStart = 205 } = {}) {
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b
    const maxC = Math.max(r, g, b)
    const minC = Math.min(r, g, b)
    const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC

    if (luminance >= bgThreshold && saturation < 0.18) {
      data[i + 3] = 0
    } else if (luminance > edgeStart && saturation < 0.18) {
      const ratio = (bgThreshold - luminance) / (bgThreshold - edgeStart)
      data[i + 3] = Math.round(Math.min(1, Math.max(0, ratio)) * data[i + 3])
    }
  }
  return imageData
}

/** Find the bounding box of non-transparent pixels (alpha above threshold). */
function findContentBounds(imageData, alphaThreshold = 12) {
  const { data, width, height } = imageData
  let top = height
  let left = width
  let right = 0
  let bottom = 0
  let found = false

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > alphaThreshold) {
        found = true
        if (x < left) left = x
        if (x > right) right = x
        if (y < top) top = y
        if (y > bottom) bottom = y
      }
    }
  }

  if (!found) return null
  return { left, top, right, bottom }
}

/**
 * Process a captured signature into a clean transparent PNG.
 *
 * @param {HTMLImageElement} image  Source image element.
 * @param {{x,y,width,height}|null} region  Optional crop region (source px).
 * @param {object} options
 * @returns {Promise<{ blob: Blob, dataUrl: string, width: number, height: number }>}
 */
export async function processSignatureImage(image, region = null, options = {}) {
  const { canvas, ctx } = drawToCanvas(image, region)

  // 1. Remove the white background → transparency.
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  removeWhiteBackground(imageData, options)
  ctx.putImageData(imageData, 0, 0)

  // 2. Auto-trim the empty (transparent) borders around the ink.
  const bounds = findContentBounds(imageData)
  let trimmed = canvas
  if (bounds) {
    const pad = Math.round(
      Math.min(canvas.width, canvas.height) * 0.04 + 4,
    )
    const left = Math.max(0, bounds.left - pad)
    const top = Math.max(0, bounds.top - pad)
    const right = Math.min(canvas.width - 1, bounds.right + pad)
    const bottom = Math.min(canvas.height - 1, bounds.bottom + pad)
    const tw = Math.max(1, right - left + 1)
    const th = Math.max(1, bottom - top + 1)

    const tCanvas = document.createElement('canvas')
    tCanvas.width = tw
    tCanvas.height = th
    const tCtx = tCanvas.getContext('2d')
    tCtx.drawImage(canvas, left, top, tw, th, 0, 0, tw, th)
    trimmed = tCanvas
  }

  // 3. Optimise: cap the output size while keeping the aspect ratio.
  const scale = Math.min(
    1,
    MAX_OUTPUT_WIDTH / trimmed.width,
    MAX_OUTPUT_HEIGHT / trimmed.height,
  )
  let output = trimmed
  if (scale < 1) {
    const oCanvas = document.createElement('canvas')
    oCanvas.width = Math.max(1, Math.round(trimmed.width * scale))
    oCanvas.height = Math.max(1, Math.round(trimmed.height * scale))
    const oCtx = oCanvas.getContext('2d')
    oCtx.imageSmoothingEnabled = true
    oCtx.imageSmoothingQuality = 'high'
    oCtx.drawImage(trimmed, 0, 0, oCanvas.width, oCanvas.height)
    output = oCanvas
  }

  const blob = await new Promise((resolve) =>
    output.toBlob((b) => resolve(b), 'image/png'),
  )
  const dataUrl = output.toDataURL('image/png')

  return { blob, dataUrl, width: output.width, height: output.height }
}

/** Suggest an initial crop region (in source px) by auto-detecting the ink. */
export function detectSignatureRegion(image) {
  try {
    const { canvas, ctx } = drawToCanvas(image, null)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    // Reuse the white-removal pass on a copy to locate the ink bounds.
    removeWhiteBackground(imageData)
    const bounds = findContentBounds(imageData, 20)
    if (!bounds) return null
    const pad = Math.round(Math.min(canvas.width, canvas.height) * 0.03)
    const x = Math.max(0, bounds.left - pad)
    const y = Math.max(0, bounds.top - pad)
    const width = Math.min(canvas.width - x, bounds.right - bounds.left + pad * 2)
    const height = Math.min(canvas.height - y, bounds.bottom - bounds.top + pad * 2)
    if (width < 8 || height < 8) return null
    return { x, y, width, height }
  } catch {
    return null
  }
}
