import * as THREE from 'three'
import type { Scene3D } from './types'

export interface RotatingCubeOptions {
  color: number
  backgroundColor?: number
}

export function create(options: RotatingCubeOptions): Scene3D {
  const { color, backgroundColor = 0x1a1a2e } = options

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(backgroundColor)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.z = 5

  const geometry = new THREE.BoxGeometry(2, 2, 2)
  const material = new THREE.MeshStandardMaterial({
    color,
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

  // Interaction state
  let mouseX = 0
  let mouseY = 0
  let targetMouseX = 0
  let targetMouseY = 0

  // Natural rotation state
  let baseRotationX = 0
  let baseRotationY = 0

  const updateTarget = (clientX: number, clientY: number) => {
    targetMouseX = (clientX / window.innerWidth) * 2 - 1
    targetMouseY = -((clientY / window.innerHeight) * 2 - 1)
  }

  const handleMouseMove = (event: MouseEvent) => {
    updateTarget(event.clientX, event.clientY)
  }

  const handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length > 0) {
      updateTarget(event.touches[0].clientX, event.touches[0].clientY)
    }
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('touchmove', handleTouchMove, { passive: true })

  return {
    scene,
    camera,
    update: (deltaTime: number) => {
      // Smooth following
      mouseX += (targetMouseX - mouseX) * 0.05
      mouseY += (targetMouseY - mouseY) * 0.05

      // Natural slow rotation
      baseRotationX += deltaTime * 0.1
      baseRotationY += deltaTime * 0.15

      // Mouse influence adds to natural rotation
      const mouseInfluenceX = mouseY * Math.PI * 0.3
      const mouseInfluenceY = mouseX * Math.PI * 0.5

      cube.rotation.x = baseRotationX + mouseInfluenceX
      cube.rotation.y = baseRotationY + mouseInfluenceY
    },
    dispose: () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      geometry.dispose()
      material.dispose()
    },
  }
}
