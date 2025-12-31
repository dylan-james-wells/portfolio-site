import { GRID_SIZE, CUBE_SIZE, GAP } from './constants'

// Grid extent calculation
export const GRID_EXTENT = (GRID_SIZE - 1) * (CUBE_SIZE + GAP) + CUBE_SIZE

// Easing function for smooth animation
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Calculate frustum to achieve "cover" effect (grid fills viewport, may be cropped)
export const calculateCoverFrustum = (viewportAspect: number) => {
  const gridAspect = 1
  let frustumWidth: number
  let frustumHeight: number

  if (viewportAspect > gridAspect) {
    frustumWidth = GRID_EXTENT / 2
    frustumHeight = frustumWidth / viewportAspect
  } else {
    frustumHeight = GRID_EXTENT / 2
    frustumWidth = frustumHeight * viewportAspect
  }

  return { frustumWidth, frustumHeight }
}
