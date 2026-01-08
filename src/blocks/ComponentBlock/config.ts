import type { Block } from 'payload'

export const ComponentBlock: Block = {
  slug: 'componentBlock',
  interfaceName: 'ComponentBlockType',
  labels: {
    plural: 'Component Blocks',
    singular: 'Component Block',
  },
  fields: [
    {
      name: 'component',
      type: 'select',
      required: true,
      options: [
        {
          label: 'React 3D Slideshow',
          value: 'react-3d-slideshow',
        },
      ],
      admin: {
        description: 'Select the component demo to display',
      },
    },
  ],
}
