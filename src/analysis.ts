/**
 * Image analysis for the scan flow.
 *
 * The prototype used to hard-code every quality check to `pass: true` and every
 * report metric to a constant, which made the two screens that carry the whole
 * "controlled optical imaging" premise the only two screens that measured
 * nothing. These functions read the pixels the user actually uploaded.
 *
 * The maths is deliberately simple — mean luminance, gradient energy, channel
 * ratios — and it is not a clinical measurement. It is enough to make the flow
 * respond to real input: a blurry photo fails the sharpness gate, a dark room
 * fails exposure, and a redder patch of skin moves the redness metric.
 */

/** Longest edge the analysis canvas is downscaled to. Keeps the work ~instant. */
const SAMPLE_EDGE = 256

export type ImageStats = {
  /** Mean luminance, 0-255. */
  luma: number
  /** Mean gradient magnitude, 0-255. Higher = more edge detail = sharper. */
  detail: number
  /**
   * Fraction of pixels whose redness index runs above this image's own median,
   * 0-1. Measured relative to the frame because skin is red-dominant
   * everywhere — an absolute "red beats green" test returns ~100% on every
   * photograph of a person and tells you nothing.
   */
  redElevated: number
  /**
   * 98th-percentile luminance over median luminance. A matte, evenly lit
   * capture sits near 1.0; oil sheen and stray specular highlights push it up.
   * Counting blown-out pixels does not work — a correctly exposed photo has none.
   */
  highlight: number
  width: number
  height: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`could not decode image: ${src}`))
    img.src = src
  })
}

export async function measureImage(src: string): Promise<ImageStats> {
  const img = await loadImage(src)
  const scale = Math.min(1, SAMPLE_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('2d canvas unavailable')
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)

  const pixels = w * h
  const gray = new Float32Array(pixels)
  const redIndex = new Float32Array(pixels)
  let lumaSum = 0

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    gray[p] = y
    lumaSum += y
    redIndex[p] = (r - g) / Math.max(1, r + g)
  }

  const sortedRed = Float32Array.from(redIndex).sort()
  const medianRed = sortedRed[Math.floor(pixels / 2)]
  let elevated = 0
  for (let p = 0; p < pixels; p++) if (redIndex[p] > medianRed + 0.04) elevated++

  const sortedGray = Float32Array.from(gray).sort()
  const medianLuma = sortedGray[Math.floor(pixels / 2)]
  const p98Luma = sortedGray[Math.min(pixels - 1, Math.floor(pixels * 0.98))]

  // Mean gradient magnitude (forward differences — cheap, and we only need a
  // relative focus signal, not a calibrated one).
  let gradSum = 0
  let gradCount = 0
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const p = y * w + x
      const dx = gray[p + 1] - gray[p]
      const dy = gray[p + w] - gray[p]
      gradSum += Math.sqrt(dx * dx + dy * dy)
      gradCount++
    }
  }

  return {
    luma: lumaSum / pixels,
    detail: gradCount ? gradSum / gradCount : 0,
    redElevated: elevated / pixels,
    highlight: p98Luma / Math.max(1, medianLuma),
    width: img.naturalWidth,
    height: img.naturalHeight,
  }
}

export async function measureAll(srcs: string[]): Promise<ImageStats[]> {
  return Promise.all(srcs.map(measureImage))
}

// ─── Quality gate ─────────────────────────────────────────────────────────────

export type QualityCheck = {
  key: string
  label: string
  detail: string
  pass: boolean
  /** True when the user answers this one, because no pixel test can. */
  manual?: boolean
}

/** Below this mean gradient magnitude an image reads as soft or out of focus. */
const DETAIL_FLOOR = 2.2
const LUMA_MIN = 55
const LUMA_MAX = 205
/** Max spread in mean luminance across the three channels before framing/lighting
 *  is judged to have drifted between shots. */
const LUMA_SPREAD_MAX = 70
const ASPECT_TOLERANCE = 0.12

export function runQualityChecks(stats: ImageStats[], expected: number): QualityCheck[] {
  const present = stats.length === expected

  const softest = stats.reduce<ImageStats | null>(
    (worst, s) => (worst === null || s.detail < worst.detail ? s : worst),
    null,
  )
  const sharpness = present && stats.every((s) => s.detail >= DETAIL_FLOOR)

  const outOfRange = stats.filter((s) => s.luma < LUMA_MIN || s.luma > LUMA_MAX)
  const exposure = present && outOfRange.length === 0

  const lumas = stats.map((s) => s.luma)
  const spread = lumas.length ? Math.max(...lumas) - Math.min(...lumas) : 0
  const aspects = stats.map((s) => s.width / s.height)
  const aspectSpread = aspects.length ? Math.max(...aspects) - Math.min(...aspects) : 0
  const alignment = present && spread <= LUMA_SPREAD_MAX && aspectSpread <= ASPECT_TOLERANCE

  return [
    {
      key: 'completeness',
      label: 'Channel completeness',
      detail: present
        ? `All ${expected} optical channels present`
        : `${expected - stats.length} channel(s) still missing`,
      pass: present,
    },
    {
      key: 'sharpness',
      label: 'Sharpness',
      detail: sharpness
        ? `All ${expected} images pass the focus threshold`
        : `Softest image scores ${softest ? softest.detail.toFixed(1) : '—'} against a ${DETAIL_FLOOR} floor — hold steadier or move closer`,
      pass: sharpness,
    },
    {
      key: 'exposure',
      label: 'Exposure',
      detail: exposure
        ? 'Brightness within acceptable range on every channel'
        : `${outOfRange.length} image(s) outside the ${LUMA_MIN}–${LUMA_MAX} range — adjust the LED ring`,
      pass: exposure,
    },
    {
      key: 'alignment',
      label: 'Consistency',
      detail: alignment
        ? 'Framing and lighting hold across the set'
        : `Brightness drifts ${Math.round(spread)} levels between shots — keep the module fixed`,
      pass: alignment,
    },
  ]
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))

export type MetricValues = {
  redness: number
  boundary: number
  shine: number
  texture: number
  repeatability: number
}

/**
 * Derive the five report metrics from the three channel images.
 * Index 0 = RGB / white-light, 1 = cross-polarized, 2 = parallel-polarized.
 */
export function deriveMetrics(stats: ImageStats[]): MetricValues {
  const rgb = stats[0]
  const cross = stats[1] ?? rgb
  const parallel = stats[2] ?? rgb

  // Redness area: share of the frame running above this frame's own redness
  // median, on the white-light channel where colour is not filtered.
  const redness = clamp(Math.round(rgb.redElevated * 100))

  // Boundary clarity: edge energy in the cross-polarized image, where surface
  // glare is suppressed and lesion edges dominate.
  const boundary = clamp(Math.round((cross.detail / 9) * 100))

  // Surface shine: how far the bright tail runs above the median in the
  // parallel-polarized image — the channel that keeps specular reflection.
  const shine = clamp(Math.round((parallel.highlight - 1) * 55))

  // Texture roughness: high-frequency energy in the parallel-polarized image.
  const texture = clamp(Math.round((parallel.detail / 11) * 100))

  // Repeatability: how closely the three exposures track each other.
  const lumas = stats.map((s) => s.luma)
  const spread = Math.max(...lumas) - Math.min(...lumas)
  const repeatability = clamp(Math.round(100 - spread * 1.1))

  return { redness, boundary, shine, texture, repeatability }
}
