'use client'

import type { Work, WorksGridBlockType } from '@/payload-types'

import React, { useState } from 'react'
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
  const { slug, title, thumbnail, heroImage, description } = work
  const [isHovered, setIsHovered] = useState(false)
  const [revealed, setRevealed] = useState(false)

  return (
    <Link
      href={`/works/${slug}`}
      className="group flex flex-col overflow-hidden rounded-lg transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <WindowReveal threshold={1} callback={() => setRevealed(true)}>
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

      <div
        className="bg-noise-gradient relative flex flex-col justify-center bg-card border-2 border-t-0 border-white overflow-hidden transition-all duration-500 ease"
        style={{
          maxHeight: revealed ? '200px' : '0px',
          borderWidth: revealed ? '2px' : '0px',
        }}
      >
        <div className="p-4">
          {title && (
            <h3 className="text-md font-semibold text-center">
              <GlitchHover active={isHovered}>
                <GlitchTextReveal>{title}</GlitchTextReveal>
              </GlitchHover>
            </h3>
          )}
        </div>
      </div>
    </Link>
  )
}
