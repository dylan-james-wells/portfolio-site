'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const GRID_SIZE = 50
const CUBE_SIZE = 1
const GAP = 0.05

// Animation settings
const FLIP_DURATION = 0.5 // seconds for one cube to complete its flip
const WAVE_DELAY = 0.02 // seconds delay between each diagonal wave

const IMAGE_URLS = [
  'https://images.pexels.com/photos/38136/pexels-photo-38136.jpeg',
  'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg',
]

// Easing function for smooth animation
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

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

    // Store cube data with animation state
    interface CubeData {
      mesh: THREE.Mesh
      row: number
      col: number
      baseZ: number
      currentRotation: number // 0 = showing front (texture1), Math.PI = showing back (texture2)
    }
    const cubeDataList: CubeData[] = []

    // Create a group to hold all cubes for easier rotation
    const cubeGroup = new THREE.Group()
    scene.add(cubeGroup)

    // Animation state
    let animationStartTime: number | null = null
    let isAnimating = false
    let showingFirstImage = true // Track which image is currently showing

    // Start the wave animation
    const startWaveAnimation = () => {
      if (isAnimating) return
      isAnimating = true
      animationStartTime = performance.now() / 1000
      showingFirstImage = !showingFirstImage
    }

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

      // Create the grid of cubes
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

          // All 4 horizontal faces (front, back, left, right) should show same UV coords
          // Pattern: Front(A) -> Right(B) -> Back(A) -> Left(B)
          // This way rotating 90 degrees always alternates between A and B

          for (let face = 0; face < 6; face++) {
            const baseIndex = face * 8

            // All faces get the same UV mapping for this grid position
            uvArray[baseIndex + 0] = uMin
            uvArray[baseIndex + 1] = vMax
            uvArray[baseIndex + 2] = uMax
            uvArray[baseIndex + 3] = vMax
            uvArray[baseIndex + 4] = uMin
            uvArray[baseIndex + 5] = vMin
            uvArray[baseIndex + 6] = uMax
            uvArray[baseIndex + 7] = vMin
          }

          uvAttribute.needsUpdate = true

          // Create materials for each face
          // Pattern: A, B, A, B around the cube horizontally
          // Face order: +X, -X, +Y, -Y, +Z, -Z
          // +Z (front) = A, +X (right) = B, -Z (back) = A, -X (left) = B
          const faceMaterials = [
            new THREE.MeshStandardMaterial({ map: texture2 }), // +X (right) = B
            new THREE.MeshStandardMaterial({ map: texture2 }), // -X (left) = B
            new THREE.MeshStandardMaterial({ map: texture1 }), // +Y (top) = A
            new THREE.MeshStandardMaterial({ map: texture1 }), // -Y (bottom) = A
            new THREE.MeshStandardMaterial({ map: texture1 }), // +Z (front) = A
            new THREE.MeshStandardMaterial({ map: texture1 }), // -Z (back) = A
          ]
          materials.push(...faceMaterials)

          const cube = new THREE.Mesh(geometry, faceMaterials)

          // Position cube in grid
          const x = col * (CUBE_SIZE + GAP)
          const y = row * (CUBE_SIZE + GAP)
          cube.position.set(x, y, 0)

          cubeGroup.add(cube)

          // Store cube data for animation
          cubeDataList.push({
            mesh: cube,
            row,
            col,
            baseZ: 0,
            currentRotation: 0,
          })
        }
      }

      // Center the group - offset by half the grid extent
      const centerOffset = gridExtent / 2
      cubeGroup.position.set(-centerOffset + CUBE_SIZE / 2, -centerOffset + CUBE_SIZE / 2, 0)

      // Start the first animation after a short delay
      setTimeout(() => {
        startWaveAnimation()
      }, 1000)
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

    // Animation loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const currentTime = performance.now() / 1000

      // Update cube animations
      if (isAnimating && animationStartTime !== null) {
        const elapsed = currentTime - animationStartTime
        let allComplete = true

        for (const cubeData of cubeDataList) {
          // Calculate diagonal distance from top-left (row 0 is bottom, so we flip)
          // Top-left in visual terms is col=0, row=GRID_SIZE-1
          const flippedRow = GRID_SIZE - 1 - cubeData.row
          const diagonalIndex = cubeData.col + flippedRow

          // Calculate when this cube should start animating
          const cubeStartTime = diagonalIndex * WAVE_DELAY
          const cubeElapsed = elapsed - cubeStartTime

          if (cubeElapsed < 0) {
            // This cube hasn't started yet
            allComplete = false
            continue
          }

          if (cubeElapsed >= FLIP_DURATION) {
            // This cube's animation is complete
            // 90 degrees = PI/2 for horizontal flip showing -X face
            const targetRotation = showingFirstImage ? 0 : Math.PI / 2
            cubeData.mesh.rotation.y = targetRotation
            cubeData.mesh.position.z = cubeData.baseZ
            cubeData.currentRotation = targetRotation
          } else {
            // Cube is currently animating
            allComplete = false
            const progress = cubeElapsed / FLIP_DURATION
            const easedProgress = easeInOutCubic(progress)

            // Calculate rotation (0 to PI/2 or PI/2 to 0) - horizontal flip
            const startRotation = showingFirstImage ? Math.PI / 2 : 0
            const endRotation = showingFirstImage ? 0 : Math.PI / 2
            const rotation = startRotation + (endRotation - startRotation) * easedProgress

            // Calculate Z position (move forward then back)
            // Peak at progress = 0.5
            const zOffset = Math.sin(progress * Math.PI) * CUBE_SIZE

            cubeData.mesh.rotation.y = rotation
            cubeData.mesh.position.z = cubeData.baseZ + zOffset
          }
        }

        // Check if all cubes have finished animating
        if (allComplete && elapsed > (GRID_SIZE * 2 - 1) * WAVE_DELAY + FLIP_DURATION) {
          isAnimating = false
          animationStartTime = null

          // Start next animation after a delay
          setTimeout(() => {
            startWaveAnimation()
          }, 2000)
        }
      }

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
