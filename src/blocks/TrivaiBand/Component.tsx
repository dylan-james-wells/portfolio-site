'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { cn } from '@/utilities/ui'
import type { TrivaiBandBlock as TrivaiBandBlockProps } from '@/payload-types'

import styles from './TrivaiBand.module.css'
import {
  BAND_H,
  BAND_W,
  BOTTOM_D,
  CLIP_D,
  FRAME_YS,
  TOP_D,
  buildBottomPath,
  buildClipPath,
  buildTopPath,
} from './waveform'

type Props = {
  className?: string
  blockIndex?: number
  blockName?: string
} & TrivaiBandBlockProps

// Hardcoded for now (per handoff); the set may grow — keep it array-driven.
const BG_IMAGES = ['/trivai/tg-bg-1.png', '/trivai/tg-bg-2.png', '/trivai/tg-bg-3.png']
const BG_CYCLE_S = 12

/* The torn-edge clipping. Safari doesn't support CSS mask references to an
   inline SVG <mask>, and Chrome's compositor mis-scales *animated*
   clip-path: path() keyframes — so the morph is driven imperatively: one rAF
   loop lerps between the waveform frames (matching the reference's 2.6s
   linear SMIL morph) and writes the clip-path style and seam `d` attributes
   together, which also keeps the seam lines and clipped edge in exact sync. */
const MORPH_DUR_MS = 2600
const CLIP_STATIC = `path('${CLIP_D}')`

// Absolute URLs pointing at the site itself navigate in-tab as internal links.
const SITE_HOSTS = new Set(['dylanjwells.com', 'www.dylanjwells.com'])

const CtaLink: React.FC<{
  label: string
  url: string
  icon: 'play' | 'synopsis'
}> = ({ label, url, icon }) => {
  let href = url
  let isExternal = false
  if (/^https?:\/\//.test(url)) {
    try {
      const u = new URL(url)
      if (SITE_HOSTS.has(u.host)) {
        href = u.pathname + u.search + u.hash
      } else {
        isExternal = true
      }
    } catch {
      isExternal = true
    }
  }

  const inner = (
    <>
      {icon === 'synopsis' && <BookOpen size={15} strokeWidth={2} aria-hidden="true" />}
      {label}
      {icon === 'play' && <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />}
    </>
  )

  if (isExternal) {
    return (
      <a className={styles.btn} href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    )
  }
  return (
    <Link className={styles.btn} href={href}>
      {inner}
    </Link>
  )
}

