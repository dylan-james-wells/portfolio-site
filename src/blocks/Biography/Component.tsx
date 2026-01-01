import type { BiographyBlock as BiographyBlockProps } from '@/payload-types'

import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'

type Props = {
  className?: string
} & BiographyBlockProps

export const BiographyBlock: React.FC<Props> = ({ className, title, body, image, alignment }) => {
  const isImageLeft = alignment === 'left'

  return (
    <div className={cn('container', className)}>
      <div
        className={cn('flex flex-col md:flex-row items-center gap-8', {
          'md:flex-row-reverse': !isImageLeft,
        })}
      >
        <div className="w-full md:w-1/2">
          {image && <Media resource={image} imgClassName="rounded-lg w-full" />}
        </div>
        <div className="w-full md:w-1/2">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <RichText data={body} enableGutter={false} />
        </div>
      </div>
    </div>
  )
}
