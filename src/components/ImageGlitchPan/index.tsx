'use client'

import React from 'react'
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
  let src = srcFromProps || ''
  let alt = altFromProps || ''

  if (!src && resource && typeof resource === 'object') {
    const { alt: altFromResource, url } = resource
    alt = altFromResource || ''
    const cacheTag = resource.updatedAt
    src = getMediaUrl(url, cacheTag)
  }

  const delayStyle = animationDelay ? { animationDelay: `${animationDelay}ms` } : undefined

  // On Android, use a simpler static image without glitch effects
  // mix-blend-mode and complex animations cause rendering issues
  if (isAndroid) {
    return (
      <div className={cn('group relative overflow-hidden', className)} role="img" aria-label={alt}>
        <div
          className={cn(
            'absolute inset-0',
            'bg-cover bg-center',
            'transition-transform duration-300',
            'group-hover:scale-105',
            imageClassName,
          )}
          style={{
            backgroundImage: `url(${src})`,
          }}
        />
      </div>
    )
  }

  return (
    <div className={cn('group relative overflow-hidden', className)} role="img" aria-label={alt}>
      {/* Base panning image with blur */}
      <div
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
        {/* Glitch overlay */}
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
      </div>
    </div>
  )
}
