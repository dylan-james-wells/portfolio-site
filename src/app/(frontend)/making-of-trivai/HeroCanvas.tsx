'use client'

/* The hero seed-cloud scene, ported from the design handoff's
   `article-hero.js` (drawn with a small local projector on 2D canvas —
   dependency-free, per the handoff this is an accepted final form).
   A neural-ish point cloud: nuclei wired by axon chains; signal pulses
   travel the chains and flare the points they pass. */

import React, { useEffect, useRef } from 'react'

const CORAL: RGB = [255, 107, 107]
const TEAL: RGB = [78, 205, 196]

type RGB = [number, number, number]

const rgba = (c: RGB, a: number) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'
const lerpC = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
]

/* project into a caller-supplied 3-slot array — no allocation */
function proj(
  p: number[],
  yaw: number,
  pitch: number,
  focal: number,
  cz: number,
  out: number[],
): number[] {
  const cy = Math.cos(yaw),
    sy = Math.sin(yaw)
  const x1 = p[0] * cy - p[2] * sy
  const z1 = p[0] * sy + p[2] * cy
  const cp = Math.cos(pitch),
    sp = Math.sin(pitch)
  const y1 = p[1] * cp - z1 * sp
  const z2 = p[1] * sp + z1 * cp
  const d = z2 + cz
  const s = focal / Math.max(0.1, d)
  out[0] = x1 * s
  out[1] = y1 * s
  out[2] = d
  return out
}

type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void

