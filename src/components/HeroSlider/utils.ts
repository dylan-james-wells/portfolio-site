import { CUBE_SIZE, GAP } from './constants'

// Grid extent calculation
export const getGridExtent = (gridSize: number) => (gridSize - 1) * (CUBE_SIZE + GAP) + CUBE_SIZE

// Easing function for smooth animation
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Calculate frustum to achieve "cover" effect (grid fills viewport, may be cropped)
export const calculateCoverFrustum = (viewportAspect: number, gridSize: number) => {
  const gridExtent = getGridExtent(gridSize)
  const gridAspect = 1
  let frustumWidth: number
  let frustumHeight: number

  if (viewportAspect > gridAspect) {
    frustumWidth = gridExtent / 2
    frustumHeight = frustumWidth / viewportAspect
  } else {
    frustumHeight = gridExtent / 2
    frustumWidth = frustumHeight * viewportAspect
  }

  return { frustumWidth, frustumHeight }
}
