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
  BOTTOM_VALUES,
  MASK_D,
  MASK_VALUES,
  TOP_D,
  TOP_VALUES,
} from './waveform'

type Props = {
  className?: string
  blockIndex?: number
  blockName?: string
} & TrivaiBandBlockProps

// Hardcoded for now (per handoff); the set may grow — keep it array-driven.
const BG_IMAGES = ['/trivai/tg-bg-1.png', '/trivai/tg-bg-2.png', '/trivai/tg-bg-3.png']
const BG_CYCLE_S = 12

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
  const maskSvgRef = useRef<SVGSVGElement>(null)
  const seamSvgRef = useRef<SVGSVGElement>(null)
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

  // SMIL animations can't be paused from CSS.
  useEffect(() => {
    for (const svg of [maskSvgRef.current, seamSvgRef.current]) {
      if (!svg) continue
      if (inView) svg.unpauseAnimations()
      else svg.pauseAnimations()
    }
  }, [inView, reducedMotion])

  if (hidden) return null

  const blockId = blockName ? `${blockName}-${blockIndex}` : undefined
  const maskId = `tgWaveMask-${blockIndex ?? 0}`
  const animate = !reducedMotion

  const play = {
    label: playButton?.label || 'PLAY FREE',
    url: playButton?.url || 'https://trivai.games',
    icon: 'play' as const,
  }
  const synopsis = {
    label: synopsisButton?.label || 'READ THE MAKING-OF',
    url: synopsisButton?.url || 'https://dylanjwells.com/writing/making-trivai',
    icon: 'synopsis' as const,
  }
  const ctas = buttonOrder === 'synopsisFirst' ? [synopsis, play] : [play, synopsis]

  return (
    <div
      ref={rootRef}
      id={blockId}
      className={cn(styles.band, !inView && styles.paused, className)}
      style={{ '--tg-mask': `url(#${maskId})` } as React.CSSProperties}
    >
      <svg ref={maskSvgRef} width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={BAND_W}
            height={BAND_H}
          >
            <rect x="0" y="0" width={BAND_W} height={BAND_H} fill="#000" />
            <path fill="#fff" d={MASK_D}>
              {animate && (
                <animate
                  attributeName="d"
                  dur="2.6s"
                  repeatCount="indefinite"
                  calcMode="linear"
                  values={MASK_VALUES}
                />
              )}
            </path>
          </mask>
        </defs>
      </svg>

      {/* torn-edge chromatic bleed (loops seamlessly; fixed px period) */}
      <div className={styles.bleedRed} style={{ backgroundImage: `url(${BG_IMAGES[0]})` }} />
      <div className={styles.bleedCyan} style={{ backgroundImage: `url(${BG_IMAGES[0]})` }} />

      {/* the screen (torn edges via tiling mask) */}
      <div className={styles.screen}>
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
        ref={seamSvgRef}
        className={styles.seams}
        width={BAND_W}
        height={BAND_H}
        viewBox={`0 0 ${BAND_W} ${BAND_H}`}
        aria-hidden="true"
      >
        <path
          className={styles.seamTop}
          fill="none"
          stroke="#ff8f8f"
          strokeWidth="2.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          d={TOP_D}
        >
          {animate && (
            <animate
              attributeName="d"
              dur="2.6s"
              repeatCount="indefinite"
              calcMode="linear"
              values={TOP_VALUES}
            />
          )}
        </path>
        <path
          className={styles.seamBottom}
          fill="none"
          stroke="#7fe6dd"
          strokeWidth="2.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          d={BOTTOM_D}
        >
          {animate && (
            <animate
              attributeName="d"
              dur="2.6s"
              repeatCount="indefinite"
              calcMode="linear"
              values={BOTTOM_VALUES}
            />
          )}
        </path>
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
