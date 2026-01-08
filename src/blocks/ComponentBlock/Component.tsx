'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { ComponentBlockType } from '@/payload-types'
import { cn } from '@/utilities/ui'

type Props = {
  className?: string
  blockIndex?: number
  blockName?: string
} & ComponentBlockType

// Dynamically import components that use Three.js/WebGL to avoid SSR issues
const SlideshowDemo = dynamic(
  () => import('@/components/SlideshowDemo').then((mod) => mod.SlideshowDemo),
  { ssr: false },
)

const componentMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'react-3d-slideshow': SlideshowDemo,
}

export const ComponentBlockComponent: React.FC<Props> = ({ className, component }) => {
  const Component = componentMap[component]

  if (!Component) {
    return null
  }

  return (
    <div className={cn('my-16', className)}>
      <Component />
    </div>
  )
}
