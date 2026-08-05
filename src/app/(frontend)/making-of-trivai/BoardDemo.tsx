'use client'

/* Ring-bonus auto demo: a 6×6 board that loops idle → tile answered (×1.5
   ring) → second tile (×2.25 overlap) → clear, one step every 2.2s. Reduced
   motion freezes on step 2, the ×2.25 overlap state. */

import React, { useEffect, useState } from 'react'

const A = 14
const B = 16

function nb(idx: number): number[] {
  const r = Math.floor(idx / 6),
    c = idx % 6
  const out: number[] = []
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      const rr = r + dr,
        cc = c + dc
      if (rr >= 0 && rr < 6 && cc >= 0 && cc < 6) out.push(rr * 6 + cc)
    }
  return out
}

const CAPS = [
  'board idle',
  'tile answered → ring lights ×1.5',
  'second tile → overlap hits ×2.25',
  'rings clear at turn end',
]

export const BoardDemo: React.FC = () => {
  const [boardStep, setBoardStep] = useState(0)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduced(true)
      setBoardStep(2)
      return
    }
    let bs = 0
    const id = setInterval(() => {
      bs = (bs + 1) % 4
      setBoardStep(bs)
    }, 2200)
    return () => clearInterval(id)
  }, [])

  const step = boardStep
  const rings: Record<number, number> = {}
  if (step >= 1) nb(A).forEach((i) => (rings[i] = (rings[i] || 0) + 1))
  if (step >= 2) nb(B).forEach((i) => (rings[i] = (rings[i] || 0) + 1))

  const tiles = []
  for (let i = 0; i < 36; i++) {
    const base = [100, 250, 500][Math.floor(i / 6) % 3]
    const answered = (step >= 1 && i === A) || (step >= 2 && i === B)
    const r = answered ? 0 : rings[i] || 0
    let bg = 'hsl(249 23% 11%)',
      border = 'rgba(255,255,255,0.18)',
      color = 'hsl(215 20% 62%)',
      label = String(base)
    if (answered) {
      bg = 'rgba(78,205,196,0.18)'
      border = '#4ecdc4'
      color = '#4ecdc4'
      label = '✓'
    } else if (r >= 2) {
      bg = 'rgba(123,104,238,0.28)'
      border = '#5b4fc7'
      color = '#c9c0ff'
      label = '×2.25'
    } else if (r === 1) {
      bg = 'rgba(212,160,23,0.22)'
      border = '#996515'
      color = '#fbbf24'
      label = '×1.5'
    }
    tiles.push({ bg, border, color, label })
  }

  const boardCaption = reduced ? CAPS[2] : CAPS[step]

  return (
    <div
      style={{
        border: '2px solid rgba(255,255,255,0.25)',
        background: 'hsl(249 23% 7%)',
        padding: 22,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 11, letterSpacing: '0.12em', color: '#4ecdc4' }}>
          RING BONUSES — AUTO DEMO
        </span>
        <span style={{ fontSize: 11, color: 'hsl(215 20% 55%)' }}>{boardCaption}</span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6,1fr)',
          gap: 5,
          maxWidth: 380,
          margin: '0 auto',
        }}
      >
        {tiles.map((t, i) => (
          <div
            key={i}
            style={{
              aspectRatio: '1 / 1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10.5,
              fontWeight: 700,
              border: `1px solid ${t.border}`,
              background: t.bg,
              color: t.color,
              transition: 'all .5s ease',
            }}
          >
            {t.label}
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
          marginTop: 16,
          fontSize: 10.5,
          color: 'hsl(215 20% 60%)',
        }}
      >
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 9,
              height: 9,
              background: '#4ecdc4',
              verticalAlign: -1,
            }}
          />{' '}
          answered
        </span>
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 9,
              height: 9,
              background: '#d4a017',
              verticalAlign: -1,
            }}
          />{' '}
          ×1.5 gold
        </span>
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 9,
              height: 9,
              background: '#7b68ee',
              verticalAlign: -1,
            }}
          />{' '}
          ×2.25 electric
        </span>
      </div>
    </div>
  )
}
