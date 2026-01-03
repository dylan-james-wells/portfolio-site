import type { Block } from 'payload'

export const ImageGallery: Block = {
  slug: 'imageGallery',
  interfaceName: 'ImageGalleryBlock',
  labels: {
    plural: 'Image Galleries',
    singular: 'Image Gallery',
  },
  fields: [
    {
      name: 'images',
      type: 'array',
      label: 'Images',
      required: true,
      minRows: 1,
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          filterOptions: {
            mimeType: { contains: 'image' },
          },
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Caption',
        },
      ],
    },
    {
      name: 'layout',
      type: 'group',
      label: 'Layout Settings',
      fields: [
        {
          name: 'small',
          type: 'select',
          label: 'Small Screens (Mobile)',
          defaultValue: 'list',
          options: [
            { label: 'Row', value: 'row' },
            { label: 'Grid', value: 'grid' },
            { label: 'List', value: 'list' },
          ],
        },
        {
          name: 'medium',
          type: 'select',
          label: 'Medium Screens (Tablet)',
          defaultValue: 'grid',
          options: [
            { label: 'Row', value: 'row' },
            { label: 'Grid', value: 'grid' },
            { label: 'List', value: 'list' },
          ],
        },
        {
          name: 'large',
          type: 'select',
          label: 'Large Screens (Desktop)',
          defaultValue: 'grid',
          options: [
            { label: 'Row', value: 'row' },
            { label: 'Grid', value: 'grid' },
            { label: 'List', value: 'list' },
          ],
        },
        {
          name: 'gridColumns',
          type: 'select',
          label: 'Grid Columns (when Grid layout is selected)',
          defaultValue: '3',
          options: [
            { label: '2 Columns', value: '2' },
            { label: '3 Columns', value: '3' },
            { label: '4 Columns', value: '4' },
          ],
        },
      ],
    },
  ],
}
