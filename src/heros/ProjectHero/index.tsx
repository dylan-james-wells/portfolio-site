import React from 'react'

import type { Project } from '@/payload-types'

import { HeroSingle } from '@/components/HeroSingle'

export const ProjectHero: React.FC<{
  project: Project
}> = ({ project }) => {
  const { heroImage, title, thumbnail } = project

  return (
    <HeroSingle
      title={title}
      heroImage={heroImage}
      thumbnail={thumbnail}
      height="80vh"
    />
  )
}
