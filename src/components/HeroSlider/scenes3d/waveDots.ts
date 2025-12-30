import * as THREE from 'three'
import type { Scene3D } from './types'

export interface WaveDotsOptions {
  colorStart?: number
  colorEnd?: number
  backgroundColor?: number
  gridWidth?: number
  gridLength?: number
  pointSize?: number
}

export function create(options: WaveDotsOptions = {}): Scene3D {
  const {
    colorStart = 0xff6b6b,
    colorEnd = 0x4ecdc4,
    backgroundColor = 0x1a1a2e,
    gridWidth = 80,
    gridLength = 80,
    pointSize = 0.03,
  } = options

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(backgroundColor)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 2, 3)
  camera.lookAt(0, 0, 0)

  // Create point cloud geometry
  const numPoints = gridWidth * gridLength
  const positions = new Float32Array(numPoints * 3)
  const colors = new Float32Array(numPoints * 3)

  const startColor = new THREE.Color(colorStart)
  const endColor = new THREE.Color(colorEnd)

  // Initialize positions and colors
  let k = 0
  for (let i = 0; i < gridWidth; i++) {
    for (let j = 0; j < gridLength; j++) {
      const u = i / gridWidth
      const v = j / gridLength
      const x = (u - 0.5) * 4
      const z = (v - 0.5) * 4
      const y = 0

      positions[3 * k] = x
      positions[3 * k + 1] = y
      positions[3 * k + 2] = z

      // Gradient from start to end color based on position
      const gradientT = u
      const color = new THREE.Color().lerpColors(startColor, endColor, gradientT)
      colors[3 * k] = color.r
      colors[3 * k + 1] = color.g
      colors[3 * k + 2] = color.b

      k++
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: pointSize,
    vertexColors: true,
    sizeAttenuation: true,
  })

  const points = new THREE.Points(geometry, material)
  scene.add(points)

  // Mouse interaction state
  let mouseX = 0
  let mouseY = 0
  let targetMouseX = 0
  let targetMouseY = 0
  let isDragging = false
  let dragVelocityX = 0
  let dragVelocityY = 0
  let lastDragX = 0
  let lastDragY = 0

  const basePositions = positions.slice()

  // Mouse event handlers
  const handleMouseMove = (event: MouseEvent) => {
    // Normalize to -1 to 1
    targetMouseX = (event.clientX / window.innerWidth) * 2 - 1
    targetMouseY = -((event.clientY / window.innerHeight) * 2 - 1)

    if (isDragging) {
      dragVelocityX = targetMouseX - lastDragX
      dragVelocityY = targetMouseY - lastDragY
      lastDragX = targetMouseX
      lastDragY = targetMouseY
    }
  }

  const handleMouseDown = (event: MouseEvent) => {
    isDragging = true
    lastDragX = (event.clientX / window.innerWidth) * 2 - 1
    lastDragY = -((event.clientY / window.innerHeight) * 2 - 1)
    dragVelocityX = 0
    dragVelocityY = 0
  }

  const handleMouseUp = () => {
    isDragging = false
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('mouseup', handleMouseUp)

  // Animation state
  let elapsedTime = 0

  return {
    scene,
    camera,
    update: (deltaTime: number) => {
      elapsedTime += deltaTime

      // Smooth mouse following
      mouseX += (targetMouseX - mouseX) * 0.1
      mouseY += (targetMouseY - mouseY) * 0.1

      // Decay drag velocity
      dragVelocityX *= 0.95
      dragVelocityY *= 0.95

      const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute
      const posArray = positionAttribute.array as Float32Array

      // Calculate intensity based on drag velocity
      const dragIntensity = Math.sqrt(dragVelocityX ** 2 + dragVelocityY ** 2) * 10

      let k = 0
      for (let i = 0; i < gridWidth; i++) {
        for (let j = 0; j < gridLength; j++) {
          const u = i / gridWidth
          const v = j / gridLength

          const baseX = basePositions[3 * k]
          const baseZ = basePositions[3 * k + 2]

          // Distance from mouse position (mapped to grid space)
          const gridMouseX = mouseX * 2
          const gridMouseY = mouseY * 2
          const dx = (u - 0.5) * 4 - gridMouseX
          const dz = (v - 0.5) * 4 - gridMouseY
          const distFromMouse = Math.sqrt(dx * dx + dz * dz)

          // Wave that follows mouse - ripples outward from cursor
          const mouseWave = Math.sin(distFromMouse * 4 - elapsedTime * 3) * Math.exp(-distFromMouse * 0.5) * 0.3

          // Drag-induced wave - intensity based on drag speed
          const dragWave = Math.sin(distFromMouse * 6 - elapsedTime * 8) * Math.exp(-distFromMouse * 0.3) * dragIntensity

          // Push effect - points near mouse get pushed down when dragging
          const pushEffect = isDragging ? Math.exp(-distFromMouse * 2) * -0.2 : 0

          // Combine effects
          const y = mouseWave + dragWave + pushEffect

          posArray[3 * k] = baseX
          posArray[3 * k + 1] = y
          posArray[3 * k + 2] = baseZ

          k++
        }
      }

      positionAttribute.needsUpdate = true

      // Camera follows mouse subtly
      camera.position.x = mouseX * 0.3
      camera.position.z = 3 + mouseY * 0.2
      camera.lookAt(0, 0, 0)
    },
    dispose: () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      geometry.dispose()
      material.dispose()
    },
  }
}
