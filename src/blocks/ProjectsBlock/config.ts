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
      name: 'projects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
      label: 'Projects',
      admin: {
        description: 'Select the projects to display',
      },
    },
  ],
  labels: {
    plural: 'Projects Blocks',
    singular: 'Projects Block',
  },
}
