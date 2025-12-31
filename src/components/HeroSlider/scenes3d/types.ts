import * as THREE from 'three'

export interface Scene3D {
  scene: THREE.Scene
  camera: THREE.Camera
  update: (deltaTime: number) => void
  dispose: () => void
  // Optional custom render function for post-processing effects
  render?: (renderer: THREE.WebGLRenderer, renderTarget: THREE.WebGLRenderTarget) => void
  // Optional resize handler for responsive scenes
  resize?: (width: number, height: number, aspect: number) => void
  // Optional color scheme transition (0 = primary color scheme, 1 = secondary color scheme)
  setColorScheme?: (scheme: number) => void
}

export interface Scene3DFactory {
  create: (color: number) => Scene3D
}
