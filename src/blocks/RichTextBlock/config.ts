import type { Block } from 'payload'

import { defaultEditorFeatures, lexicalEditor, HeadingFeature } from '@payloadcms/richtext-lexical'

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
        features: [...defaultEditorFeatures, HeadingFeature()],
      }),
    },
  ],
}
