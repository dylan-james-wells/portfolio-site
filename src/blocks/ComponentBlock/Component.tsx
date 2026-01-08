'use client'

import React from 'react'
import type { ComponentBlockType } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { SlideshowDemo } from '@/components/SlideshowDemo'

type Props = {
  className?: string
  blockIndex?: number
  blockName?: string
} & ComponentBlockType

const componentMap: Record<string, React.FC<{ className?: string }>> = {
  'react-3d-slideshow': SlideshowDemo,
}

export const ComponentBlockComponent: React.FC<Props> = ({
  className,
  component,
}) => {
  const Component = componentMap[component]

  if (!Component) {
    return null
  }

  return (
    <div className={cn('container py-16', className)}>
      <Component />
    </div>
  )
}
