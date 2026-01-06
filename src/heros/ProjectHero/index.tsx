import React from 'react'

import type { Project } from '@/payload-types'

import { HeroSingle } from '@/components/HeroSingle'

export const ProjectHero: React.FC<{
  project: Project
}> = ({ project }) => {
  const { heroImage, title } = project

  return (
    <HeroSingle
      title={title}
      heroImage={heroImage}
      height="40vh"
    />
  )
}
