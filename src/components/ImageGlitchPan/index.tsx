'use client'

import React, { useRef, useEffect, useState } from 'react'
import { cn } from '@/utilities/ui'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { useIsAndroid } from '@/utilities/useIsAndroid'
import type { Media as MediaType } from '@/payload-types'

interface ImageGlitchPanProps {
  resource?: MediaType | string | number | null
  src?: string
  alt?: string
  className?: string
  imageClassName?: string
  glitchClassName?: string
  animationDelay?: number
}

export const ImageGlitchPan: React.FC<ImageGlitchPanProps> = ({
  resource,
  src: srcFromProps,
  alt: altFromProps,
  className,
  imageClassName,
  glitchClassName,
  animationDelay = 0,
}) => {
  const isAndroid = useIsAndroid()
  const containerRef = useRef<HTMLDivElement>(null)
  // Used to force repaint on Android when element becomes visible again
  const [repaintKey, setRepaintKey] = useState(0)
  let src = srcFromProps || ''
  let alt = altFromProps || ''

  if (!src && resource && typeof resource === 'object') {
    const { alt: altFromResource, url } = resource
    alt = altFromResource || ''
    const cacheTag = resource.updatedAt
    src = getMediaUrl(url, cacheTag)
  }

  const delayStyle = animationDelay ? { animationDelay: `${animationDelay}ms` } : undefined

  // Force repaint when element becomes visible again on Android
  // Android aggressively releases GPU resources when scrolling, causing background-images to disappear
  useEffect(() => {
    if (!isAndroid || !containerRef.current) return

    let wasHidden = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && wasHidden) {
          // Force a repaint by updating the key
          setRepaintKey((k) => k + 1)
          wasHidden = false
        } else if (!entry.isIntersecting) {
          wasHidden = true
        }
      },
      { threshold: 0 },
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [isAndroid])

  return (
    <div
      ref={containerRef}
      className={cn('group relative overflow-hidden', className)}
      role="img"
      aria-label={alt}
    >
      {/* Base panning image with blur */}
      <div
        key={repaintKey}
        className={cn(
          'absolute left-1/2 top-0 h-full w-[1152px] max-w-none',
          'animate-image-pan bg-cover',
          'blur-[3px] transition-[filter] duration-400',
          'group-hover:blur-0',
          imageClassName,
        )}
        style={{
          backgroundImage: `url(${src})`,
          ...delayStyle,
        }}
      >
        {/* Glitch overlay - skip on Android as mix-blend-mode causes rendering issues */}
        {!isAndroid && (
          <div
            className={cn(
              'absolute inset-0 z-[1]',
              'animate-glitch-pan bg-cover',
              'opacity-50 mix-blend-hard-light',
              glitchClassName,
            )}
            style={{
              backgroundImage: `url(${src})`,
              ...delayStyle,
            }}
          />
        )}
      </div>
    </div>
  )
}
