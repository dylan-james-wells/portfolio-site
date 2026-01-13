import type { BiographyBlock as BiographyBlockProps } from '@/payload-types'

import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import { VideoPlane } from './VideoPlane'
import { getMediaUrl } from '@/utilities/getMediaUrl'

import { WindowReveal } from '@/components/WindowReveal'
import { GlitchTextReveal } from '@/components/GlitchTextReveal'
import { TextOutline } from '@/components/TextOutline'

type Props = {
  className?: string
  blockIndex?: number
  blockName?: string
} & BiographyBlockProps

export const BiographyBlock: React.FC<Props> = ({ className, title, body, media, alignment, blockIndex, blockName }) => {
  const blockId = blockName ? `${blockName}-${blockIndex}` : undefined
  const isMediaLeft = alignment === 'left'

  const posterImage = media?.posterImage
  const videoFile = media?.videoFile

  const hasVideo = videoFile && typeof videoFile === 'object' && videoFile.url
  const videoUrl = hasVideo ? getMediaUrl(videoFile.url, videoFile.updatedAt) : undefined
  const posterUrl =
    posterImage && typeof posterImage === 'object' && posterImage.url
      ? getMediaUrl(posterImage.url, posterImage.updatedAt)
      : undefined

  return (
    <div className={cn('container select-none', className)} id={blockId}>
      <div className="flex justify-between flex-col md:flex-row items-center gap-8 py-16">
        {/* Text - always first on mobile, uses order for desktop positioning */}
        <div
          className={cn('w-full md:w-1/2', {
            'md:order-2': isMediaLeft,
            'md:order-1': !isMediaLeft,
          })}
        >
          <TextOutline className="inline-block" useNoiseGradient>
            <h2 className="text-3xl font-bold">
              <GlitchTextReveal className="relative p-4 pb-0 inline-block">{title}</GlitchTextReveal>
            </h2>
            <GlitchTextReveal className="p-4 inline-block">
              <RichText data={body} enableGutter={false} />
            </GlitchTextReveal>
          </TextOutline>
        </div>
        {/* Media - second on mobile, uses order for desktop positioning */}
        <div
          className={cn('w-full md:w-auto', {
            'md:order-1': isMediaLeft,
            'md:order-2': !isMediaLeft,
          })}
        >
          <WindowReveal threshold={0.99}>
            {hasVideo && videoUrl ? (
              <VideoPlane
                videoUrl={videoUrl}
                posterUrl={posterUrl}
                className="rounded-lg w-full md:w-[400px]"
              />
            ) : (
              posterImage && (
                <Media resource={posterImage} imgClassName="rounded-lg w-full md:w-[400px]" />
              )
            )}
          </WindowReveal>
        </div>
      </div>
    </div>
  )
}
