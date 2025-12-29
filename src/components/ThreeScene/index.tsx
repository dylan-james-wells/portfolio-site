'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const GRID_SIZE = 50
const CUBE_SIZE = 1
const GAP = 0.05

const IMAGE_URLS = [
  'https://images.pexels.com/photos/38136/pexels-photo-38136.jpeg',
  'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg',
]

export const ThreeScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    // Camera setup - use OrthographicCamera with "cover" behavior
    const aspect = container.clientWidth / container.clientHeight
    // Actual grid size: N cubes + (N-1) gaps, but we position cubes at col*(CUBE_SIZE+GAP)
    // So total extent from center of first to center of last cube is (GRID_SIZE-1)*(CUBE_SIZE+GAP)
    // Plus half a cube on each side = GRID_SIZE-1)*(CUBE_SIZE+GAP) + CUBE_SIZE
    const gridExtent = (GRID_SIZE - 1) * (CUBE_SIZE + GAP) + CUBE_SIZE

    // Calculate frustum to achieve "cover" effect (grid fills viewport, may be cropped)
    const calculateCoverFrustum = (viewportAspect: number) => {
      const gridAspect = 1 // Grid is square (GRID_SIZE x GRID_SIZE)
      let frustumWidth: number
      let frustumHeight: number

      if (viewportAspect > gridAspect) {
        // Viewport is wider than grid - fit to width, crop height
        frustumWidth = gridExtent / 2
        frustumHeight = frustumWidth / viewportAspect
      } else {
        // Viewport is taller than grid - fit to height, crop width
        frustumHeight = gridExtent / 2
        frustumWidth = frustumHeight * viewportAspect
      }

      return { frustumWidth, frustumHeight }
    }

    const { frustumWidth, frustumHeight } = calculateCoverFrustum(aspect)

    const camera = new THREE.OrthographicCamera(
      -frustumWidth,
      frustumWidth,
      frustumHeight,
      -frustumHeight,
      0.1,
      1000,
    )
    camera.position.set(0, 0, 100)
    camera.lookAt(0, 0, 0)

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)

    // Load textures
    const textureLoader = new THREE.TextureLoader()
    textureLoader.crossOrigin = 'anonymous'

    const textures: THREE.Texture[] = []
    const geometries: THREE.BufferGeometry[] = []
    const materials: THREE.Material[] = []
    const cubes: THREE.Mesh[] = []

    // Create a group to hold all cubes for easier rotation
    const cubeGroup = new THREE.Group()
    scene.add(cubeGroup)

    // Load both textures then create the grid
    Promise.all(
      IMAGE_URLS.map(
        (url) =>
          new Promise<THREE.Texture>((resolve) => {
            textureLoader.load(url, (texture) => {
              texture.colorSpace = THREE.SRGBColorSpace
              textures.push(texture)
              resolve(texture)
            })
          }),
      ),
    ).then((loadedTextures) => {
      const [texture1, texture2] = loadedTextures

      // Create the 100x100 grid of cubes
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          // Calculate UV offset for this cube's position in the grid
          const uMin = col / GRID_SIZE
          const uMax = (col + 1) / GRID_SIZE
          const vMin = row / GRID_SIZE
          const vMax = (row + 1) / GRID_SIZE

          // Create geometry with custom UVs for each face
          const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)
          geometries.push(geometry)

          // Get the UV attribute
          const uvAttribute = geometry.getAttribute('uv')
          const uvArray = uvAttribute.array as Float32Array

          // Box faces order: +X, -X, +Y, -Y, +Z, -Z
          // Each face has 4 vertices, each vertex has 2 UV coords = 8 floats per face
          // Total: 6 faces * 4 vertices * 2 coords = 48 floats

          // Update UVs for all faces to show the correct portion of the image
          for (let face = 0; face < 6; face++) {
            const baseIndex = face * 8

            // Vertex 0 (bottom-left of face)
            uvArray[baseIndex + 0] = uMin
            uvArray[baseIndex + 1] = vMax

            // Vertex 1 (bottom-right of face)
            uvArray[baseIndex + 2] = uMax
            uvArray[baseIndex + 3] = vMax

            // Vertex 2 (top-left of face)
            uvArray[baseIndex + 4] = uMin
            uvArray[baseIndex + 5] = vMin

            // Vertex 3 (top-right of face)
            uvArray[baseIndex + 6] = uMax
            uvArray[baseIndex + 7] = vMin
          }

          uvAttribute.needsUpdate = true

          // Create materials for each face - alternating between the two images
          const faceMaterials = [
            new THREE.MeshStandardMaterial({ map: texture1 }), // +X
            new THREE.MeshStandardMaterial({ map: texture2 }), // -X
            new THREE.MeshStandardMaterial({ map: texture1 }), // +Y
            new THREE.MeshStandardMaterial({ map: texture2 }), // -Y
            new THREE.MeshStandardMaterial({ map: texture1 }), // +Z (front)
            new THREE.MeshStandardMaterial({ map: texture2 }), // -Z (back)
          ]
          materials.push(...faceMaterials)

          const cube = new THREE.Mesh(geometry, faceMaterials)

          // Position cube in grid
          cube.position.set(col * (CUBE_SIZE + GAP), row * (CUBE_SIZE + GAP), 0)

          cubeGroup.add(cube)
          cubes.push(cube)
        }
      }

      // Center the group - offset by half the grid extent
      const centerOffset = gridExtent / 2
      cubeGroup.position.set(-centerOffset + CUBE_SIZE / 2, -centerOffset + CUBE_SIZE / 2, 0)
    })

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight.position.set(5, 5, 10)
    scene.add(directionalLight)

    // Handle resize
    const handleResize = () => {
      if (!container) return
      const width = container.clientWidth
      const height = container.clientHeight
      const newAspect = width / height

      const { frustumWidth: newFrustumWidth, frustumHeight: newFrustumHeight } =
        calculateCoverFrustum(newAspect)

      camera.left = -newFrustumWidth
      camera.right = newFrustumWidth
      camera.top = newFrustumHeight
      camera.bottom = -newFrustumHeight
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    // Animation loop - render without rotation to face viewer
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      container.removeChild(renderer.domElement)
      geometries.forEach((g) => g.dispose())
      materials.forEach((m) => m.dispose())
      textures.forEach((t) => t.dispose())
      renderer.dispose()
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
}
