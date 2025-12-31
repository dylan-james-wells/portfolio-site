import React from 'react'

import type { HeroSliderBlock as HeroSliderBlockProps } from '@/payload-types'

import { HeroSlider } from '@/components/HeroSlider'

type Props = HeroSliderBlockProps & {
  className?: string
  disableInnerContainer?: boolean
}

export const HeroSliderBlock: React.FC<Props> = () => {
  return <HeroSlider />
}
