/**
 * Waveform edge geometry for the trivai CRT band.
 *
 * The design's EKG edges are periodic every 360px (18 vertices at 20px
 * intervals). The animation cycles through 4 base patterns and the same 4
 * patterns phase-shifted by 180px. The bottom edge is the top edge mirrored
 * vertically (y -> 520 - y). Vertex data is transcribed from the design
 * reference (`direction-d-extracted.html`); generation is verified to
 * reproduce the reference `d` strings exactly at the 1440px design width,
 * and here extends the loop to 2880px so the band stays full-bleed on wide
 * viewports.
 */

const STEP = 20
const PERIOD = 18
const TOP_Y = 30

export const BAND_W = 2880
export const BAND_H = 520

const BASES = [
  [30, 30.9, 31.7, 32.3, 34, 41.6, 34.1, 31.7, 55.2, 15.7, 29.9, 32.8, 35, 30.8, 27.9, 27.8, 28.3, 29.1],
  [31.8, 32.4, 35.7, 40.9, 32.9, 31.7, 38.6, 21.1, 30.3, 33.9, 34.3, 29.7, 27.7, 27.9, 28.5, 29.3, 30.2, 31.1],
  [38.1, 38.8, 32.2, 35.2, 29.2, 27.8, 30.9, 34.7, 33.3, 28.8, 27.7, 28, 28.7, 29.5, 30.5, 31.3, 32, 32.6],
  [31.9, 50.2, 21.5, 29.6, 31.8, 35.1, 32.1, 28.3, 27.7, 28.2, 28.9, 29.8, 30.7, 31.5, 32.1, 33, 40.5, 36.2],
]

// [baseIndex, phaseShift in vertices] per SMIL keyframe; first == last so the loop closes.
const STEPS: Array<[number, number]> = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [0, 9],
  [1, 9],
  [2, 9],
  [3, 9],
  [0, 0],
]

const fmt = (v: number): string => String(Math.round(v * 10) / 10)

function topYs(baseIdx: number, shift: number): number[] {
  const n = BAND_W / STEP
  const ys: number[] = []
  for (let i = 0; i <= n; i++) {
    // Endpoints are pinned to the resting y, as in the reference.
    ys.push(i === 0 || i === n ? TOP_Y : BASES[baseIdx][(i + shift) % PERIOD])
  }
  return ys
}

const topPath = (ys: number[]): string =>
  ys.map((y, i) => `${i === 0 ? 'M' : 'L'}${i * STEP} ${fmt(y)}`).join(' ')

const bottomPath = (ys: number[]): string =>
  ys.map((y, i) => `${i === 0 ? 'M' : 'L'}${i * STEP} ${fmt(BAND_H - y)}`).join(' ')

function maskPath(ys: number[]): string {
  const top = ys.map((y, i) => `${i === 0 ? 'M' : 'L'}${i * STEP} ${fmt(y)}`).join(' ')
  const bottom = [...ys.keys()]
    .reverse()
    .map((i) => `L${i * STEP} ${fmt(BAND_H - ys[i])}`)
    .join(' ')
  return `${top} ${bottom} Z`
}

const frames = STEPS.map(([b, s]) => topYs(b, s))

/** The 9 closed outline frames, for a CSS clip-path keyframe animation
    (Safari doesn't support CSS mask references to inline SVG <mask>). */
export const MASK_FRAMES = frames.map(maskPath)

/** SMIL keyframe values (joined with ';') and the static resting `d`. */
export const TOP_VALUES = frames.map(topPath).join(';')
export const TOP_D = topPath(frames[0])
export const BOTTOM_VALUES = frames.map(bottomPath).join(';')
export const BOTTOM_D = bottomPath(frames[0])
