import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const Biography: Block = {
  slug: 'biography',
  interfaceName: 'BiographyBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'body',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
      required: true,
    },
    {
      type: 'group',
      name: 'media',
      fields: [
        {
          name: 'posterImage',
          label: 'Poster Image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'videoFile',
          label: 'Video File',
          type: 'upload',
          relationTo: 'media',
          filterOptions: {
            mimeType: { contains: 'video' },
          },
        },
      ],
    },
    {
      name: 'alignment',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
      required: true,
    },
  ],
}
