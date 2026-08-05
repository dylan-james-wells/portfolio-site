'use client'

/* The hero seed-cloud scene from the design handoff's `article-hero.js`,
   ported onto three.js per the handoff's primary note: THREE.Points with
   position/color attributes and additive blending. All authored values
   (counts, radii, camera distance, colours, speeds, flare bands) transfer
   unchanged; the vertex shader reproduces the reference projector exactly,
   and the fragment shader reproduces the reference's fixed-pixel square
   points, including the two-layer head glow (4.2px solid + 8.8px at 0.34,
   additively 1.34× in the overlap). The signal-pulse simulation stays on
   the CPU (it's a cheap windowed walk over chain ranges) and streams a
   per-point flare-band attribute to the GPU each frame.

   The subtle drifting rule-line backdrop stays a 2D canvas underneath —
   ~30 strokes per frame is nothing, and it keeps that layer byte-identical
   to the reference. */

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

type RGB = [number, number, number]

const CORAL: RGB = [255, 107, 107]
const TEAL: RGB = [78, 205, 196]

const rgba = (c: RGB, a: number) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'
const lerpC = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
]

type Cloud = {
  positions: Float32Array
  base: Float32Array
  hot: Float32Array
  flare: Float32Array
  stepSignals: (dt: number) => void
}

function buildCloud(): Cloud {
  const N = 7600
  const positions = new Float32Array(N * 3)
  const base = new Float32Array(N * 3) // resting colour, coral→teal by height
  const hot = new Float32Array(N * 3) // saturated flare colour
  const flare = new Float32Array(N) // intensity band (0 dim, 1 tail, 2 body, 3 head)
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
  const setP = (i: number, x: number, y: number, z: number) => {
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
  }
  // 1) cell bodies — tight gaussian-ish blobs at each nucleus
  for (let i = 0; i < CORE && w < N; i++, w++) {
    const ni = i % NUCLEI
    const n = nuc[ni]
    const s = 0.24 + Math.pow(Math.random(), 2.2) * 0.5
    const th = Math.random() * Math.PI * 2,
      ph = Math.acos(2 * Math.random() - 1)
    setP(w, n[0] + Math.sin(ph) * Math.cos(th) * s, n[1] + Math.cos(ph) * s, n[2] + Math.sin(ph) * Math.sin(th) * s)
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
      setP(w, cxp, cyp, czp)
      arcPos[w] = f
      coreNuc[w] = -1
      // occasional dendritic spur off the axon — shares the parent's arc position
      if (Math.random() < 0.2 && w + 1 < N) {
        w++
        setP(
          w,
          cxp + (Math.random() - 0.5) * 0.6,
          cyp + (Math.random() - 0.5) * 0.6,
          czp + (Math.random() - 0.5) * 0.6,
        )
        arcPos[w] = f
        coreNuc[w] = -1
      }
    }
    chainEnd[chainCount] = w
    chainCount++
  }
  // pad any remainder onto the last position so nothing sits at the origin
  while (w < N) {
    setP(w, positions[(w - 1) * 3], positions[(w - 1) * 3 + 1], positions[(w - 1) * 3 + 2])
    arcPos[w] = arcPos[w - 1]
    coreNuc[w] = coreNuc[w - 1]
    w++
  }
  if (chainCount > 0) chainEnd[chainCount - 1] = Math.min(chainEnd[chainCount - 1], N)

  for (let i = 0; i < N; i++) {
    const mix = Math.max(0, Math.min(1, positions[i * 3 + 1] / 4.5 + 0.5))
    const b = lerpC(CORAL, TEAL, mix)
    const h = lerpC(HOT_CORAL, HOT_TEAL, mix)
    base[i * 3] = b[0] / 255
    base[i * 3 + 1] = b[1] / 255
    base[i * 3 + 2] = b[2] / 255
    hot[i * 3] = h[0] / 255
    hot[i * 3 + 1] = h[1] / 255
    hot[i * 3 + 2] = h[2] / 255
  }

  /* --- signals travel ALONG the chains --- */
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

  return { positions, base, hot, flare, stepSignals }
}

/* The reference projector, verbatim, in a vertex shader. Point sizes are
   fixed pixel sizes per flare band (no attenuation), exactly like the
   reference's fillRect calls. */
const VERT = /* glsl */ `
  attribute vec3 aBase;
  attribute vec3 aHot;
  attribute float aFlare;
  uniform float uYaw;
  uniform float uPitch;
  uniform float uFocal;
  uniform float uCz;
  uniform float uDpr;
  uniform vec2 uRes;
  uniform vec2 uCenter;
  varying vec3 vColor;
  varying float vFlare;
  void main() {
    float cy = cos(uYaw), sy = sin(uYaw);
    float x1 = position.x * cy - position.z * sy;
    float z1 = position.x * sy + position.z * cy;
    float cp = cos(uPitch), sp = sin(uPitch);
    float y1 = position.y * cp - z1 * sp;
    float z2 = position.y * sp + z1 * cp;
    float d = z2 + uCz;
    float s = uFocal / max(0.1, d);
    float sx = uCenter.x + x1 * s;
    float sy2 = uCenter.y - y1 * s;
    gl_Position = vec4(sx / uRes.x * 2.0 - 1.0, 1.0 - sy2 / uRes.y * 2.0, 0.0, 1.0);
    float size = aFlare > 2.5 ? 8.8 : (aFlare > 1.5 ? 3.0 : (aFlare > 0.5 ? 2.2 : 1.7));
    gl_PointSize = size * uDpr;
    vColor = aFlare > 0.5 ? aHot : aBase;
    vFlare = aFlare;
  }
`

