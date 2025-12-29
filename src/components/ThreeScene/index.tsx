'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const GRID_SIZE = 50
const CUBE_SIZE = 1
const GAP = 0.01

// Animation settings
const FLIP_DURATION = 0.5 // seconds for one cube to complete its flip
const WAVE_DELAY = 0.02 // seconds delay between each diagonal wave

const IMAGE_URLS = [
  'https://images.pexels.com/photos/38136/pexels-photo-38136.jpeg',
  'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg',
  'https://images.pexels.com/photos/1632790/pexels-photo-1632790.jpeg',
  'https://images.pexels.com/photos/33109/fall-autumn-red-season.jpg',
  'https://images.pexels.com/photos/167698/pexels-photo-167698.jpeg',
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
    const imageCount = IMAGE_URLS.length

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    // Camera setup - use OrthographicCamera with "cover" behavior
    const aspect = container.clientWidth / container.clientHeight
    const gridExtent = (GRID_SIZE - 1) * (CUBE_SIZE + GAP) + CUBE_SIZE

    // Calculate frustum to achieve "cover" effect (grid fills viewport, may be cropped)
    const calculateCoverFrustum = (viewportAspect: number) => {
      const gridAspect = 1
      let frustumWidth: number
      let frustumHeight: number

      if (viewportAspect > gridAspect) {
        frustumWidth = gridExtent / 2
        frustumHeight = frustumWidth / viewportAspect
      } else {
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
      faceMaterials: THREE.MeshStandardMaterial[] // Store materials for updating textures
    }
    const cubeDataList: CubeData[] = []

    // Create a group to hold all cubes
    const cubeGroup = new THREE.Group()
    scene.add(cubeGroup)

    // Animation state
    let animationStartTime: number | null = null
    let isAnimating = false
    let currentImageIndex = 0 // Which image is currently showing (front face)
    let nextImageIndex = 1 // Which image will be shown after flip

    // Start the wave animation
    const startWaveAnimation = () => {
      if (isAnimating) return
      isAnimating = true
      animationStartTime = performance.now() / 1000

      // Update materials to show next image on the side faces before animation
      const nextTexture = textures[nextImageIndex]
      for (const cubeData of cubeDataList) {
        // Update +X and -X faces (indices 0 and 1) to show the next image
        cubeData.faceMaterials[0].map = nextTexture
        cubeData.faceMaterials[1].map = nextTexture
        cubeData.faceMaterials[0].needsUpdate = true
        cubeData.faceMaterials[1].needsUpdate = true
      }
    }

    // Load all textures then create the grid
    Promise.all(
      IMAGE_URLS.map(
        (url) =>
          new Promise<THREE.Texture>((resolve) => {
            textureLoader.load(url, (texture) => {
              texture.colorSpace = THREE.SRGBColorSpace
              resolve(texture)
            })
          }),
      ),
    ).then((loadedTextures) => {
      textures.push(...loadedTextures)

      const initialTexture = textures[0]

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

          // All faces get the same UV mapping for this grid position
          for (let face = 0; face < 6; face++) {
            const baseIndex = face * 8
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
          // Face order: +X, -X, +Y, -Y, +Z, -Z
          // +X and -X will show the "next" image (updated before each animation)
          // +Z (front) shows current image
          // Start with all faces showing the initial image
          const faceMaterials = [
            new THREE.MeshStandardMaterial({ map: initialTexture }), // +X (right) - will be updated
            new THREE.MeshStandardMaterial({ map: initialTexture }), // -X (left) - will be updated
            new THREE.MeshStandardMaterial({ map: initialTexture }), // +Y (top)
            new THREE.MeshStandardMaterial({ map: initialTexture }), // -Y (bottom)
            new THREE.MeshStandardMaterial({ map: initialTexture }), // +Z (front) - current
            new THREE.MeshStandardMaterial({ map: initialTexture }), // -Z (back)
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
            faceMaterials,
          })
        }
      }

      // Center the group
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
          // Calculate diagonal distance from top-left
          const flippedRow = GRID_SIZE - 1 - cubeData.row
          const diagonalIndex = cubeData.col + flippedRow

          // Calculate when this cube should start animating
          const cubeStartTime = diagonalIndex * WAVE_DELAY
          const cubeElapsed = elapsed - cubeStartTime

          if (cubeElapsed < 0) {
            allComplete = false
            continue
          }

          if (cubeElapsed >= FLIP_DURATION) {
            // Animation complete - snap to 90 degrees
            cubeData.mesh.rotation.y = Math.PI / 2
            cubeData.mesh.position.z = cubeData.baseZ
          } else {
            // Currently animating
            allComplete = false
            const progress = cubeElapsed / FLIP_DURATION
            const easedProgress = easeInOutCubic(progress)

            // Rotate from 0 to PI/2
            cubeData.mesh.rotation.y = easedProgress * (Math.PI / 2)

            // Z offset for pop-out effect
            const zOffset = Math.sin(progress * Math.PI) * CUBE_SIZE
            cubeData.mesh.position.z = cubeData.baseZ + zOffset
          }
        }

        // Check if all cubes have finished animating
        if (allComplete && elapsed > (GRID_SIZE * 2 - 1) * WAVE_DELAY + FLIP_DURATION) {
          isAnimating = false
          animationStartTime = null

          // Update the current image index
          currentImageIndex = nextImageIndex
          nextImageIndex = (nextImageIndex + 1) % imageCount

          // Reset rotation and update front face to show new current image
          const currentTexture = textures[currentImageIndex]
          for (const cubeData of cubeDataList) {
            cubeData.mesh.rotation.y = 0

            // Update front face (+Z, index 4) to current image
            cubeData.faceMaterials[4].map = currentTexture
            cubeData.faceMaterials[4].needsUpdate = true

            // Also update back and top/bottom for consistency
            cubeData.faceMaterials[5].map = currentTexture
            cubeData.faceMaterials[2].map = currentTexture
            cubeData.faceMaterials[3].map = currentTexture
            cubeData.faceMaterials[5].needsUpdate = true
            cubeData.faceMaterials[2].needsUpdate = true
            cubeData.faceMaterials[3].needsUpdate = true
          }

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