function sceneSeeds(reduced: boolean): DrawFn {
  const N = 7600
  const px = new Float32Array(N),
    py = new Float32Array(N),
    pz = new Float32Array(N)
  const styles = new Array<string>(N) // colour strings built once
  const hot = new Array<string>(N) // saturated flare colour, built once
  const flare = new Uint8Array(N) // reused, never reallocated
  const arcPos = new Float32Array(N) // 0..1 position along its chain (-1 = nucleus)
  const MAXCHAIN = 260
  const chainStart = new Int32Array(MAXCHAIN),
    chainEnd = new Int32Array(MAXCHAIN),
    chainTo = new Int32Array(MAXCHAIN)
  const HOT_CORAL: RGB = [255, 74, 104],
    HOT_TEAL: RGB = [56, 255, 236]

  /* Neural-ish structure: a handful of nuclei (cell bodies) with dense cores,
     wired together by wandering axon chains that carry most of the points. */
  const NUCLEI = 16
  const nuc: number[][] = []
  for (let k = 0; k < NUCLEI; k++) {
    const th = Math.random() * Math.PI * 2
    const ph = Math.acos(2 * Math.random() - 1)
    const r = 1.5 + Math.pow(Math.random(), 0.7) * 3.9
    nuc.push([Math.sin(ph) * Math.cos(th) * r, Math.cos(ph) * r * 0.62, Math.sin(ph) * Math.sin(th) * r])
  }

  // edge list: each nucleus links to its 2 nearest neighbours (+ a random long-range hop)
  const edges: Array<[number, number]> = []
  for (let k = 0; k < NUCLEI; k++) {
    const d = nuc
      .map((n, j): [number, number] => [j, Math.hypot(n[0] - nuc[k][0], n[1] - nuc[k][1], n[2] - nuc[k][2])])
      .filter(([j]) => j !== k)
      .sort((a, b) => a[1] - b[1])
    edges.push([k, d[0][0]], [k, d[1][0]])
    if (Math.random() < 0.45) edges.push([k, d[d.length - 1][0]])
  }

  let w = 0
  const CORE = Math.round(N * 0.24)
  const coreNuc = new Int32Array(N)
  // 1) cell bodies — tight gaussian-ish blobs at each nucleus
  for (let i = 0; i < CORE && w < N; i++, w++) {
    const ni = i % NUCLEI
    const n = nuc[ni]
    const s = 0.24 + Math.pow(Math.random(), 2.2) * 0.5
    const th = Math.random() * Math.PI * 2,
      ph = Math.acos(2 * Math.random() - 1)
    px[w] = n[0] + Math.sin(ph) * Math.cos(th) * s
    py[w] = n[1] + Math.cos(ph) * s
    pz[w] = n[2] + Math.sin(ph) * Math.sin(th) * s
    arcPos[w] = -1
    coreNuc[w] = ni
  }
  // 2) axons — random walks from nucleus A drifting toward nucleus B
  let e = 0
  let chainCount = 0
  while (w < N && chainCount < MAXCHAIN) {
    const [a, b] = edges[e % edges.length]
    e++
    const from = nuc[a],
      to = nuc[b]
    const steps = 20 + Math.floor(Math.random() * 20)
    if (w + steps + 2 >= N) break
    chainStart[chainCount] = w
    chainTo[chainCount] = b
    let cxp = from[0],
      cyp = from[1],
      czp = from[2]
    // perpendicular wander offset so chains bow instead of running straight
    const bow = 0.8 + Math.random() * 1.4
    const bx = (Math.random() * 2 - 1) * bow,
      by = (Math.random() * 2 - 1) * bow * 0.6,
      bz = (Math.random() * 2 - 1) * bow
    for (let s = 0; s < steps && w < N; s++, w++) {
      const f = s / steps
      const arc = Math.sin(f * Math.PI)
      const tx = from[0] + (to[0] - from[0]) * f + bx * arc
      const ty = from[1] + (to[1] - from[1]) * f + by * arc
      const tz = from[2] + (to[2] - from[2]) * f + bz * arc
      cxp += (tx - cxp) * 0.55 + (Math.random() - 0.5) * 0.26
      cyp += (ty - cyp) * 0.55 + (Math.random() - 0.5) * 0.26
      czp += (tz - czp) * 0.55 + (Math.random() - 0.5) * 0.26
      px[w] = cxp
      py[w] = cyp
      pz[w] = czp
      arcPos[w] = f
      coreNuc[w] = -1
      // occasional dendritic spur off the axon — shares the parent's arc position
      if (Math.random() < 0.2 && w + 1 < N) {
        w++
        px[w] = cxp + (Math.random() - 0.5) * 0.6
        py[w] = cyp + (Math.random() - 0.5) * 0.6
        pz[w] = czp + (Math.random() - 0.5) * 0.6
        arcPos[w] = f
        coreNuc[w] = -1
      }
    }
    chainEnd[chainCount] = w
    chainCount++
  }
  // pad any remainder onto the last position so nothing sits at the origin
  while (w < N) {
    px[w] = px[w - 1]
    py[w] = py[w - 1]
    pz[w] = pz[w - 1]
    arcPos[w] = arcPos[w - 1]
    coreNuc[w] = coreNuc[w - 1]
    w++
  }
  if (chainCount > 0) chainEnd[chainCount - 1] = Math.min(chainEnd[chainCount - 1], N)

  for (let i = 0; i < N; i++) {
    const mix = Math.max(0, Math.min(1, py[i] / 4.5 + 0.5))
    styles[i] = rgba(lerpC(CORAL, TEAL, mix), 0.5)
    // flare colour: same coral→teal position, pushed to a hot, saturated version
    hot[i] = rgba(lerpC(HOT_CORAL, HOT_TEAL, mix), 1)
  }
  const P = [0, 0, 0],
    pt = [0, 0, 0]

  /* --- signals travel ALONG the chains ---
     flare[] holds an intensity band (0 dim, 1 tail, 2 body, 3 head). */
  const MAXP = 6
  const pulses: Array<{ chain: number; head: number; live: boolean; speed: number }> = []
  for (let k = 0; k < MAXP; k++) pulses.push({ chain: 0, head: 0, live: false, speed: 1 })

  function stepSignals(dt: number) {
    let live = 0
    for (let k = 0; k < MAXP; k++) {
      const p = pulses[k]
      if (!p.live) continue
      p.head += dt * p.speed
      if (p.head > 1.24) p.live = false
      else live++
    }
    while (live < 4) {
      let slot = -1
      for (let k = 0; k < MAXP; k++)
        if (!pulses[k].live) {
          slot = k
          break
        }
      if (slot < 0 || chainCount === 0) break
      const p = pulses[slot]
      p.chain = Math.floor(Math.random() * chainCount)
      p.head = -0.18 - Math.random() * 0.5
      p.speed = 0.5 + Math.random() * 0.7
      p.live = true
      live++
    }

    flare.fill(0)
    const TAIL = 0.2
    for (let k = 0; k < MAXP; k++) {
      const p = pulses[k]
      if (!p.live || p.head < 0) continue
      const lo = p.head - TAIL
      for (let i = chainStart[p.chain]; i < chainEnd[p.chain]; i++) {
        const a = arcPos[i]
        if (a > lo && a <= p.head) {
          const near = (a - lo) / TAIL
          const band = near > 0.74 ? 3 : near > 0.42 ? 2 : 1
          if (band > flare[i]) flare[i] = band
        }
      }
      if (p.head > 0.86) {
        const nb = chainTo[p.chain]
        const glow = p.head > 1.0 ? 2 : 3
        for (let i = 0; i < CORE; i++) {
          if (coreNuc[i] === nb && flare[i] < glow) flare[i] = glow
        }
      }
    }
  }
  stepSignals(0)

  return function draw(ctx, w2, h, t) {
    stepSignals(reduced ? 0 : 0.026)
    const yaw = reduced ? 0.5 : t * 0.55
    const pitch = reduced ? 0.1 : Math.sin(t * 0.7) * 0.07
    const focal = Math.min(w2, h) * 0.9,
      cz = 12
    const cx = w2 * 0.7,
      cyc = h * 0.52

    ctx.globalCompositeOperation = 'lighter'
    for (let i = 0; i < N; i++) {
      pt[0] = px[i]
      pt[1] = py[i]
      pt[2] = pz[i]
      proj(pt, yaw, pitch, focal, cz, P)
      const sx = cx + P[0],
        sy = cyc - P[1]
      if (sx < -20 || sx > w2 + 20 || sy < -20 || sy > h + 20) continue
      const f = flare[i]
      if (f === 0) {
        ctx.fillStyle = styles[i]
        ctx.fillRect(sx - 0.85, sy - 0.85, 1.7, 1.7)
      } else if (f === 3) {
        ctx.fillStyle = hot[i]
        ctx.globalAlpha = 1
        ctx.fillRect(sx - 2.1, sy - 2.1, 4.2, 4.2)
        ctx.globalAlpha = 0.34
        ctx.fillRect(sx - 4.4, sy - 4.4, 8.8, 8.8)
        ctx.globalAlpha = 1
      } else if (f === 2) {
        ctx.fillStyle = hot[i]
        ctx.globalAlpha = 0.85
        ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3)
        ctx.globalAlpha = 1
      } else {
        ctx.fillStyle = hot[i]
        ctx.globalAlpha = 0.4
        ctx.fillRect(sx - 1.1, sy - 1.1, 2.2, 2.2)
        ctx.globalAlpha = 1
      }
    }
    ctx.globalCompositeOperation = 'source-over'
  }
}

