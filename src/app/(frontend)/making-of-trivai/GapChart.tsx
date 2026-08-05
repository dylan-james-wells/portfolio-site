'use client'

/* The commit gap chart: 28 weekly bars, coral before the gap / teal after,
   zero-weeks render as 2px coral stubs. Bars scale up from the baseline,
   staggered left→right, when the chart passes 75% of the viewport (once).
   Data extracted 2026-07-22 — static forever. */

import React, { useEffect, useRef, useState } from 'react'

const WEEKS = [
  125, 42, 53, 83, 28, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 38, 18, 118, 23, 38, 80, 70, 58, 130,
  136, 11,
]
const MAX = 136
const H = 178
const GAP_END = 16

export const GapChart: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  const [chartOn, setChartOn] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setChartOn(true)
      return
    }
    let done = false
    const onScroll = () => {
      if (done) return
      const el = rootRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight * 0.75 && r.bottom > 0) {
        done = true
        setChartOn(true)
        window.removeEventListener('scroll', onScroll)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={rootRef} id="gapchart" className="container max-w-[73.75rem]" style={{ marginTop: 26 }}>
      <div
        style={{
          border: '2px solid rgba(255,255,255,0.2)',
          background: 'hsl(249 23% 8%)',
          padding: '28px 26px 14px',
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
            marginBottom: 22,
            minWidth: 900,
          }}
        >
          <span style={{ fontSize: 11, letterSpacing: '0.12em', color: '#4ecdc4' }}>
            WEEKLY COMMITS — trivai-tokens · JAN–JUL 2026
          </span>
          <span style={{ fontSize: 11, color: 'hsl(215 20% 55%)' }}>extracted 2026-07-22</span>
        </div>
        <div style={{ position: 'relative', minWidth: 900 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 6,
              height: 190,
              borderBottom: '2px solid rgba(255,255,255,0.35)',
            }}
          >
            {WEEKS.map((c, i) => {
              const teal = i >= GAP_END
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    height: '100%',
                    position: 'relative',
                  }}
                >
                  {c === 0 ? (
                    <div
                      style={{
                        width: '100%',
                        height: 2,
                        background: 'rgba(255,107,107,0.28)',
                        marginBottom: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        background: teal ? '#4ecdc4' : '#ff6b6b',
                        height: Math.max(3, Math.round((c / MAX) * H)),
                        transformOrigin: 'bottom',
                        transform: `scaleY(${chartOn ? 1 : 0})`,
                        transition: 'transform .7s cubic-bezier(.2,.7,.2,1)',
                        transitionDelay: `${(i * 0.055).toFixed(2)}s`,
                        boxShadow: `0 0 10px ${teal ? 'rgba(78,205,196,0.35)' : 'rgba(255,107,107,0.35)'}`,
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
          {/* annotations */}
          <div
            style={{
              position: 'absolute',
              left: '16.5%',
              top: -8,
              fontSize: 10.5,
              color: 'hsl(215 20% 62%)',
              borderLeft: '1px dashed rgba(255,255,255,0.35)',
              paddingLeft: 7,
            }}
          >
            last commit
            <br />
            before the gap
            <br />
            <span style={{ color: '#ff6b6b' }}>Feb 24</span>
          </div>
          <div
            style={{
              position: 'absolute',
              left: '36%',
              top: 34,
              width: '24%',
              textAlign: 'center',
              fontSize: 11,
              letterSpacing: '0.14em',
              color: 'hsl(215 20% 48%)',
            }}
          >
            — the silent stretch —
          </div>
          <div
            style={{
              position: 'absolute',
              left: '61.5%',
              top: -8,
              fontSize: 10.5,
              color: 'hsl(215 20% 62%)',
              borderLeft: '1px dashed rgba(78,205,196,0.6)',
              paddingLeft: 7,
            }}
          >
            comeback:
            <br />
            &quot;add stealing&quot;
            <br />
            <span style={{ color: '#4ecdc4' }}>May 8</span>
          </div>
          <div
            style={{
              position: 'absolute',
              right: '2%',
              top: -8,
              fontSize: 10.5,
              color: 'hsl(215 20% 62%)',
              textAlign: 'right',
              borderRight: '1px dashed rgba(78,205,196,0.6)',
              paddingRight: 7,
            }}
          >
            public launch
            <br />
            <span style={{ color: '#4ecdc4' }}>Jul 11</span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            minWidth: 900,
            marginTop: 10,
            fontSize: 10.5,
            color: 'hsl(215 20% 50%)',
          }}
        >
          <span>JAN</span>
          <span>FEB</span>
          <span>MAR</span>
          <span>APR</span>
          <span>MAY</span>
          <span>JUN</span>
          <span>JUL</span>
        </div>
      </div>
    </div>
  )
}
