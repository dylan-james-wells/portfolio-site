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
    gridWidth = 120,
    gridLength = 120,
    pointSize = 0.04,
  } = options

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(backgroundColor)

  // Adjusted camera to show larger area
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  camera.position.set(0, 3, 4)
  camera.lookAt(0, 0, 0)

  // Create point cloud geometry - larger spread with padding to hide corners
  const spreadX = 12
  const spreadZ = 12
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
      const x = (u - 0.5) * spreadX
      const z = (v - 0.5) * spreadZ
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

  // Interaction state
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

  const updateTarget = (clientX: number, clientY: number) => {
    targetMouseX = (clientX / window.innerWidth) * 2 - 1
    targetMouseY = -((clientY / window.innerHeight) * 2 - 1)

    if (isDragging) {
      dragVelocityX = targetMouseX - lastDragX
      dragVelocityY = targetMouseY - lastDragY
      lastDragX = targetMouseX
      lastDragY = targetMouseY
    }
  }

  const startDrag = (clientX: number, clientY: number) => {
    isDragging = true
    lastDragX = (clientX / window.innerWidth) * 2 - 1
    lastDragY = -((clientY / window.innerHeight) * 2 - 1)
    dragVelocityX = 0
    dragVelocityY = 0
  }

  const endDrag = () => {
    isDragging = false
  }

  // Mouse event handlers
  const handleMouseMove = (event: MouseEvent) => {
    updateTarget(event.clientX, event.clientY)
  }

  const handleMouseDown = (event: MouseEvent) => {
    startDrag(event.clientX, event.clientY)
  }

  const handleMouseUp = () => {
    endDrag()
  }

  // Touch event handlers
  const handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length > 0) {
      updateTarget(event.touches[0].clientX, event.touches[0].clientY)
    }
  }

  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length > 0) {
      startDrag(event.touches[0].clientX, event.touches[0].clientY)
    }
  }

  const handleTouchEnd = () => {
    endDrag()
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('touchmove', handleTouchMove, { passive: true })
  window.addEventListener('touchstart', handleTouchStart, { passive: true })
  window.addEventListener('touchend', handleTouchEnd)

  // Animation state
  let elapsedTime = 0

  return {
    scene,
    camera,
    update: (deltaTime: number) => {
      elapsedTime += deltaTime

      // Smooth following
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

          // Distance from pointer position (mapped to grid space)
          const gridMouseX = mouseX * spreadX / 2
          const gridMouseY = mouseY * spreadZ / 2
          const dx = (u - 0.5) * spreadX - gridMouseX
          const dz = (v - 0.5) * spreadZ - gridMouseY
          const distFromMouse = Math.sqrt(dx * dx + dz * dz)

          // Wave that follows pointer - ripples outward from cursor
          const mouseWave =
            Math.sin(distFromMouse * 4 - elapsedTime * 3) * Math.exp(-distFromMouse * 0.5) * 0.3

          // Drag-induced wave - intensity based on drag speed
          const dragWave =
            Math.sin(distFromMouse * 6 - elapsedTime * 8) *
            Math.exp(-distFromMouse * 0.3) *
            dragIntensity

          // Push effect - points near pointer get pushed down when dragging
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

      // Camera follows pointer subtly
      camera.position.x = mouseX * 0.3
      camera.position.z = 3 + mouseY * 0.2
      camera.lookAt(0, 0, 0)
    },
    dispose: () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      geometry.dispose()
      material.dispose()
    },
  }
}
