'use client'

import type { Project, ProjectsBlockType } from '@/payload-types'

import React, { useState } from 'react'
import Link from 'next/link'

import { Media } from '@/components/Media'
import { GlitchTextReveal } from '@/components/GlitchTextReveal'
import { ImageGlitchPan } from '@/components/ImageGlitchPan'
import { WindowReveal } from '@/components/WindowReveal'
import { TextOutline } from '@/components/TextOutline'

export const ProjectsBlock: React.FC<
  ProjectsBlockType & {
    id?: string
  }
> = (props) => {
  const { id, title, description, projects: selectedProjects } = props

  // Filter out any non-object entries (in case they're just IDs)
  const projects = (selectedProjects || []).filter(
    (project): project is Project => typeof project === 'object' && project !== null,
  )

  return (
    <div className="my-16" id={`block-${id}`}>
      <div className="container">
        {(title || description) && (
          <TextOutline className="inline-block">
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
        <div className="flex flex-col gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  )
}

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const { slug, title, thumbnail, heroImage, description } = project
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={`/projects/${slug}`}
      className="group flex items-center md:gap-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <WindowReveal>
        <div className="aspect-square relative overflow-hidden rounded-lg w-[120px] md:w-[200px]">
          {/* Hero image as background */}
          {heroImage && typeof heroImage !== 'string' && (
            <ImageGlitchPan resource={heroImage} alt="Project screenshot" className="h-full" />
          )}
          {/* Thumbnail image on top */}
          {thumbnail && typeof thumbnail !== 'string' ? (
            <Media
              resource={thumbnail}
              className="absolute top-0 left-0 z-10 w-full h-full group-hover:scale-105 group-hover:blur-sm transition-all duration-300"
              imgClassName="w-full h-full object-contain p-[10%]"
            />
          ) : (
            <div className="relative z-10 w-full h-full bg-muted flex items-center justify-center">
              <GlitchTextReveal>No image</GlitchTextReveal>
            </div>
          )}
        </div>
      </WindowReveal>

      <div className="p-4">
        <TextOutline className="flex flex-col top-[-8px] md:top-0 justify-center pb-1">
          {title && (
            <h3 className="text-xl font-semibold p-4 pb-0">
              <GlitchTextReveal active={isHovered}>{title}</GlitchTextReveal>
            </h3>
          )}
          {description && (
            <p className="line-clamp-3 p-4 text-[0px] md:text-base">
              <GlitchTextReveal>{description}</GlitchTextReveal>
            </p>
          )}
        </TextOutline>
      </div>
    </Link>
  )
}
