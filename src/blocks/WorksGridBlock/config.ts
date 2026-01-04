import type { Block } from 'payload'

export const WorksGridBlock: Block = {
  slug: 'worksGridBlock',
  interfaceName: 'WorksGridBlockType',
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
        description: 'Select the works to display in a 3-column grid',
      },
    },
  ],
  labels: {
    plural: 'Works Grid Blocks',
    singular: 'Works Grid Block',
  },
}
