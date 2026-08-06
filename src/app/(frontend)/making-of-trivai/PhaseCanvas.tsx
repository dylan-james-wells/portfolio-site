'use client'

/* Act 4 — the engine's phase machine as a rotating 3D ring, ported from the
   design handoff's `phase-machine.js`. The nine EnginePhase values sit on a
   tilted ring; a signal packet walks the arcs in the order a real steal
   sequence takes (1.15s per hop) and the node it lands on lights up — coral
   for the two `evaluating` phases where the model is thinking, teal for the
   rest. */

import React, { useEffect, useRef } from 'react'

type RGB = [number, number, number]

const CORAL: RGB = [255, 107, 107]
const TEAL: RGB = [78, 205, 196]
const WHITE: RGB = [248, 250, 252]
const DIM: RGB = [120, 132, 158]

const rgba = (c: RGB, a: number) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'

/* the loop a steal actually walks */
const SEQ = [
  'idle',
  'answering',
  'evaluating',
  'steal_window',
  'steal_answering',
  'steal_evaluating',
  'steal_reveal',
  'idle',
]
/* every node on the ring, in ring order */
const NODES = [
  'setup',
  'idle',
  'answering',
  'evaluating',
  'reveal',
  'steal_window',
  'steal_answering',
  'steal_evaluating',
  'steal_reveal',
]
const isEval = (n: string) => n.indexOf('evaluating') !== -1

function proj(
  x: number,
  y: number,
  z: number,
  yaw: number,
  pitch: number,
  focal: number,
  cz: number,
  out: number[],
): number[] {
  const cyw = Math.cos(yaw),
    syw = Math.sin(yaw)
  const x1 = x * cyw - z * syw
  const z1 = x * syw + z * cyw
  const cp = Math.cos(pitch),
    sp = Math.sin(pitch)
  const y1 = y * cp - z1 * sp
  const z2 = y * sp + z1 * cp
  const d = z2 + cz
  const s = focal / Math.max(0.1, d)
  out[0] = x1 * s
  out[1] = y1 * s
  out[2] = d
  return out
}

