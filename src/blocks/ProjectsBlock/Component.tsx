import type { Project, ProjectsBlockType } from '@/payload-types'

import React from 'react'
import Link from 'next/link'

import { Media } from '@/components/Media'
import { GlitchTextReveal } from '@/components/GlitchTextReveal'

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
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  )
}

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const { slug, title, thumbnail, description } = project

  return (
    <Link href={`/projects/${slug}`} className="flex gap-6">
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
