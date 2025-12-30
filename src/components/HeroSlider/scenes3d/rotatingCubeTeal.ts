import * as THREE from 'three'
import type { Scene3D } from './types'

export const COLOR = 0x4ecdc4

export function create(): Scene3D {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.z = 5

  const geometry = new THREE.BoxGeometry(2, 2, 2)
  const material = new THREE.MeshStandardMaterial({
    color: COLOR,
    metalness: 0.3,
    roughness: 0.4,
  })
  const cube = new THREE.Mesh(geometry, material)
  scene.add(cube)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(5, 5, 5)
  scene.add(directionalLight)

  return {
    scene,
    camera,
    update: (deltaTime: number) => {
      cube.rotation.x += deltaTime * 0.5
      cube.rotation.y += deltaTime * 0.8
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    },
  }
}
