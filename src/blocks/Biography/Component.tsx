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

  const hasVideo = videoFile && typeof videoFile === 'object' && videoFile.filename
  const posterUrl =
    posterImage && typeof posterImage === 'object'
      ? getMediaUrl(`/media/${posterImage.filename}`)
      : undefined

  return (
    <div className={cn('container', className)}>
      <div
        className={cn('flex flex-col md:flex-row items-center gap-8', {
          'md:flex-row-reverse': !isMediaLeft,
        })}
      >
        <div className="w-full md:w-1/2">
          {hasVideo ? (
            <VideoPlane
              videoUrl={getMediaUrl(`/media/${videoFile.filename}`)}
              posterUrl={posterUrl}
              className="rounded-lg"
            />
          ) : (
            posterImage && <Media resource={posterImage} imgClassName="rounded-lg w-full" />
          )}
        </div>
        <div className="w-full md:w-1/2">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <RichText data={body} enableGutter={false} />
        </div>
      </div>
    </div>
  )
}
