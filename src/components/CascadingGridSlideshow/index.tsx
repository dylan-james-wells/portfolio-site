'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const GRID_SIZE = 50
const CUBE_SIZE = 1
const GAP = 0.01

// Animation settings
const FLIP_DURATION = 0.5 // seconds for one cube to complete its flip
const WAVE_DELAY = 0.02 // seconds delay between each diagonal wave

// Drag interaction settings
const DRAG_THRESHOLD = 150 // pixels to drag before committing to advance
const MAX_DRAG_ROTATION = Math.PI / 2 // max rotation during drag (90 degrees)

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

export const CascadingGridSlideshow: React.FC = () => {
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
    let currentImageIndex = 0 // Which image is currently showing (front face)
    let animationDirection: 'forward' | 'backward' = 'forward'

    // Unified animation progress (0 = current image, 1 = next image fully shown)
    let animationProgress = 0
    let targetProgress = 0 // Where we're animating towards
    let isAutoAnimating = false // True when animation is running automatically (not dragged)
    let autoPlayTimeoutId: ReturnType<typeof setTimeout> | null = null

    // Drag state
    let isDragging = false
    let dragStartX = 0

    // Get the next image index based on direction
    const getNextImageIndex = (direction: 'forward' | 'backward') => {
      return direction === 'forward'
        ? (currentImageIndex + 1) % imageCount
        : (currentImageIndex - 1 + imageCount) % imageCount
    }

    // Update side face textures to show the target image
    const updateSideTextures = (direction: 'forward' | 'backward') => {
      const targetIndex = getNextImageIndex(direction)
      const targetTexture = textures[targetIndex]
      for (const cubeData of cubeDataList) {
        cubeData.faceMaterials[0].map = targetTexture
        cubeData.faceMaterials[1].map = targetTexture
        cubeData.faceMaterials[0].needsUpdate = true
        cubeData.faceMaterials[1].needsUpdate = true
      }
    }

    // Complete the transition - update current image and reset
    const completeTransition = () => {
      currentImageIndex = getNextImageIndex(animationDirection)
      animationProgress = 0
      targetProgress = 0

      // Update all face textures to show the new current image
      const currentTexture = textures[currentImageIndex]
      for (const cubeData of cubeDataList) {
        cubeData.mesh.rotation.y = 0
        cubeData.mesh.position.z = cubeData.baseZ
        cubeData.faceMaterials[4].map = currentTexture
        cubeData.faceMaterials[5].map = currentTexture
        cubeData.faceMaterials[2].map = currentTexture
        cubeData.faceMaterials[3].map = currentTexture
        cubeData.faceMaterials[4].needsUpdate = true
        cubeData.faceMaterials[5].needsUpdate = true
        cubeData.faceMaterials[2].needsUpdate = true
        cubeData.faceMaterials[3].needsUpdate = true
      }

      isAutoAnimating = false
      scheduleAutoPlay()
    }

    // Schedule auto-play
    const scheduleAutoPlay = () => {
      if (autoPlayTimeoutId) {
        clearTimeout(autoPlayTimeoutId)
      }
      autoPlayTimeoutId = setTimeout(() => {
        if (!isDragging && !isAutoAnimating && animationProgress === 0) {
          animationDirection = 'forward'
          updateSideTextures('forward')
          targetProgress = 1
          isAutoAnimating = true
        }
      }, 2000)
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
        animationDirection = 'forward'
        updateSideTextures('forward')
        targetProgress = 1
        isAutoAnimating = true
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

    // Drag handlers
    let lastDragDirection: 'forward' | 'backward' | null = null

    const handleMouseDown = (event: MouseEvent) => {
      // Don't allow dragging during auto-animation
      if (isAutoAnimating) return
      isDragging = true
      dragStartX = event.clientX
      lastDragDirection = null
      // Cancel auto-play while dragging
      if (autoPlayTimeoutId) {
        clearTimeout(autoPlayTimeoutId)
        autoPlayTimeoutId = null
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || isAutoAnimating) return
      const dragDeltaX = event.clientX - dragStartX
      const newDirection: 'forward' | 'backward' = dragDeltaX < 0 ? 'forward' : 'backward'

      // Update textures if direction changed
      if (newDirection !== lastDragDirection) {
        lastDragDirection = newDirection
        animationDirection = newDirection
        updateSideTextures(newDirection)
      }

      // Map drag distance to 0-0.5 progress (drag controls first half)
      const dragProgress = Math.min(Math.abs(dragDeltaX) / DRAG_THRESHOLD, 1) * 0.5
      animationProgress = dragProgress
      targetProgress = dragProgress
    }

    const handleMouseUp = () => {
      if (!isDragging) return
      isDragging = false

      if (animationProgress >= 0.5) {
        // Past threshold - complete the animation
        targetProgress = 1
        isAutoAnimating = true
      } else if (animationProgress > 0) {
        // Before threshold - animate back to 0
        targetProgress = 0
        isAutoAnimating = true
      } else {
        // No movement - just resume auto-play
        scheduleAutoPlay()
      }
    }

    const handleMouseLeave = () => {
      if (isDragging) {
        handleMouseUp()
      }
    }

    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('mouseleave', handleMouseLeave)

    // Animation speed for auto-animation
    const ANIMATION_SPEED = 1.5 // progress per second

    // Animation loop
    let animationId: number
    let lastTime = performance.now() / 1000

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const currentTime = performance.now() / 1000
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      // Auto-animate towards target progress
      if (isAutoAnimating && cubeDataList.length > 0) {
        if (animationProgress < targetProgress) {
          animationProgress = Math.min(
            animationProgress + deltaTime * ANIMATION_SPEED,
            targetProgress,
          )
        } else if (animationProgress > targetProgress) {
          animationProgress = Math.max(
            animationProgress - deltaTime * ANIMATION_SPEED,
            targetProgress,
          )
        }

        // Check if animation is complete
        if (animationProgress === targetProgress) {
          if (targetProgress >= 1) {
            // Completed transition to next image
            completeTransition()
          } else if (targetProgress === 0) {
            // Returned to start
            isAutoAnimating = false
            for (const cubeData of cubeDataList) {
              cubeData.mesh.rotation.y = 0
              cubeData.mesh.position.z = cubeData.baseZ
            }
            scheduleAutoPlay()
          }
        }
      }

      // Apply animation progress to cubes (works for both drag and auto-animation)
      if ((isDragging || isAutoAnimating) && cubeDataList.length > 0 && animationProgress > 0) {
        const maxDiagonal = (GRID_SIZE - 1) * 2

        for (const cubeData of cubeDataList) {
          // Calculate diagonal index based on direction
          const flippedRow = GRID_SIZE - 1 - cubeData.row
          let diagonalIndex: number
          if (animationDirection === 'forward') {
            // Top-left to bottom-right
            diagonalIndex = cubeData.col + flippedRow
          } else {
            // Bottom-right to top-left
            diagonalIndex = GRID_SIZE - 1 - cubeData.col + cubeData.row
          }

          // Normalize diagonal index to 0-1 range
          const normalizedDiagonal = diagonalIndex / maxDiagonal

          // Calculate this cube's individual progress based on wave
          // Each cube starts at a different time in the wave
          // The wave spreads across the grid as overall progress increases
          const waveSpread = 0.3 // How spread out the wave is (0 = all together, 1 = very spread)
          const cubeStartProgress = normalizedDiagonal * waveSpread
          const cubeEndProgress = cubeStartProgress + (1 - waveSpread)

          // Map overall progress to this cube's local progress
          let cubeProgress = 0
          if (animationProgress > cubeStartProgress) {
            cubeProgress = Math.min(
              1,
              (animationProgress - cubeStartProgress) / (cubeEndProgress - cubeStartProgress),
            )
          }

          if (cubeProgress > 0) {
            const easedProgress = easeInOutCubic(cubeProgress)
            // Rotate based on direction (full 90 degrees at progress = 1)
            const rotation =
              easedProgress * (Math.PI / 2) * (animationDirection === 'forward' ? 1 : -1)
            cubeData.mesh.rotation.y = rotation

            // Z offset for pop-out effect (peaks at middle of animation)
            const zOffset = Math.sin(cubeProgress * Math.PI) * CUBE_SIZE
            cubeData.mesh.position.z = cubeData.baseZ + zOffset
          } else {
            cubeData.mesh.rotation.y = 0
            cubeData.mesh.position.z = cubeData.baseZ
          }
        }
      }

      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('mouseleave', handleMouseLeave)
      if (autoPlayTimeoutId) {
        clearTimeout(autoPlayTimeoutId)
      }
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
