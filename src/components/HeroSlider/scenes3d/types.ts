import * as THREE from 'three'

export interface Scene3D {
  scene: THREE.Scene
  camera: THREE.Camera
  update: (deltaTime: number) => void
  dispose: () => void
  // Optional custom render function for post-processing effects
  render?: (renderer: THREE.WebGLRenderer, renderTarget: THREE.WebGLRenderTarget) => void
}

export interface Scene3DFactory {
  create: (color: number) => Scene3D
}
