'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { PyramidCubes } from '@/components/PyramidCubes'

// Mirrors the loading overlay inside HeroSlider so the page looks identical
// while the heavy chunk downloads (and in the SSR HTML), with no layout shift.
const HeroSliderFallback: React.FC = () => (
  <div style={{ paddingTop: '100vh' }}>
    <div className="fixed inset-0 bg-noise-gradient-clipped overflow-hidden" style={{ zIndex: 50 }}>
      <div className="loader-gradient-overlay" />
      <div className="noise-overlay-clipped" style={{ opacity: 0.15 }} />
      <div className="flex items-center justify-center" style={{ position: 'absolute', inset: 0 }}>
        <PyramidCubes />
      </div>
    </div>
  </div>
)

// Client-side dynamic import so three.js/postprocessing/troika are split into
// their own chunk and fetched after hydration instead of blocking page load.
// (next/dynamic only code-splits on the client when called from a client
// component - in a server component the chunk is preloaded eagerly.)
export const HeroSliderLazy = dynamic(
  () => import('./index').then((mod) => ({ default: mod.HeroSlider })),
  {
    ssr: false,
    loading: () => <HeroSliderFallback />,
  },
)
