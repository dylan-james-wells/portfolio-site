import type { Project, ProjectsBlockType } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'

import { Media } from '@/components/Media'

export const ProjectsBlock: React.FC<
  ProjectsBlockType & {
    id?: string
  }
> = async (props) => {
  const { id, title, description, limit: limitFromProps } = props

  const limit = limitFromProps || 6

  const payload = await getPayload({ config: configPromise })

  const fetchedProjects = await payload.find({
    collection: 'projects',
    depth: 1,
    limit,
    sort: '-publishedAt',
  })

  const projects = fetchedProjects.docs

  return (
    <div className="my-16" id={`block-${id}`}>
      <div className="container">
        {(title || description) && (
          <div className="mb-12">
            {title && <h2 className="text-3xl font-bold mb-4">{title}</h2>}
            {description && <p className="text-lg text-muted-foreground">{description}</p>}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <Link
      href={`/projects/${slug}`}
      className="group block border border-border rounded-lg overflow-hidden bg-card hover:border-primary transition-colors"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        {thumbnail && typeof thumbnail !== 'string' ? (
          <Media
            resource={thumbnail}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>
      <div className="p-4">
        {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
        {description && (
          <p className="text-muted-foreground line-clamp-2">{description}</p>
        )}
      </div>
    </Link>
  )
}
