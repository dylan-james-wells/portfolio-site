import React from 'react'

import type { Work } from '@/payload-types'

import { HeroSingle } from '@/components/HeroSingle'

export const WorkHero: React.FC<{
  work: Work
}> = ({ work }) => {
  const { heroImage, title, thumbnail } = work

  return (
    <HeroSingle
      title={title}
      heroImage={heroImage}
      thumbnail={thumbnail}
      height="40vh"
    />
  )
}
