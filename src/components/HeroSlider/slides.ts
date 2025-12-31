import { hypercube, waveDots } from './scenes3d'
import type { SlideType } from './types'

export const SLIDES: SlideType[] = [
  {
    type: '3d',
    createScene: () => hypercube.create({ colorInner: 0xff6b6b, colorOuter: 0x4ecdc4 }),
    tiltShift: { focusArea: 0.8, feather: 0.4, blur: 0.08 },
  },
  {
    type: '3d',
    createScene: () => hypercube.create({ colorInner: 0x4ecdc4, colorOuter: 0xff6b6b }),
    tiltShift: { focusArea: 0.8, feather: 0.4, blur: 0.08 },
  },
  {
    type: '3d',
    createScene: () => waveDots.create({ colorStart: 0xff6b6b, colorEnd: 0x4ecdc4 }),
    tiltShift: { focusArea: 0.4, feather: 0.3, blur: 0.15 },
  },
  {
    type: '3d',
    createScene: () => waveDots.create({ colorStart: 0x4ecdc4, colorEnd: 0xff6b6b }),
    tiltShift: { focusArea: 0.4, feather: 0.3, blur: 0.15 },
  },
]