export const TrivaiBandBlock: React.FC<Props> = ({
  className,
  blockIndex,
  blockName,
  hidden,
  buttonOrder,
  playButton,
  synopsisButton,
}) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const topPathRef = useRef<SVGPathElement>(null)
  const bottomPathRef = useRef<SVGPathElement>(null)
  const phaseRef = useRef(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Pause the many composited layers while the band is off-screen.
  useEffect(() => {
    if (!rootRef.current) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '100px',
    })
    observer.observe(rootRef.current)
    return () => observer.disconnect()
  }, [])

  // The edge morph: lerp between adjacent waveform frames and write the
  // clip-path + seam paths together. Pauses off-screen (phase is kept so it
  // resumes where it left off); reduced motion never starts it.
  useEffect(() => {
    if (reducedMotion || !inView) return
    const root = rootRef.current
    if (!root) return
    const layers = root.querySelectorAll<HTMLElement>('[data-tg-clip]')
    const segs = FRAME_YS.length - 1
    const lerped = new Array<number>(FRAME_YS[0].length)
    let raf = 0
    let last: number | null = null
    const tick = (now: number) => {
      if (last !== null) {
        phaseRef.current = (phaseRef.current + (now - last) / MORPH_DUR_MS) % 1
      }
      last = now
      const seg = phaseRef.current * segs
      const i = Math.floor(seg)
      const f = seg - i
      const a = FRAME_YS[i]
      const b = FRAME_YS[i + 1]
      for (let k = 0; k < lerped.length; k++) lerped[k] = a[k] + (b[k] - a[k]) * f
      const clip = `path('${buildClipPath(lerped)}')`
      layers.forEach((el) => {
        el.style.clipPath = clip
      })
      topPathRef.current?.setAttribute('d', buildTopPath(lerped))
      bottomPathRef.current?.setAttribute('d', buildBottomPath(lerped))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reducedMotion, inView])

  if (hidden) return null

  const blockId = blockName ? `${blockName}-${blockIndex}` : undefined

  const play = {
    label: playButton?.label || 'PLAY FREE',
    url: playButton?.url || 'https://trivai.games',
    icon: 'play' as const,
  }
  const synopsis = {
    label: synopsisButton?.label || 'READ THE MAKING-OF',
    url: synopsisButton?.url || 'https://dylanjwells.com/making-of-trivai',
    icon: 'synopsis' as const,
  }
  const ctas = buttonOrder === 'synopsisFirst' ? [synopsis, play] : [play, synopsis]

  return (
    <div
      ref={rootRef}
      id={blockId}
      className={cn(styles.band, !inView && styles.paused, className)}
    >
      {/* torn-edge chromatic bleed (loops seamlessly; fixed px period) */}
      <div
        data-tg-clip
        className={styles.bleedRed}
        style={{ backgroundImage: `url(${BG_IMAGES[0]})`, clipPath: CLIP_STATIC }}
      />
      <div
        data-tg-clip
        className={styles.bleedCyan}
        style={{ backgroundImage: `url(${BG_IMAGES[0]})`, clipPath: CLIP_STATIC }}
      />

      {/* the screen (torn edges via the animated clip-path) */}
      <div data-tg-clip className={styles.screen} style={{ clipPath: CLIP_STATIC }}>
        {BG_IMAGES.map((src, i) => (
          <div
            key={src}
            className={cn(styles.bg, i === 0 && styles.bgLead)}
            style={{
              backgroundImage: `url(${src})`,
              animationDelay: `-${(BG_CYCLE_S / BG_IMAGES.length) * i}s`,
            }}
          />
        ))}
        <div className={styles.rgbRed} style={{ backgroundImage: `url(${BG_IMAGES[0]})` }} />
        <div className={styles.rgbCyan} style={{ backgroundImage: `url(${BG_IMAGES[0]})` }} />
        <div className={styles.scanlines} />
        <div className={styles.slice1} style={{ backgroundImage: `url(${BG_IMAGES[1]})` }} />
        <div className={styles.slice2} style={{ backgroundImage: `url(${BG_IMAGES[2]})` }} />
        <div className={styles.vignette} />
        <div className={styles.dim} />
        <div className={styles.sheen} />
        <div className={styles.flicker} />
        <div className={styles.tracking} />
      </div>

      {/* animated waveform seam lines (1:1 px, left-anchored, clipped by the band) */}
      <svg
        className={styles.seams}
        width={BAND_W}
        height={BAND_H}
        viewBox={`0 0 ${BAND_W} ${BAND_H}`}
        aria-hidden="true"
      >
        <path
          ref={topPathRef}
          className={styles.seamTop}
          fill="none"
          stroke="#ff8f8f"
          strokeWidth="2.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          d={TOP_D}
        />
        <path
          ref={bottomPathRef}
          className={styles.seamBottom}
          fill="none"
          stroke="#7fe6dd"
          strokeWidth="2.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          d={BOTTOM_D}
        />
      </svg>

      {/* overlaid content: signal tag + CTAs */}
      <div className={styles.content}>
        <div className={styles.badge}>
          <span className={styles.liveDot} />
          LIVE · trivai.games
        </div>
        <div className={styles.lockup}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.mark} src="/trivai/trivai-mark.svg" alt="" width={46} height={46} />
          <span className={styles.wordmark}>
            triv<span className={styles.wordmarkAi}>ai</span>
          </span>
        </div>
        <div className={styles.buttons}>
          {ctas.map((cta) => (
            <CtaLink key={cta.icon} {...cta} />
          ))}
        </div>
      </div>
    </div>
  )
}
