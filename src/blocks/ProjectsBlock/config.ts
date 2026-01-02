import type { Block } from 'payload'

export const ProjectsBlock: Block = {
  slug: 'projectsBlock',
  interfaceName: 'ProjectsBlockType',
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
      name: 'limit',
      type: 'number',
      label: 'Number of Projects',
      defaultValue: 6,
      admin: {
        step: 1,
        description: 'Maximum number of projects to display',
      },
    },
  ],
  labels: {
    plural: 'Projects Blocks',
    singular: 'Projects Block',
  },
}
