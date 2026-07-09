import * as THREE from 'three'
import type { Scene3D } from './types'

export interface WaveDotsOptions {
  colorStart?: number
  colorEnd?: number
  backgroundColor?: number
  gridWidth?: number
  gridLength?: number
  pointSize?: number
  /** Pointer-follow waves and drag/push effects. Disabled on mobile so touch
   *  scrolling/drags don't disturb the background. */
  interactive?: boolean
}

export function create(options: WaveDotsOptions = {}): Scene3D {
  const {
    colorStart = 0xff6b6b,
    colorEnd = 0x4ecdc4,
    backgroundColor = 0x1a1a2e,
    gridWidth = 120,
    gridLength = 120,
    pointSize = 0.04,
    interactive = true,
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

  // Wave displacement runs entirely in the vertex shader. The CPU previously
  // recomputed every point's height (sqrt/sin/exp x thousands of points) and
  // re-uploaded the position buffer each frame; the height is a pure function
  // of the point's base XZ plus a few scalars, so the GPU does it instead and
  // the position attribute stays static.
  type WaveUniforms = {
    uTime: { value: number }
    uPointer: { value: THREE.Vector2 }
    uDragIntensity: { value: number }
    uPush: { value: number }
  }
  let waveUniforms: WaveUniforms | null = null
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 }
    shader.uniforms.uPointer = { value: new THREE.Vector2(0, 0) }
    shader.uniforms.uDragIntensity = { value: 0 }
    shader.uniforms.uPush = { value: 0 }
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        [
          '#include <common>',
          'uniform float uTime;',
          'uniform vec2 uPointer;',
          'uniform float uDragIntensity;',
          'uniform float uPush;',
        ].join('\n'),
      )
      .replace(
        '#include <begin_vertex>',
        [
          '#include <begin_vertex>',
          '{',
          '  float distFromPointer = length(transformed.xz - uPointer);',
          '  // Wave that follows the pointer - ripples outward from it',
          '  float mouseWave = sin(distFromPointer * 4.0 - uTime * 3.0) * exp(-distFromPointer * 0.5) * 0.3;',
          '  // Drag-induced wave - intensity based on drag speed',
          '  float dragWave = sin(distFromPointer * 6.0 - uTime * 8.0) * exp(-distFromPointer * 0.3) * uDragIntensity;',
          '  // Push effect - points near the pointer get pushed down while dragging',
          '  float pushEffect = exp(-distFromPointer * 2.0) * uPush;',
          '  transformed.y = mouseWave + dragWave + pushEffect;',
          '}',
        ].join('\n'),
      )
    waveUniforms = shader.uniforms as unknown as WaveUniforms
  }

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

  if (interactive) {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)
  }

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

      // Calculate intensity based on drag velocity
      const dragIntensity = Math.sqrt(dragVelocityX ** 2 + dragVelocityY ** 2) * 10

      // Feed the wave parameters to the vertex shader (uniforms exist once
      // the material has compiled, i.e. after the first render)
      if (waveUniforms) {
        waveUniforms.uTime.value = elapsedTime
        // Pointer position mapped to grid space
        waveUniforms.uPointer.value.set((mouseX * spreadX) / 2, (mouseY * spreadZ) / 2)
        waveUniforms.uDragIntensity.value = dragIntensity
        waveUniforms.uPush.value = isDragging ? -0.2 : 0
      }

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
