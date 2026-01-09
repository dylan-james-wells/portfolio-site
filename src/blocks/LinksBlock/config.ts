import type { Block } from 'payload'

export const LinksBlock: Block = {
  slug: 'linksBlock',
  interfaceName: 'LinksBlock',
  fields: [
    {
      name: 'links',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'icon',
          type: 'select',
          required: true,
          options: [
            { label: 'Laptop', value: 'laptop' },
            { label: 'Paperclip', value: 'paperclip' },
            { label: 'GitHub', value: 'github' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'Steam', value: 'steam' },
          ],
        },
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