const FRAG = /* glsl */ `
  precision mediump float;
  varying vec3 vColor;
  varying float vFlare;
  void main() {
    float a;
    if (vFlare > 2.5) {
      // head: 4.2px solid + 8.8px glow at 0.34 — the overlap adds to 1.34
      vec2 pc = abs(gl_PointCoord - 0.5);
      a = max(pc.x, pc.y) <= 0.5 * (4.2 / 8.8) ? 1.34 : 0.34;
    } else if (vFlare > 1.5) {
      a = 0.85;
    } else if (vFlare > 0.5) {
      a = 0.4;
    } else {
      a = 0.5;
    }
    gl_FragColor = vec4(vColor * a, 1.0);
  }
`

/* ---------------- shared animated backdrop (2D canvas, verbatim) ----------------
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
  const wrapRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const backdrop = backdropRef.current
    const glCanvas = glRef.current
    if (!wrap || !backdrop || !glCanvas) return

    let disposed = false
    let resizeObs: ResizeObserver | null = null
    let intersectObs: IntersectionObserver | null = null
    let retry: ReturnType<typeof setTimeout> | null = null
    let tries = 0
    let renderer: THREE.WebGLRenderer | null = null
    let geometry: THREE.BufferGeometry | null = null
    let material: THREE.ShaderMaterial | null = null

    function start(el: HTMLDivElement) {
      const ctx = backdrop!.getContext('2d')
      if (!ctx) return
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const dpr2d = Math.min(window.devicePixelRatio || 1, 1.5)
      const dprGl = Math.min(window.devicePixelRatio || 1, 2)
      const cloud = buildCloud()
      let running = false,
        visible = true,
        t = 0

      // --- three.js scene (points only; a failed WebGL context just drops the cloud) ---
      let flareAttr: THREE.BufferAttribute | null = null
      let uniforms: Record<string, THREE.IUniform> | null = null
      const scene = new THREE.Scene()
      const camera = new THREE.Camera() // projection happens in the vertex shader
      try {
        renderer = new THREE.WebGLRenderer({ canvas: glCanvas!, alpha: true, antialias: false })
        renderer.setPixelRatio(dprGl)
        geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(cloud.positions, 3))
        geometry.setAttribute('aBase', new THREE.BufferAttribute(cloud.base, 3))
        geometry.setAttribute('aHot', new THREE.BufferAttribute(cloud.hot, 3))
        flareAttr = new THREE.BufferAttribute(cloud.flare, 1)
        flareAttr.setUsage(THREE.DynamicDrawUsage)
        geometry.setAttribute('aFlare', flareAttr)
        uniforms = {
          uYaw: { value: 0.5 },
          uPitch: { value: 0.1 },
          uFocal: { value: 1 },
          uCz: { value: 12 },
          uDpr: { value: dprGl },
          uRes: { value: new THREE.Vector2(1, 1) },
          uCenter: { value: new THREE.Vector2(0, 0) },
        }
        material = new THREE.ShaderMaterial({
          vertexShader: VERT,
          fragmentShader: FRAG,
          uniforms,
          blending: THREE.AdditiveBlending,
          depthTest: false,
          depthWrite: false,
          transparent: true,
        })
        const points = new THREE.Points(geometry, material)
        points.frustumCulled = false
        scene.add(points)
      } catch {
        renderer = null
      }

      function size() {
        const w = el.clientWidth || 1100,
          h = el.clientHeight || 700
        backdrop!.width = Math.round(w * dpr2d)
        backdrop!.height = Math.round(h * dpr2d)
        if (renderer && uniforms) {
          renderer.setSize(w, h, false)
          uniforms.uRes.value.set(w, h)
          uniforms.uFocal.value = Math.min(w, h) * 0.9
          uniforms.uCenter.value.set(w * 0.7, h * 0.52)
        }
        paint()
      }
      function paint() {
        if (!ctx) return
        const w = backdrop!.width / dpr2d,
          h = backdrop!.height / dpr2d
        ctx.setTransform(dpr2d, 0, 0, dpr2d, 0, 0)
        ctx.clearRect(0, 0, w, h)
        drawBackdrop(ctx, w, h, t, reduced)
        if (renderer && uniforms && flareAttr) {
          uniforms.uYaw.value = reduced ? 0.5 : t * 0.55
          uniforms.uPitch.value = reduced ? 0.1 : Math.sin(t * 0.7) * 0.07
          flareAttr.needsUpdate = true
          renderer.render(scene, camera)
        }
      }
      function frame() {
        if (disposed || !visible || reduced) {
          running = false
          return
        }
        t += 0.0075
        cloud.stepSignals(0.026)
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
      if (wrap.clientWidth > 0) {
        start(wrap)
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
      geometry?.dispose()
      material?.dispose()
      renderer?.dispose()
    }
  }, [])

  const layer: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    display: 'block',
  }

  return (
    <div ref={wrapRef} className={className} style={style} aria-hidden="true">
      <canvas ref={backdropRef} style={layer} />
      <canvas ref={glRef} style={layer} />
    </div>
  )
}
