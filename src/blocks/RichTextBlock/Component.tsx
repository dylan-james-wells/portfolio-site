import React from 'react'
import RichText from '@/components/RichText'

import type { RichTextBlockType } from '@/payload-types'

export const RichTextBlockComponent: React.FC<RichTextBlockType> = ({ content }) => {
  if (!content) return null

  return (
    <div className="container my-16">
      <RichText data={content} enableGutter={false} />
    </div>
  )
}
