import type { Block } from 'payload'

import {
  defaultEditorFeatures,
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  UnorderedListFeature,
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
      // editor: lexicalEditor({
      //   features: [
      //     ...defaultEditorFeatures,
      //     HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }),
      //     LinkFeature({
      //       enabledCollections: ['pages', 'projects', 'works'],
      //     }),
      //     FixedToolbarFeature(),
      //     OrderedListFeature(),
      //     UnorderedListFeature(),
      //   ],
      // }),
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          OrderedListFeature(), // Make sure this is present
          UnorderedListFeature(),
        ],
      }),
    },
  ],
}
