import * as THREE from 'three'
import type { Scene3D } from './types'

export interface HypercubeOptions {
  colorInner?: number
  colorOuter?: number
  backgroundColor?: number
  dashSize?: number
  gapSize?: number
  size?: number
}

// 4D hypercube (tesseract) vertices
function generateHypercubeVertices(size: number): number[][] {
  const s = size / 2
  const vertices: number[][] = []

  // All 16 vertices of a tesseract (4D hypercube)
  for (let i = 0; i < 16; i++) {
    vertices.push([
      (i & 1 ? s : -s),
      (i & 2 ? s : -s),
      (i & 4 ? s : -s),
      (i & 8 ? s : -s),
    ])
  }

  return vertices
}

// Generate edges connecting vertices that differ by exactly one coordinate
// Returns edges grouped by whether they connect inner cube (w=-), outer cube (w=+), or between
function generateHypercubeEdges(): { inner: [number, number][]; outer: [number, number][]; connecting: [number, number][] } {
  const inner: [number, number][] = []
  const outer: [number, number][] = []
  const connecting: [number, number][] = []

  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      const diff = i ^ j
      if (diff === 1 || diff === 2 || diff === 4 || diff === 8) {
        const iW = (i & 8) !== 0 // w coordinate of vertex i
        const jW = (j & 8) !== 0 // w coordinate of vertex j

        if (!iW && !jW) {
          inner.push([i, j]) // Both in inner cube (w = -s)
        } else if (iW && jW) {
          outer.push([i, j]) // Both in outer cube (w = +s)
        } else {
          connecting.push([i, j]) // Connects inner to outer
        }
      }
    }
  }

  return { inner, outer, connecting }
}

// Project 4D point to 3D using perspective projection
function project4Dto3D(point: number[], angle4D: number, distance: number): THREE.Vector3 {
  const [x, y, z, w] = point

  // Rotate in the XW plane (4D rotation)
  const cosA = Math.cos(angle4D)
  const sinA = Math.sin(angle4D)
  const xr = x * cosA - w * sinA
  const wr = x * sinA + w * cosA

  // Rotate in the YW plane
  const yr = y * cosA - wr * sinA
  const wr2 = y * sinA + wr * cosA

  // Rotate in the ZW plane
  const zr = z * cosA - wr2 * sinA
  const wr3 = z * sinA + wr2 * cosA

  // Perspective projection from 4D to 3D
  const scale = distance / (distance - wr3)

  return new THREE.Vector3(xr * scale, yr * scale, zr * scale)
}

function createLineSegments(
  edges: [number, number][],
  color: number,
  dashSize: number,
  gapSize: number,
  opacity: number = 0.9,
): { geometry: THREE.BufferGeometry; material: THREE.LineDashedMaterial; mesh: THREE.LineSegments } {
  const positions = new Float32Array(edges.length * 6)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.LineDashedMaterial({
    color,
    dashSize,
    gapSize,
    transparent: true,
    opacity,
  })

  const mesh = new THREE.LineSegments(geometry, material)

  return { geometry, material, mesh }
}

function updateLinePositions(
  geometry: THREE.BufferGeometry,
  edges: [number, number][],
  projected: THREE.Vector3[],
  mesh: THREE.LineSegments,
) {
  const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute
  const posArray = positionAttribute.array as Float32Array

  for (let i = 0; i < edges.length; i++) {
    const [a, b] = edges[i]
    const p1 = projected[a]
    const p2 = projected[b]

    posArray[i * 6 + 0] = p1.x
    posArray[i * 6 + 1] = p1.y
    posArray[i * 6 + 2] = p1.z
    posArray[i * 6 + 3] = p2.x
    posArray[i * 6 + 4] = p2.y
    posArray[i * 6 + 5] = p2.z
  }

  positionAttribute.needsUpdate = true
  mesh.computeLineDistances()
}

