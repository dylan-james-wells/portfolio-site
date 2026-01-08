import React, { Fragment } from 'react'

import type { Page, Project, Work } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { BiographyBlock } from '@/blocks/Biography/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ComponentBlockComponent } from '@/blocks/ComponentBlock/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { ImageGalleryBlock } from '@/blocks/ImageGallery/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { ProjectsBlock } from '@/blocks/ProjectsBlock/Component'
import { RichTextBlockComponent } from '@/blocks/RichTextBlock/Component'
import { WorksBlock } from '@/blocks/WorksBlock/Component'
import { WorksGridBlock } from '@/blocks/WorksGridBlock/Component'

const blockComponents = {
  archive: ArchiveBlock,
  biography: BiographyBlock,
  componentBlock: ComponentBlockComponent,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  imageGallery: ImageGalleryBlock,
  mediaBlock: MediaBlock,
  projectsBlock: ProjectsBlock,
  richTextBlock: RichTextBlockComponent,
  worksBlock: WorksBlock,
  worksGridBlock: WorksGridBlock,
}

// Map block types to their display names for ID generation
const blockTypeNames: Record<string, string> = {
  biography: 'Biography',
  worksGridBlock: 'WorksGrid',
  worksBlock: 'Works',
  projectsBlock: 'Projects',
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][] | Project['layout'][0][] | Work['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    // Track instance counts for each block type
    const blockTypeCounts: Record<string, number> = {}

    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            // Calculate block index for this type
            const blockIndex = blockTypeCounts[blockType] ?? 0
            blockTypeCounts[blockType] = blockIndex + 1

            // Get display name for ID generation
            const blockName = blockTypeNames[blockType]

            if (Block) {
              return (
                <div className="relative z-1 block-nav-target" key={index}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} blockIndex={blockIndex} blockName={blockName} disableInnerContainer />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
