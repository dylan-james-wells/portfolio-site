import type { GlobalConfig } from 'payload'

import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'resumeLinkText',
      type: 'text',
      label: 'Resume Link Text',
      defaultValue: 'Download Resume',
    },
    {
      name: 'resumeFile',
      type: 'upload',
      relationTo: 'media',
      label: 'Resume File',
    },
    {
      name: 'contactEmail',
      type: 'email',
      label: 'Contact Email',
    },
    {
      name: 'linkedinUrl',
      type: 'text',
      label: 'LinkedIn Profile URL',
    },
    {
      name: 'githubUrl',
      type: 'text',
      label: 'GitHub Profile URL',
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