/* ---------------- shared animated backdrop ----------------
   Subtle drifting rule lines so the hero isn't a flat field behind the scene. */
function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  reduced: boolean,
) {
  const SP = 68 // rule spacing
  const drift = reduced ? 0 : (t * 26) % SP // slow upward drift

  ctx.lineWidth = 1
  ctx.strokeStyle = 'rgba(255,255,255,0.030)'
  ctx.beginPath()
  for (let y = h + SP - drift; y > -SP; y -= SP) {
    ctx.moveTo(0, Math.round(y) + 0.5)
    ctx.lineTo(w, Math.round(y) + 0.5)
  }
  ctx.stroke()

  // widely spaced vertical hairlines, drifting the other way
  const VSP = 132
  const vdrift = reduced ? 0 : (t * 14) % VSP
  ctx.strokeStyle = 'rgba(255,255,255,0.018)'
  ctx.beginPath()
  for (let x = -VSP + vdrift; x < w + VSP; x += VSP) {
    ctx.moveTo(Math.round(x) + 0.5, 0)
    ctx.lineTo(Math.round(x) + 0.5, h)
  }
  ctx.stroke()

  // two accent rules that glide across, each with a travelling bright segment
  ctx.globalCompositeOperation = 'lighter'
  for (let k = 0; k < 2; k++) {
    const teal = k === 1
    const col = teal ? TEAL : CORAL
    const span = reduced ? 0.35 : (t * (teal ? 0.055 : 0.041) + k * 0.5) % 1
    const y = Math.round(h * (teal ? 0.76 : 0.24)) + 0.5

    ctx.strokeStyle = rgba(col, 0.075)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()

    const cxp = span * (w + 260) - 130
    const g = ctx.createLinearGradient(cxp - 130, 0, cxp + 130, 0)
    g.addColorStop(0, rgba(col, 0))
    g.addColorStop(0.5, rgba(col, 0.5))
    g.addColorStop(1, rgba(col, 0))
    ctx.strokeStyle = g
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(cxp - 130, y)
    ctx.lineTo(cxp + 130, y)
    ctx.stroke()
    ctx.lineWidth = 1
  }
  ctx.globalCompositeOperation = 'source-over'
}

export const HeroCanvas: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let disposed = false
    let resizeObs: ResizeObserver | null = null
    let intersectObs: IntersectionObserver | null = null
    let retry: ReturnType<typeof setTimeout> | null = null
    let tries = 0

    function start(el: HTMLCanvasElement) {
      const ctx = el.getContext('2d')
      if (!ctx) return
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const scene = sceneSeeds(reduced)
      let running = false,
        visible = true,
        t = 0

      function size() {
        const w = el.clientWidth || 1100,
          h = el.clientHeight || 700
        el.width = Math.round(w * dpr)
        el.height = Math.round(h * dpr)
        paint()
      }
      function paint() {
        if (!ctx) return
        const w = el.width / dpr,
          h = el.height / dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, w, h)
        drawBackdrop(ctx, w, h, t, reduced)
        scene(ctx, w, h, t)
      }
      function frame() {
        if (disposed || !visible || reduced) {
          running = false
          return
        }
        t += 0.0075
        paint()
        requestAnimationFrame(frame)
      }
      function kick() {
        if (reduced || running || !visible || disposed) {
          paint()
          return
        }
        running = true
        requestAnimationFrame(frame)
      }

      resizeObs = new ResizeObserver(size)
      resizeObs.observe(el)
      intersectObs = new IntersectionObserver((es) => {
        visible = es[0].isIntersecting
        kick()
      })
      intersectObs.observe(el)
      size()
      kick()
    }

    // init-polling uses setTimeout, not rAF — rAF never fires in background tabs
    ;(function find() {
      if (disposed) return
      if (canvas.clientWidth > 0) {
        start(canvas)
        return
      }
      tries += 1
      if (tries < 400) retry = setTimeout(find, 60)
    })()

    return () => {
      disposed = true
      if (retry) clearTimeout(retry)
      resizeObs?.disconnect()
      intersectObs?.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className={className} style={style} aria-hidden="true" />
}
