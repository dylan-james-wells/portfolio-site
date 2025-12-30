import * as THREE from 'three'
import type { Scene3D } from './types'

export interface WaveDotsOptions {
  colorStart?: number
  colorEnd?: number
  backgroundColor?: number
  bpm?: number
  gridWidth?: number
  gridLength?: number
  pointSize?: number
}

export function create(options: WaveDotsOptions = {}): Scene3D {
  const {
    colorStart = 0xff6b6b,
    colorEnd = 0x4ecdc4,
    backgroundColor = 0x1a1a2e,
    bpm = 128,
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

  // Animation state
  let elapsedTime = 0
  const beatInterval = 60 / bpm // seconds per beat
  const basePositions = positions.slice() // Store original positions

  return {
    scene,
    camera,
    update: (deltaTime: number) => {
      elapsedTime += deltaTime

      const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute
      const posArray = positionAttribute.array as Float32Array

      // Calculate beat phase (0-1 within each beat)
      const beatPhase = (elapsedTime % beatInterval) / beatInterval

      // Sharp attack, exponential decay for house beat feel
      const beatIntensity = Math.exp(-beatPhase * 6) * 0.8

      // Sub-bass pulse (every 2 beats for that four-on-the-floor feel)
      const subBeatPhase = (elapsedTime % (beatInterval * 2)) / (beatInterval * 2)
      const subBassIntensity = Math.exp(-subBeatPhase * 4) * 0.3

      // Hi-hat pattern (off-beats)
      const hiHatPhase = ((elapsedTime + beatInterval * 0.5) % beatInterval) / beatInterval
      const hiHatIntensity = Math.exp(-hiHatPhase * 8) * 0.15

      let k = 0
      for (let i = 0; i < gridWidth; i++) {
        for (let j = 0; j < gridLength; j++) {
          const u = i / gridWidth
          const v = j / gridLength

          const baseX = basePositions[3 * k]
          const baseZ = basePositions[3 * k + 2]

          // Distance from center for radial waves
          const distFromCenter = Math.sqrt((u - 0.5) ** 2 + (v - 0.5) ** 2)

          // Multiple wave layers
          // Main kick wave - radiates from center
          const kickWave =
            Math.sin(distFromCenter * 20 - elapsedTime * 8) * beatIntensity * (1 - distFromCenter)

          // Sub-bass wave - slower, bigger movement
          const subWave =
            Math.sin(u * Math.PI * 2 + elapsedTime * 4) * subBassIntensity +
            Math.sin(v * Math.PI * 3 + elapsedTime * 3) * subBassIntensity

          // Hi-hat ripples - high frequency, travels across
          const hiHatWave = Math.sin(u * 40 - elapsedTime * 20) * hiHatIntensity * (1 - u)

          // Combine waves
          const y = kickWave + subWave + hiHatWave

          posArray[3 * k] = baseX
          posArray[3 * k + 1] = y
          posArray[3 * k + 2] = baseZ

          k++
        }
      }

      positionAttribute.needsUpdate = true

      // Subtle camera movement synced to beat
      camera.position.y = 2 + beatIntensity * 0.1
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    },
  }
}
