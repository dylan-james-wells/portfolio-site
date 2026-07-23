import type { Block } from 'payload'

export const TrivaiBand: Block = {
  slug: 'trivaiBand',
  interfaceName: 'TrivaiBandBlock',
  fields: [
    {
      name: 'hidden',
      type: 'checkbox',
      defaultValue: false,
      label: 'Hide this module',
      admin: { description: 'Hides the band on the site without deleting it from the page.' },
    },
    {
      name: 'buttonOrder',
      type: 'select',
      defaultValue: 'playFirst',
      options: [
        { label: 'Play first', value: 'playFirst' },
        { label: 'Synopsis first', value: 'synopsisFirst' },
      ],
    },
    {
      name: 'playButton',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', defaultValue: 'PLAY FREE' },
        { name: 'url', type: 'text', defaultValue: 'https://trivai.games' },
      ],
    },
    {
      name: 'synopsisButton',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', defaultValue: 'READ THE MAKING-OF' },
        { name: 'url', type: 'text', defaultValue: 'https://dylanjwells.com/writing/making-trivai' },
      ],
    },
  ],
  labels: {
    plural: 'trivai Bands',
    singular: 'trivai Band',
  },
}