export function create(options: HypercubeOptions = {}): Scene3D {
  const {
    colorInner = 0xff6b6b,
    colorOuter = 0x4ecdc4,
    backgroundColor = 0x1a1a2e,
    dashSize = 0.15,
    gapSize = 0.05,
    size = 2,
  } = options

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(backgroundColor)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.z = 6

  // Generate hypercube structure
  const vertices4D = generateHypercubeVertices(size)
  const { inner, outer, connecting } = generateHypercubeEdges()

  // Create line segments for each group with different colors
  const innerLines = createLineSegments(inner, colorInner, dashSize, gapSize)
  const outerLines = createLineSegments(outer, colorOuter, dashSize, gapSize)

  // Connecting lines blend between colors - use a middle color
  const innerColor = new THREE.Color(colorInner)
  const outerColor = new THREE.Color(colorOuter)
  const midColor = new THREE.Color().lerpColors(innerColor, outerColor, 0.5)
  const connectingLines = createLineSegments(connecting, midColor.getHex(), dashSize, gapSize, 0.7)

  // Create glow effects
  const innerGlow = createLineSegments(inner, colorInner, dashSize, gapSize, 0.3)
  const outerGlow = createLineSegments(outer, colorOuter, dashSize, gapSize, 0.3)
  const connectingGlow = createLineSegments(connecting, midColor.getHex(), dashSize, gapSize, 0.2)

  innerGlow.mesh.scale.setScalar(1.02)
  outerGlow.mesh.scale.setScalar(1.02)
  connectingGlow.mesh.scale.setScalar(1.02)

  // Add all to scene
  const group = new THREE.Group()
  group.add(innerLines.mesh)
  group.add(outerLines.mesh)
  group.add(connectingLines.mesh)
  group.add(innerGlow.mesh)
  group.add(outerGlow.mesh)
  group.add(connectingGlow.mesh)
  scene.add(group)

  // Interaction state
  let mouseX = 0
  let mouseY = 0
  let targetMouseX = 0
  let targetMouseY = 0

  // Rotation state
  let baseRotation = 0
  let angle4D = 0

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
      mouseX += (targetMouseX - mouseX) * 0.022
      mouseY += (targetMouseY - mouseY) * 0.022

      // Update rotations
      baseRotation += deltaTime * 0.2
      angle4D += deltaTime * 0.3

      // Mouse influence on 4D rotation speed
      const mouseInfluence = 1 + Math.abs(mouseX) * 0.1

      // Project all vertices from 4D to 3D
      const projected: THREE.Vector3[] = vertices4D.map((v) =>
        project4Dto3D(v, angle4D * mouseInfluence, 4),
      )

      // Update all line positions
      updateLinePositions(innerLines.geometry, inner, projected, innerLines.mesh)
      updateLinePositions(outerLines.geometry, outer, projected, outerLines.mesh)
      updateLinePositions(connectingLines.geometry, connecting, projected, connectingLines.mesh)

      // Update glow geometries
      const innerPosArray = (innerLines.geometry.getAttribute('position') as THREE.BufferAttribute).array
      const outerPosArray = (outerLines.geometry.getAttribute('position') as THREE.BufferAttribute).array
      const connectingPosArray = (connectingLines.geometry.getAttribute('position') as THREE.BufferAttribute).array

      ;(innerGlow.geometry.getAttribute('position') as THREE.BufferAttribute).array.set(innerPosArray as Float32Array)
      ;(outerGlow.geometry.getAttribute('position') as THREE.BufferAttribute).array.set(outerPosArray as Float32Array)
      ;(connectingGlow.geometry.getAttribute('position') as THREE.BufferAttribute).array.set(connectingPosArray as Float32Array)

      ;(innerGlow.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
      ;(outerGlow.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
      ;(connectingGlow.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true

      innerGlow.mesh.computeLineDistances()
      outerGlow.mesh.computeLineDistances()
      connectingGlow.mesh.computeLineDistances()

      // 3D rotation influenced by mouse
      group.rotation.x = baseRotation + mouseY * Math.PI * 0.075
      group.rotation.y = baseRotation * 0.7 + mouseX * Math.PI * 0.115
    },
    dispose: () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      innerLines.geometry.dispose()
      innerLines.material.dispose()
      outerLines.geometry.dispose()
      outerLines.material.dispose()
      connectingLines.geometry.dispose()
      connectingLines.material.dispose()
      innerGlow.geometry.dispose()
      innerGlow.material.dispose()
      outerGlow.geometry.dispose()
      outerGlow.material.dispose()
      connectingGlow.geometry.dispose()
      connectingGlow.material.dispose()
    },
  }
}
