import * as THREE from 'three'
import type { Scene3D } from './scenes3d'

// Tilt-shift settings per slide
export interface TiltShiftSettings {
  focusArea: number
  feather: number
  blur: number
}

// Quality options passed to 3D scene factories so they can scale down on mobile
export interface SceneQualityOptions {
  isMobile?: boolean
}

// Slide definitions - can be either an image URL or a 3D scene factory
export type SlideType =
  | { type: 'image'; url: string; tiltShift?: TiltShiftSettings }
  | { type: '3d'; createScene: (quality?: SceneQualityOptions) => Scene3D; tiltShift?: TiltShiftSettings }

// Grid material - Lambert on mobile (cheaper shading), Standard on desktop
export type GridMaterial = THREE.MeshStandardMaterial | THREE.MeshLambertMaterial

// Per-cube state for the instanced grid (transforms live in the instance
// matrices; this tracks grid position and ripple wave state)
export interface CubeState {
  row: number
  col: number
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
