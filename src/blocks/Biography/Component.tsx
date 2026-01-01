import type { BiographyBlock as BiographyBlockProps } from '@/payload-types'

import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import { VideoPlane } from './VideoPlane'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type Props = {
  className?: string
} & BiographyBlockProps

export const BiographyBlock: React.FC<Props> = ({ className, title, body, media, alignment }) => {
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
    <div className={cn('container', className)}>
      <div className="flex justify-between flex-col md:flex-row items-center gap-8">
        {/* Text - always first on mobile, uses order for desktop positioning */}
        <div
          className={cn('w-full md:w-1/2', {
            'md:order-2': isMediaLeft,
            'md:order-1': !isMediaLeft,
          })}
        >
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <RichText data={body} enableGutter={false} />
        </div>
        {/* Media - second on mobile, uses order for desktop positioning */}
        <div
          className={cn('w-full md:w-auto', {
            'md:order-1': isMediaLeft,
            'md:order-2': !isMediaLeft,
          })}
        >
          {hasVideo && videoUrl ? (
            <VideoPlane videoUrl={videoUrl} posterUrl={posterUrl} className="rounded-lg w-full md:w-[300px]" />
          ) : (
            posterImage && <Media resource={posterImage} imgClassName="rounded-lg w-full md:w-[300px]" />
          )}
        </div>
      </div>
    </div>
  )
}
