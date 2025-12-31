import * as THREE from 'three'
import type { Scene3D } from './scenes3d'

// Tilt-shift settings per slide
export interface TiltShiftSettings {
  focusArea: number
  feather: number
  blur: number
}

// Slide definitions - can be either an image URL or a 3D scene factory
export type SlideType =
  | { type: 'image'; url: string; tiltShift?: TiltShiftSettings }
  | { type: '3d'; createScene: () => Scene3D; tiltShift?: TiltShiftSettings }

// Store cube data with animation state
export interface CubeData {
  mesh: THREE.Mesh
  row: number
  col: number
  baseZ: number
  faceMaterials: THREE.MeshStandardMaterial[]
  // Ripple effect state
  rippleColor: THREE.Color | null
  rippleIntensity: number
}

// Animated 3D slide
export interface AnimatedSlide {
  slideIndex: number
  renderTarget: THREE.WebGLRenderTarget
  scene3d: Scene3D
}

// Track active hybrid waves
export interface HybridWave {
  originRow: number
  originCol: number
  startTime: number
  affectedTiles: Map<string, { color: THREE.Color; activatedTime: number }>
  processedDistances: Set<number>
}

// Default tilt-shift settings
export const defaultTiltShift: TiltShiftSettings = {
  focusArea: 0.4,
  feather: 0.3,
  blur: 0.15,
}
