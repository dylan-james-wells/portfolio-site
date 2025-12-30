'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer, EffectPass, RenderPass, ChromaticAberrationEffect } from 'postprocessing'
import type { Scene3D } from './scenes3d'
import { hypercube, waveDots } from './scenes3d'

const GRID_SIZE = 30
const CUBE_SIZE = 1
const GAP = 0.01

// Drag interaction settings
const DRAG_THRESHOLD = 150 // pixels to drag before committing to advance

// Slide definitions - can be either an image URL or a 3D scene factory
type SlideType = { type: 'image'; url: string } | { type: '3d'; createScene: () => Scene3D }

const SLIDES: SlideType[] = [
  {
    type: '3d',
    createScene: () => hypercube.create({ colorInner: 0xff6b6b, colorOuter: 0x4ecdc4 }),
  },
  {
    type: '3d',
    createScene: () => hypercube.create({ colorInner: 0x4ecdc4, colorOuter: 0xff6b6b }),
  },
  { type: '3d', createScene: () => waveDots.create({ colorStart: 0xff6b6b, colorEnd: 0x4ecdc4 }) },
  { type: '3d', createScene: () => waveDots.create({ colorStart: 0x4ecdc4, colorEnd: 0xff6b6b }) },
]

// Easing function for smooth animation
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export const HeroSlider: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const slideCount = SLIDES.length

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Post-processing setup
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    // Chromatic aberration effect on the main scene
    const chromaticAberrationEffect = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.005, 0.005),
      radialModulation: false,
    })
    const chromaticPass = new EffectPass(camera, chromaticAberrationEffect)
    composer.addPass(chromaticPass)

    // Track mouse position for chromatic aberration
    let mouseX = 0
    let mouseY = 0
    let targetMouseX = 0
    let targetMouseY = 0

    // Load textures
    const textureLoader = new THREE.TextureLoader()
    textureLoader.crossOrigin = 'anonymous'

    // Array to hold textures for each slide (either loaded images or render targets)
    const slideTextures: THREE.Texture[] = []
    const geometries: THREE.BufferGeometry[] = []
    const materials: THREE.Material[] = []

    // ============================================
    // 3D Scene Setup for animated slides
    // ============================================
    const RENDER_TARGET_SIZE = 1024

    // Create render targets for 3D slides
    interface AnimatedSlide {
      slideIndex: number
      renderTarget: THREE.WebGLRenderTarget
      scene3d: Scene3D
    }
    const animatedSlides: AnimatedSlide[] = []

    // Setup 3D scenes for animated slides
    SLIDES.forEach((slide, index) => {
      if (slide.type === '3d') {
        // Create render target
        const renderTarget = new THREE.WebGLRenderTarget(RENDER_TARGET_SIZE, RENDER_TARGET_SIZE, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
        })

        // Create the scene using the factory function
        const scene3d = slide.createScene()

        animatedSlides.push({
          slideIndex: index,
          renderTarget,
          scene3d,
        })

        // Use the render target's texture for this slide
        slideTextures[index] = renderTarget.texture
      }
    })

    // Store cube data with animation state
    interface CubeData {
      mesh: THREE.Mesh
      row: number
      col: number
      baseZ: number
      faceMaterials: THREE.MeshStandardMaterial[]
    }
    const cubeDataList: CubeData[] = []

    // Create a group to hold all cubes
    const cubeGroup = new THREE.Group()
    scene.add(cubeGroup)

    // Animation state
    let currentSlideIndex = 0
    let animationDirection: 'forward' | 'backward' = 'forward'

    // Unified animation progress (0 = current slide, 1 = next slide fully shown)
    let animationProgress = 0
    let targetProgress = 0
    let isAutoAnimating = false
    let autoPlayTimeoutId: ReturnType<typeof setTimeout> | null = null

    // Drag state
    let isDragging = false
    let dragStartX = 0

    // Get the next slide index based on direction
    const getNextSlideIndex = (direction: 'forward' | 'backward') => {
      return direction === 'forward'
        ? (currentSlideIndex + 1) % slideCount
        : (currentSlideIndex - 1 + slideCount) % slideCount
    }

    // Update side face textures to show the target slide
    const updateSideTextures = (direction: 'forward' | 'backward') => {
      const targetIndex = getNextSlideIndex(direction)
      const targetTexture = slideTextures[targetIndex]
      for (const cubeData of cubeDataList) {
        cubeData.faceMaterials[0].map = targetTexture
        cubeData.faceMaterials[1].map = targetTexture
        cubeData.faceMaterials[0].needsUpdate = true
        cubeData.faceMaterials[1].needsUpdate = true
      }
    }

    // Complete the transition - update current slide and reset
    const completeTransition = () => {
      currentSlideIndex = getNextSlideIndex(animationDirection)
      animationProgress = 0
      targetProgress = 0

      // Update all face textures to show the new current slide
      const currentTexture = slideTextures[currentSlideIndex]
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

    // Load image textures and create the grid
    const imageLoadPromises = SLIDES.map((slide, index) => {
      if (slide.type === 'image') {
        return new Promise<void>((resolve) => {
          textureLoader.load(slide.url, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace
            slideTextures[index] = texture
            resolve()
          })
        })
      }
      return Promise.resolve()
    })

    Promise.all(imageLoadPromises).then(() => {
      const initialTexture = slideTextures[0]

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
          const faceMaterials = [
            new THREE.MeshStandardMaterial({ map: initialTexture }),
            new THREE.MeshStandardMaterial({ map: initialTexture }),
            new THREE.MeshStandardMaterial({ map: initialTexture }),
            new THREE.MeshStandardMaterial({ map: initialTexture }),
            new THREE.MeshStandardMaterial({ map: initialTexture }),
            new THREE.MeshStandardMaterial({ map: initialTexture }),
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
      composer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    // Drag handlers
    let lastDragDirection: 'forward' | 'backward' | null = null

    const handleMouseDown = (event: MouseEvent) => {
      if (isAutoAnimating) return
      isDragging = true
      dragStartX = event.clientX
      lastDragDirection = null
      if (autoPlayTimeoutId) {
        clearTimeout(autoPlayTimeoutId)
        autoPlayTimeoutId = null
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      // Update target mouse position for chromatic aberration
      const rect = container.getBoundingClientRect()
      targetMouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1
      targetMouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1

      if (!isDragging || isAutoAnimating) return
      const dragDeltaX = event.clientX - dragStartX
      const newDirection: 'forward' | 'backward' = dragDeltaX < 0 ? 'forward' : 'backward'

      if (newDirection !== lastDragDirection) {
        lastDragDirection = newDirection
        animationDirection = newDirection
        updateSideTextures(newDirection)
      }

      const dragProgress = Math.min(Math.abs(dragDeltaX) / DRAG_THRESHOLD, 1) * 0.5
      animationProgress = dragProgress
      targetProgress = dragProgress
    }

    const handleMouseUp = () => {
      if (!isDragging) return
      isDragging = false

      if (animationProgress >= 0.5) {
        targetProgress = 1
        isAutoAnimating = true
      } else if (animationProgress > 0) {
        targetProgress = 0
        isAutoAnimating = true
      } else {
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
    const ANIMATION_SPEED = 1.5

    // Animation loop
    let animationId: number
    let lastTime = performance.now() / 1000

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const currentTime = performance.now() / 1000
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      // Smooth mouse following for chromatic aberration
      mouseX += (targetMouseX - mouseX) * 0.1
      mouseY += (targetMouseY - mouseY) * 0.1

      // Update chromatic aberration based on mouse position
      // Offset increases as mouse moves away from center
      const distFromCenter = Math.sqrt(mouseX * mouseX + mouseY * mouseY)
      const aberrationStrength = 0.003 + distFromCenter * 0.008
      chromaticAberrationEffect.offset.set(
        mouseX * aberrationStrength,
        mouseY * aberrationStrength,
      )

      // ============================================
      // Update and render all animated 3D slides
      // ============================================
      for (const animSlide of animatedSlides) {
        // Update the scene
        animSlide.scene3d.update(deltaTime)

        // Use custom render function if available (for post-processing effects)
        if (animSlide.scene3d.render) {
          animSlide.scene3d.render(renderer, animSlide.renderTarget)
        } else {
          // Fallback to standard rendering
          renderer.setRenderTarget(animSlide.renderTarget)
          renderer.render(animSlide.scene3d.scene, animSlide.scene3d.camera)
          renderer.setRenderTarget(null)
        }
      }

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

        if (animationProgress === targetProgress) {
          if (targetProgress >= 1) {
            completeTransition()
          } else if (targetProgress === 0) {
            isAutoAnimating = false
            for (const cubeData of cubeDataList) {
              cubeData.mesh.rotation.y = 0
              cubeData.mesh.position.z = cubeData.baseZ
            }
            scheduleAutoPlay()
          }
        }
      }

      // Apply animation progress to cubes
      if ((isDragging || isAutoAnimating) && cubeDataList.length > 0 && animationProgress > 0) {
        const maxDiagonal = (GRID_SIZE - 1) * 2

        for (const cubeData of cubeDataList) {
          const flippedRow = GRID_SIZE - 1 - cubeData.row
          let diagonalIndex: number
          if (animationDirection === 'forward') {
            diagonalIndex = cubeData.col + flippedRow
          } else {
            diagonalIndex = GRID_SIZE - 1 - cubeData.col + cubeData.row
          }

          const normalizedDiagonal = diagonalIndex / maxDiagonal
          const waveSpread = 0.3
          const cubeStartProgress = normalizedDiagonal * waveSpread
          const cubeEndProgress = cubeStartProgress + (1 - waveSpread)

          let cubeProgress = 0
          if (animationProgress > cubeStartProgress) {
            cubeProgress = Math.min(
              1,
              (animationProgress - cubeStartProgress) / (cubeEndProgress - cubeStartProgress),
            )
          }

          if (cubeProgress > 0) {
            const easedProgress = easeInOutCubic(cubeProgress)
            const rotation =
              easedProgress * (Math.PI / 2) * (animationDirection === 'forward' ? 1 : -1)
            cubeData.mesh.rotation.y = rotation

            const zOffset = Math.sin(cubeProgress * Math.PI) * CUBE_SIZE
            cubeData.mesh.position.z = cubeData.baseZ + zOffset
          } else {
            cubeData.mesh.rotation.y = 0
            cubeData.mesh.position.z = cubeData.baseZ
          }
        }
      }

      composer.render()
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
      slideTextures.forEach((t) => {
        if (t && !(t instanceof THREE.WebGLRenderTarget)) {
          t.dispose()
        }
      })
      animatedSlides.forEach((as) => {
        as.renderTarget.dispose()
        as.scene3d.dispose()
      })
      composer.dispose()
      renderer.dispose()
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
}
