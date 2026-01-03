import type { Work, WorksBlockType } from '@/payload-types'

import React from 'react'
import Link from 'next/link'

import { Media } from '@/components/Media'
import { GlitchTextReveal } from '@/components/GlitchTextReveal'

export const WorksBlock: React.FC<
  WorksBlockType & {
    id?: string
  }
> = (props) => {
  const { id, title, description, works: selectedWorks } = props

  // Filter out any non-object entries (in case they're just IDs)
  const works = (selectedWorks || []).filter(
    (work): work is Work => typeof work === 'object' && work !== null,
  )

  return (
    <div className="my-16" id={`block-${id}`}>
      <div className="container">
        {(title || description) && (
          <div className="mb-12">
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
        )}
        <div className="flex flex-col gap-6">
          {works.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      </div>
    </div>
  )
}

const WorkCard: React.FC<{ work: Work }> = ({ work }) => {
  const { slug, title, thumbnail, description } = work

  return (
    <Link href={`/works/${slug}`} className="flex gap-6">
      <div className="aspect-square relative overflow-hidden rounded-lg w-full md:w-[200px]">
        {thumbnail && typeof thumbnail !== 'string' ? (
          <Media
            resource={thumbnail}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <GlitchTextReveal>No image</GlitchTextReveal>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center py-4 pr-4">
        {title && (
          <h3 className="text-xl font-semibold mb-2">
            <GlitchTextReveal>{title}</GlitchTextReveal>
          </h3>
        )}
        {description && (
          <p className="line-clamp-3">
            <GlitchTextReveal>{description}</GlitchTextReveal>
          </p>
        )}
      </div>
    </Link>
  )
}
