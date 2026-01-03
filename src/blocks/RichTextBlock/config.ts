import type { Block } from 'payload'

import {
  lexicalEditor,
  HeadingFeature,
  FixedToolbarFeature,
} from '@payloadcms/richtext-lexical'

export const RichTextBlock: Block = {
  slug: 'richTextBlock',
  interfaceName: 'RichTextBlockType',
  labels: {
    plural: 'Rich Text Blocks',
    singular: 'Rich Text',
  },
  fields: [
    {
      name: 'content',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }),
          FixedToolbarFeature(),
        ],
      }),
    },
  ],
}
