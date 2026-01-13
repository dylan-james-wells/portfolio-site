'use client'

import type { Work, WorksGridBlockType } from '@/payload-types'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

import { Media } from '@/components/Media'
import { GlitchTextReveal } from '@/components/GlitchTextReveal'
import { GlitchHover } from '@/components/GlitchHover'
import { ImageGlitchPan } from '@/components/ImageGlitchPan'
import { WindowReveal } from '@/components/WindowReveal'
import { TextOutline } from '@/components/TextOutline'

export const WorksGridBlock: React.FC<
  WorksGridBlockType & {
    id?: string
    blockIndex?: number
    blockName?: string
  }
> = (props) => {
  const { title, description, works: selectedWorks, blockIndex, blockName } = props
  const blockId = blockName ? `${blockName}-${blockIndex}` : undefined

  // Filter out any non-object entries (in case they're just IDs)
  const works = (selectedWorks || []).filter(
    (work): work is Work => typeof work === 'object' && work !== null,
  )

  return (
    <div className="my-16 select-none" id={blockId}>
      <div className="container py-8">
        {(title || description) && (
          <TextOutline className="inline-block" useNoiseGradient>
            <div className="mb-12 p-4">
              {title && (
                <h2 className="text-3xl font-bold mb-4">
                  <GlitchTextReveal>{title}</GlitchTextReveal>
                </h2>
              )}
              {description && (
                <p>
                  <GlitchTextReveal>{description}</GlitchTextReveal>
                </p>
              )}
            </div>
          </TextOutline>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {works.map((work, i) => (
            <WorkCard key={work.id} work={work} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

const WorkCard: React.FC<{ work: Work; index: number }> = ({ work, index }) => {
  const { slug, title, thumbnail, heroImage } = work
  const [isHovered, setIsHovered] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [contentHeight, setContentHeight] = useState<number | null>(null)
  const measureRef = useRef<HTMLDivElement>(null)

  // Measure content height on mount using hidden measurement div
  useEffect(() => {
    if (measureRef.current && contentHeight === null) {
      setContentHeight(measureRef.current.offsetHeight)
    }
  }, [contentHeight])

  const titleContent = (
    <div className="p-4">
      {title && (
        <h3 className="text-md font-semibold text-center">
          <GlitchHover active={isHovered}>
            <GlitchTextReveal>{title}</GlitchTextReveal>
          </GlitchHover>
        </h3>
      )}
    </div>
  )

  return (
    <Link
      href={`/works/${slug}`}
      className="group flex flex-col overflow-hidden rounded-lg transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <WindowReveal threshold={0.99} callback={() => setRevealed(true)}>
        <div className="aspect-video relative overflow-hidden w-full">
          <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105">
            {/* Hero image as background */}
            {heroImage && typeof heroImage !== 'string' && (
              <ImageGlitchPan
                resource={heroImage}
                alt="Project screenshot"
                className="h-full"
                animationDelay={200 * index}
              />
            )}
            {/* Thumbnail image on top */}
            {thumbnail && typeof thumbnail !== 'string' ? (
              <Media
                resource={thumbnail}
                className="absolute top-0 left-0 z-10 w-full h-full group-hover:blur-sm transition-[filter] duration-300"
                imgClassName="w-full h-full object-contain p-[10%]"
              />
            ) : (
              <div className="relative z-10 w-full h-full bg-muted flex items-center justify-center">
                <GlitchTextReveal>No image</GlitchTextReveal>
              </div>
            )}
          </div>
        </div>
      </WindowReveal>

      {/* Hidden measurement div - renders off-screen to get height */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className="bg-noise-gradient flex flex-col justify-center bg-card border-2 border-t-0 border-white"
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {titleContent}
      </div>

      {/* Fixed height container with clip-path reveal */}
      <div
        style={{ height: contentHeight ?? 0 }}
        className="relative overflow-hidden"
      >
        <div
          className="bg-noise-gradient flex flex-col justify-center bg-card border-2 border-t-0 border-white transition-[clip-path] duration-500 linear"
          style={{
            clipPath: revealed ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
          }}
        >
          {titleContent}
        </div>
        {/* Animated white line following the clip edge */}
        <div
          className="absolute left-0 right-0 h-[2px] bg-white transition-all duration-500 linear"
          style={{
            bottom: revealed ? '0%' : '100%',
            opacity: revealed ? 0 : 1,
          }}
        />
      </div>
    </Link>
  )
}
