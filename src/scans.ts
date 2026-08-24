import type { MetricValues } from './analysis'

/**
 * One store for scan history.
 *
 * Previously the same history existed three times over — a hard-coded array in
 * HistoryScreen, different totals in FaceVisited, and different totals again in
 * Profile — and a finished scan was written to none of them, so "Save & Home"
 * saved nothing and the home score never moved. Every screen now derives from
 * this list, and a completed scan is appended to it.
 */

export type Scan = {
  id: string
  /** Epoch ms. */
  takenAt: number
  metrics: MetricValues
  /** Object URLs of the three channel images. Empty for seeded history. */
  thumbs: string[]
}

export type MetricDef = {
  key: keyof MetricValues
  label: string
  unit: string
  color: string
  desc: string
  /** Which direction counts as an improvement, for the delta chips. */
  betterWhen: 'higher' | 'lower'
}

export const METRIC_DEFS: MetricDef[] = [
  {
    key: 'redness',
    label: 'Redness Area',
    unit: '% of ROI',
    color: '#ef4444',
    desc: 'Surface area showing elevated redness signal (white-light channel)',
    betterWhen: 'lower',
  },
  {
    key: 'boundary',
    label: 'Boundary Clarity',
    unit: '/100',
    color: '#8b5cf6',
    desc: 'Sharpness of lesion boundaries detected in the cross-polarized image',
    betterWhen: 'higher',
  },
  {
    key: 'shine',
    label: 'Surface Shine Index',
    unit: '/100',
    color: '#3b82f6',
    desc: 'Specular reflectance from the parallel-polarized image — higher = oilier',
    betterWhen: 'lower',
  },
  {
    key: 'texture',
    label: 'Texture Roughness',
    unit: '/100',
    color: '#f59e0b',
    desc: 'High-frequency surface variation from the parallel-polarized channel',
    betterWhen: 'lower',
  },
  {
    key: 'repeatability',
    label: 'Repeatability Score',
    unit: '/100',
    color: '#10b981',
    desc: 'Similarity of framing and exposure across the three channels',
    betterWhen: 'higher',
  },
]

/**
 * Composite score, 0-100.
 *
 * Redness, shine and roughness count against; boundary clarity and
 * repeatability count for. The point of deriving it here is that every score on
 * every screen now comes from the same five numbers, so the home tile, the
 * history chart and the report can no longer disagree.
 */
export function scoreFromMetrics(m: MetricValues): number {
  return Math.round(
    0.25 * (100 - m.redness) +
      0.25 * m.boundary +
      0.15 * (100 - m.shine) +
      0.15 * (100 - m.texture) +
      0.2 * m.repeatability,
  )
}

const seed = (
  iso: string,
  redness: number,
  boundary: number,
  shine: number,
  texture: number,
  repeatability: number,
): Scan => ({
  id: `seed-${iso}`,
  takenAt: new Date(iso).getTime(),
  metrics: { redness, boundary, shine, texture, repeatability },
  thumbs: [],
})

/** Demo history, oldest first. Used by the sample account; a fresh sign-up starts empty. */
export const SEED_SCANS: Scan[] = [
  seed('2026-06-15T09:30:00', 31, 58, 52, 61, 70),
  seed('2026-06-22T10:00:00', 29, 61, 49, 58, 74),
  seed('2026-06-29T08:45:00', 26, 64, 47, 55, 79),
  seed('2026-07-06T11:00:00', 28, 63, 50, 57, 77),
  seed('2026-07-13T09:15:00', 22, 68, 41, 47, 85),
  seed('2026-07-20T10:30:00', 18, 74, 35, 42, 88),
]

/** Newest first — the order every list in the app renders in. */
export function byNewest(scans: Scan[]): Scan[] {
  return [...scans].sort((a, b) => b.takenAt - a.takenAt)
}

export function latestScan(scans: Scan[]): Scan | null {
  return scans.length ? byNewest(scans)[0] : null
}

/** The scan immediately before `id` in time, or null if it is the first. */
export function previousScan(scans: Scan[], id: string): Scan | null {
  const ordered = byNewest(scans)
  const i = ordered.findIndex((s) => s.id === id)
  return i >= 0 && i + 1 < ordered.length ? ordered[i + 1] : null
}

export function scoreDelta(scans: Scan[], scan: Scan): number | null {
  const prev = previousScan(scans, scan.id)
  return prev ? scoreFromMetrics(scan.metrics) - scoreFromMetrics(prev.metrics) : null
}

export function averageScore(scans: Scan[]): number | null {
  if (!scans.length) return null
  return Math.round(scans.reduce((sum, s) => sum + scoreFromMetrics(s.metrics), 0) / scans.length)
}

export function bestScore(scans: Scan[]): number | null {
  if (!scans.length) return null
  return Math.max(...scans.map((s) => scoreFromMetrics(s.metrics)))
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatDate(takenAt: number): string {
  const d = new Date(takenAt)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export function formatShortDate(takenAt: number): string {
  const d = new Date(takenAt)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function formatTime(takenAt: number): string {
  const d = new Date(takenAt)
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const suffix = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${m} ${suffix}`
}

let counter = 0
export function createScan(metrics: MetricValues, thumbs: string[]): Scan {
  counter += 1
  return { id: `scan-${Date.now()}-${counter}`, takenAt: Date.now(), metrics, thumbs }
}
