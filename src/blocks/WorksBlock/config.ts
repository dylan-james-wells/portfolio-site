import type { Block } from 'payload'

export const WorksBlock: Block = {
  slug: 'worksBlock',
  interfaceName: 'WorksBlockType',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
    },
    {
      name: 'works',
      type: 'relationship',
      relationTo: 'works',
      hasMany: true,
      label: 'Works',
      admin: {
        description: 'Select the works to display',
      },
    },
  ],
  labels: {
    plural: 'Works Blocks',
    singular: 'Works Block',
  },
}