function build(reduced: boolean, monoFamily: string) {
  const R = 3.5,
    N = NODES.length
  const ring = NODES.map((name, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2
    return { name, x: Math.cos(a) * R, z: Math.sin(a) * R, i }
  })
  const idxOf: Record<string, number> = {}
  ring.forEach((n, i) => {
    idxOf[n.name] = i
  })

  // octahedron edges, unit radius
  const OV = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ]
  const OE = [
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [1, 2],
    [1, 3],
    [1, 4],
    [1, 5],
    [2, 4],
    [2, 5],
    [3, 4],
    [3, 5],
  ]

  const P = [0, 0, 0],
    Q = [0, 0, 0]
  const ov = OV.map(() => [0, 0, 0])
  const depth = new Float32Array(N)
  const order = ring.map((_, i) => i)

  const STEP = 1.15 // seconds per hop

  return function draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    const yaw = reduced ? -0.5 : -0.5 + t * 0.34
    const pitch = 0.5
    const focal = Math.min(w * 0.72, h * 1.55)
    const cz = 11.5
    const cx = w * 0.5,
      cyc = h * 0.6
    const S = (x: number, y: number, z: number, dst: number[]) => {
      proj(x, y, z, yaw, pitch, focal, cz, dst)
      dst[0] = cx + dst[0]
      dst[1] = cyc - dst[1]
      return dst
    }

    /* which hop are we on */
    const hops = SEQ.length - 1
    const raw = reduced ? 2.35 : (t / STEP) % hops
    const hop = Math.floor(raw)
    const frac = raw - hop
    const fromName = SEQ[hop],
      toName = SEQ[hop + 1]
    const activeName = frac < 0.55 ? fromName : toName

    /* ---- floor grid ---- */
    ctx.strokeStyle = 'rgba(255,255,255,0.038)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let g = -4.5; g <= 4.5; g += 2.25) {
      S(g, -1.15, -4.5, P)
      ctx.moveTo(P[0], P[1])
      S(g, -1.15, 4.5, P)
      ctx.lineTo(P[0], P[1])
      S(-4.5, -1.15, g, P)
      ctx.moveTo(P[0], P[1])
      S(4.5, -1.15, g, P)
      ctx.lineTo(P[0], P[1])
    }
    ctx.stroke()

    /* ---- the ring path ---- */
    ctx.strokeStyle = 'rgba(255,255,255,0.13)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let k = 0; k <= 96; k++) {
      const a = (k / 96) * Math.PI * 2
      S(Math.cos(a) * R, 0, Math.sin(a) * R, P)
      if (k === 0) ctx.moveTo(P[0], P[1])
      else ctx.lineTo(P[0], P[1])
    }
    ctx.stroke()

    /* ---- the travelling chord, from -> to ---- */
    const a0 = ring[idxOf[fromName]],
      a1 = ring[idxOf[toName]]
    if (a0 !== a1) {
      const lift = 1.15
      ctx.globalCompositeOperation = 'lighter'
      const col = isEval(toName) ? CORAL : TEAL
      // full chord, faint
      ctx.strokeStyle = rgba(col, 0.16)
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let k = 0; k <= 32; k++) {
        const f = k / 32
        const x = a0.x + (a1.x - a0.x) * f
        const z = a0.z + (a1.z - a0.z) * f
        S(x, Math.sin(f * Math.PI) * lift, z, P)
        if (k === 0) ctx.moveTo(P[0], P[1])
        else ctx.lineTo(P[0], P[1])
      }
      ctx.stroke()
      // bright head
      const tail = Math.max(0, frac - 0.26)
      ctx.strokeStyle = rgba(col, 0.85)
      ctx.lineWidth = 1.8
      ctx.beginPath()
      let started = false
      for (let k = 0; k <= 24; k++) {
        const f = tail + (frac - tail) * (k / 24)
        const x = a0.x + (a1.x - a0.x) * f
        const z = a0.z + (a1.z - a0.z) * f
        S(x, Math.sin(f * Math.PI) * lift, z, P)
        if (!started) {
          ctx.moveTo(P[0], P[1])
          started = true
        } else ctx.lineTo(P[0], P[1])
      }
      ctx.stroke()
      // the packet itself
      const fx = a0.x + (a1.x - a0.x) * frac
      const fz = a0.z + (a1.z - a0.z) * frac
      S(fx, Math.sin(frac * Math.PI) * lift, fz, Q)
      ctx.fillStyle = rgba(WHITE, 0.95)
      ctx.beginPath()
      ctx.arc(Q[0], Q[1], 2.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = rgba(col, 0.3)
      ctx.beginPath()
      ctx.arc(Q[0], Q[1], 6.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
    }

    /* ---- nodes, far to near ---- */
    for (let i = 0; i < N; i++) {
      S(ring[i].x, 0, ring[i].z, P)
      depth[i] = P[2]
    }
    order.sort((p, q) => depth[q] - depth[p])

    ctx.textBaseline = 'middle'

    for (let n = 0; n < N; n++) {
      const nd = ring[order[n]]
      const active = nd.name === activeName
      const ev = isEval(nd.name)
      const col = active ? (ev ? CORAL : TEAL) : DIM
      const size = active ? 0.44 : 0.3

      for (let k = 0; k < 6; k++) {
        S(nd.x + OV[k][0] * size, OV[k][1] * size, nd.z + OV[k][2] * size, ov[k])
      }

      if (active) {
        ctx.globalCompositeOperation = 'lighter'
        const puls = reduced ? 0.34 : 0.24 + Math.sin(t * 7) * 0.1
        S(nd.x, 0, nd.z, P)
        ctx.fillStyle = rgba(col, puls)
        ctx.beginPath()
        ctx.arc(P[0], P[1], 17, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.strokeStyle = rgba(col, active ? 0.95 : 0.5)
      ctx.lineWidth = active ? 1.5 : 1
      ctx.beginPath()
      for (let k = 0; k < OE.length; k++) {
        const p = ov[OE[k][0]],
          q = ov[OE[k][1]]
        ctx.moveTo(p[0], p[1])
        ctx.lineTo(q[0], q[1])
      }
      ctx.stroke()
      if (active) ctx.globalCompositeOperation = 'source-over'

      /* label, pushed outward from the ring centre */
      S(nd.x * 1.34, 0, nd.z * 1.34, P)
      const inner = S(nd.x, 0, nd.z, Q)
      const right = P[0] >= inner[0]
      ctx.font = (active ? '700 ' : '') + (active ? 12 : 11) + 'px ' + monoFamily
      ctx.textAlign = right ? 'left' : 'right'
      ctx.fillStyle = active ? rgba(col, 1) : rgba(DIM, 0.72)
      ctx.fillText(nd.name, P[0] + (right ? 6 : -6), P[1])
    }
    ctx.textAlign = 'left'
  }
}

export const PhaseCanvas: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
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
      // next/font registers a hashed family name — read the resolved stack off
      // the element so canvas text really renders in JetBrains Mono
      const monoFamily = getComputedStyle(el).fontFamily || 'monospace'
      const scene = build(reduced, monoFamily)
      let running = false,
        visible = true,
        t = 0

      function size() {
        const w = el.clientWidth || 900,
          h = el.clientHeight || 420
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
        scene(ctx, w, h, t)
      }
      function frame() {
        if (disposed || !visible || reduced) {
          running = false
          return
        }
        t += 1 / 60
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
