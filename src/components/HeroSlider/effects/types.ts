import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'

export interface Effect {
  // Called each frame to update effect state
  update: (deltaTime: number) => void
  // Called to trigger the effect
  trigger: (intensity?: number) => void
  // Called to stop the effect
  stop: () => void
  // Dispose of resources
  dispose: () => void
}

export interface EffectContext {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.Camera
  composer: EffectComposer
}
