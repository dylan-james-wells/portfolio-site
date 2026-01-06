import React from 'react'

import type { Work } from '@/payload-types'

import { HeroSingle } from '@/components/HeroSingle'

export const WorkHero: React.FC<{
  work: Work
}> = ({ work }) => {
  const { heroImage, title } = work

  return (
    <HeroSingle
      title={title}
      heroImage={heroImage}
      height="40vh"
    />
  )
}
