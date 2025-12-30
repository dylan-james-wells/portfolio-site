import * as THREE from 'three'

// Grid settings
export const GRID_SIZE = 30
export const CUBE_SIZE = 1
export const GAP = 0.01

// Drag interaction settings
export const DRAG_THRESHOLD = 150 // pixels to drag before committing to advance

// Animation settings
export const ANIMATION_SPEED = 1.5
export const RENDER_TARGET_SIZE = 1024

// Scroll zoom settings
export const BACKGROUND_ZOOM_IN = 0.5 // How much the background zooms in (0.5 = 50% larger)
export const TEXT_ZOOM_OUT = 0.5 // How much the text zooms out (0.5 = 50% smaller)

// Ripple wave settings
export const SPREAD_DROPOFF = 0.85 // Probability multiplier per step (higher = spreads further)
export const WAVE_SPEED = 30 // Tiles per second for the wave front
export const COLOR_FADE_DURATION = 0.5 // Seconds for color to fade out
export const WAVE_WIDTH = 4.0 // Width of the glowing wave front
export const COLOR_INTENSITY = 0.3 // Max emissive intensity (0-1, higher = brighter colors)

// Bright color palette for ripple effect
export const RIPPLE_COLORS = [
  new THREE.Color(0xff0055), // hot pink
  new THREE.Color(0x00ff88), // neon green
  new THREE.Color(0xff3300), // orange-red
  new THREE.Color(0x00ffff), // cyan
  new THREE.Color(0xff00ff), // magenta
  new THREE.Color(0xffff00), // yellow
  new THREE.Color(0x0088ff), // electric blue
  new THREE.Color(0xff0000), // red
  new THREE.Color(0x00ff00), // green
  new THREE.Color(0xff8800), // orange
]
