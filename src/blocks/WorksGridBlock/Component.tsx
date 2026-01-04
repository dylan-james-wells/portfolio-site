import type { Work, WorksGridBlockType } from '@/payload-types'

import React from 'react'
import Link from 'next/link'

import { Media } from '@/components/Media'
import { GlitchTextReveal } from '@/components/GlitchTextReveal'
import { ImageGlitchPan } from '@/components/ImageGlitchPan'

export const WorksGridBlock: React.FC<
  WorksGridBlockType & {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {works.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      </div>
    </div>
  )
}

const WorkCard: React.FC<{ work: Work }> = ({ work }) => {
  const { slug, title, thumbnail, heroImage, description } = work

  return (
    <Link
      href={`/works/${slug}`}
      className="group flex flex-row sm:flex-row md:flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:bg-accent"
    >
      <div className="aspect-square sm:aspect-square md:aspect-video relative overflow-hidden w-1/3 sm:w-1/3 md:w-full shrink-0">
        {/* Hero image as background */}
        {heroImage && typeof heroImage !== 'string' && (
          // <Media
          //   resource={heroImage}
          //   className="absolute inset-0 w-full h-full object-cover opacity-50"
          //   imgClassName="h-full object-cover"
          // />
          <ImageGlitchPan
            resource={heroImage}
            alt="Project screenshot"
            className="h-[300px]"
            animationDelay={200}
          />
        )}
        {/* Thumbnail image on top */}
        {thumbnail && typeof thumbnail !== 'string' ? (
          <Media
            resource={thumbnail}
            className="relative z-10 w-full h-full group-hover:scale-105 transition-transform duration-300"
            imgClassName="w-full h-full object-contain p-4"
          />
        ) : (
          <div className="relative z-10 w-full h-full bg-muted flex items-center justify-center">
            <GlitchTextReveal>No image</GlitchTextReveal>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center p-4">
        {title && (
          <h3 className="text-lg font-semibold mb-2">
            <GlitchTextReveal>{title}</GlitchTextReveal>
          </h3>
        )}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            <GlitchTextReveal>{description}</GlitchTextReveal>
          </p>
        )}
      </div>
    </Link>
  )
}
