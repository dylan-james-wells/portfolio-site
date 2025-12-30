'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  ChromaticAberrationEffect,
  TiltShiftEffect,
} from 'postprocessing'
import type { Scene3D } from './scenes3d'
import { hypercube, waveDots, pixelText } from './scenes3d'

const GRID_SIZE = 30
const CUBE_SIZE = 1
const GAP = 0.01

// Drag interaction settings
const DRAG_THRESHOLD = 150 // pixels to drag before committing to advance

// Tilt-shift settings per slide
interface TiltShiftSettings {
  focusArea: number
  feather: number
  blur: number
}

// Slide definitions - can be either an image URL or a 3D scene factory
type SlideType =
  | { type: 'image'; url: string; tiltShift?: TiltShiftSettings }
  | { type: '3d'; createScene: () => Scene3D; tiltShift?: TiltShiftSettings }

// Default tilt-shift settings
const defaultTiltShift: TiltShiftSettings = { focusArea: 0.4, feather: 0.3, blur: 0.15 }

const SLIDES: SlideType[] = [
  {
    type: '3d',
    createScene: () => hypercube.create({ colorInner: 0xff6b6b, colorOuter: 0x4ecdc4 }),
    tiltShift: { focusArea: 0.8, feather: 0.4, blur: 0.08 }, // Less blur for hypercube
  },
  {
    type: '3d',
    createScene: () => hypercube.create({ colorInner: 0x4ecdc4, colorOuter: 0xff6b6b }),
    tiltShift: { focusArea: 0.8, feather: 0.4, blur: 0.08 }, // Less blur for hypercube
  },
  {
    type: '3d',
    createScene: () => waveDots.create({ colorStart: 0xff6b6b, colorEnd: 0x4ecdc4 }),
    tiltShift: { focusArea: 0.4, feather: 0.3, blur: 0.15 }, // More blur for dots
  },
  {
    type: '3d',
    createScene: () => waveDots.create({ colorStart: 0x4ecdc4, colorEnd: 0xff6b6b }),
    tiltShift: { focusArea: 0.4, feather: 0.3, blur: 0.15 }, // More blur for dots
  },
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
      offset: new THREE.Vector2(0.002, 0.002),
      radialModulation: true,
      modulationOffset: 0.2,
    })
    const chromaticPass = new EffectPass(camera, chromaticAberrationEffect)
    composer.addPass(chromaticPass)

    // Tilt-shift depth of field effect
    const tiltShiftEffect = new TiltShiftEffect({
      offset: 0.0,
      rotation: 0.0,
      focusArea: 0.4,
      feather: 0.3,
      blur: 0.15,
      kernelSize: 3,
    })
    const tiltShiftPass = new EffectPass(camera, tiltShiftEffect)
    composer.addPass(tiltShiftPass)

    // ============================================
    // Text Overlay Setup
    // ============================================
    // Helper to trigger a grid wave at a position (will be populated after grid is created)
    let triggerGridWave: ((row: number, col: number) => void) | null = null

    // Create render target for text with blur effect
    const textRenderTarget = new THREE.WebGLRenderTarget(
      container.clientWidth * Math.min(window.devicePixelRatio, 2),
      container.clientHeight * Math.min(window.devicePixelRatio, 2),
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      },
    )

    // Fullscreen quad for rendering blurred text with chromatic aberration
    const blurMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        tDiffuse: { value: textRenderTarget.texture },
        resolution: {
          value: new THREE.Vector2(container.clientWidth, container.clientHeight),
        },
        blurAmount: { value: 1.5 },
        aberrationStrength: { value: 0.004 },
        textZoom: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float blurAmount;
        uniform float aberrationStrength;
        uniform float textZoom;
        varying vec2 vUv;

        void main() {
          // Apply zoom by scaling UV from center
          vec2 center = vec2(0.5);
          vec2 zoomedUv = center + (vUv - center) / textZoom;

          // Early out if outside texture bounds
          if (zoomedUv.x < 0.0 || zoomedUv.x > 1.0 || zoomedUv.y < 0.0 || zoomedUv.y > 1.0) {
            gl_FragColor = vec4(0.0);
            return;
          }

          vec2 texelSize = blurAmount / resolution;

          // Chromatic aberration offset based on distance from center
          vec2 dir = zoomedUv - center;
          float dist = length(dir);
          vec2 aberrationOffset = dir * aberrationStrength * dist;

          vec3 color = vec3(0.0);
          float alpha = 0.0;

          // 9-tap blur with chromatic aberration
          for(int x = -1; x <= 1; x++) {
            for(int y = -1; y <= 1; y++) {
              vec2 offset = vec2(float(x), float(y)) * texelSize;

              // Sample each channel with slight offset for aberration
              float r = texture2D(tDiffuse, zoomedUv + offset + aberrationOffset).r;
              float g = texture2D(tDiffuse, zoomedUv + offset).g;
              float b = texture2D(tDiffuse, zoomedUv + offset - aberrationOffset).b;
              float a = texture2D(tDiffuse, zoomedUv + offset).a;

              color += vec3(r, g, b);
              alpha += a;
            }
          }
          color /= 9.0;
          alpha /= 9.0;

          gl_FragColor = vec4(color, alpha);
        }
      `,
    })

    const blurQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurMaterial)
    const blurScene = new THREE.Scene()
    blurScene.add(blurQuad)
    const blurCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const textOverlay = pixelText.create({
      text: 'MAKE\nFUN',
      colorStart: 0xff6b6b,
      colorEnd: 0x4ecdc4,
      fontSize: 0.4,
      depth: 0.2,
      depthLayers: 16,
      onSnapBack: (dirX, dirY) => {
        // Convert direction to grid position
        // dirX/dirY are -1 to 1, we want to pick a tile in that direction from center
        const centerRow = Math.floor(GRID_SIZE / 2)
        const centerCol = Math.floor(GRID_SIZE / 2)
        // Offset from center based on direction (towards the edge)
        const offsetAmount = Math.floor(GRID_SIZE * 0.4)
        const targetRow = Math.round(centerRow + dirY * offsetAmount)
        const targetCol = Math.round(centerCol + dirX * offsetAmount)
        // Clamp to grid bounds
        const clampedRow = Math.max(0, Math.min(GRID_SIZE - 1, targetRow))
        const clampedCol = Math.max(0, Math.min(GRID_SIZE - 1, targetCol))

        if (triggerGridWave) {
          triggerGridWave(clampedRow, clampedCol)
        }
      },
    })

    // Update text camera aspect ratio and initial sizing
    const textCamera = textOverlay.camera as THREE.PerspectiveCamera
    const initialAspect = container.clientWidth / container.clientHeight
    if (textOverlay.resize) {
      textOverlay.resize(container.clientWidth, container.clientHeight, initialAspect)
    } else {
      textCamera.aspect = initialAspect
      textCamera.updateProjectionMatrix()
    }

    // Track mouse position for chromatic aberration
    let mouseX = 0
    let mouseY = 0
    let targetMouseX = 0
    let targetMouseY = 0

    // Scroll-based zoom state
    let scrollProgress = 0 // 0 = top, 1 = scrolled one viewport height
    let targetScrollProgress = 0
    const SCROLL_RANGE = window.innerHeight // How much scroll to reach full effect
    const BACKGROUND_ZOOM_IN = 0.5 // How much the background zooms in (0.5 = 50% larger)
    const TEXT_ZOOM_OUT = 0.5 // How much the text zooms out (0.5 = 50% smaller)

    // Store base frustum for scroll zoom calculations
    let baseFrustumWidth = frustumWidth
    let baseFrustumHeight = frustumHeight

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
      // Ripple effect state
      rippleColor: THREE.Color | null
      rippleIntensity: number
    }
    const cubeDataList: CubeData[] = []

    // Bright color palette for ripple effect
    const rippleColors = [
      new THREE.Color(0xff0055), // hot pink
      new THREE.Color(0x00ff88), // neon green
      new THREE.Color(0xff3300), // orange-red
      new THREE.Color(0x00ffff), // cyan
      new THREE.Color(0xff00ff), // magenta
      new THREE.Color(0xffff00), // yellow
      new THREE.Color(0x0088ff), // electric blue
      new THREE.Color(0xff0000), // red
      new THREE.Color(0x00ff00), // green
      new THREE.Color(0xff8800), // orange
    ]

    // Hybrid wave-chaos settings
    const SPREAD_DROPOFF = 0.85 // Probability multiplier per step (higher = spreads further)
    const WAVE_SPEED = 30 // Tiles per second for the wave front
    const COLOR_FADE_DURATION = 0.5 // Seconds for color to fade out
    const WAVE_WIDTH = 4.0 // Width of the glowing wave front
    const COLOR_INTENSITY = 0.3 // Max emissive intensity (0-1, higher = brighter colors)

    // Track active hybrid waves
    interface HybridWave {
      originRow: number
      originCol: number
      startTime: number
      affectedTiles: Map<string, { color: THREE.Color; activatedTime: number }> // tiles that passed the probability check
      processedDistances: Set<number> // which distance rings have been processed
    }
    const activeHybridWaves: HybridWave[] = []

    // Assign the triggerGridWave function now that we have access to activeHybridWaves
    triggerGridWave = (row: number, col: number) => {
      const now = performance.now() / 1000
      const tileKey = `${row},${col}`
      const randomColor = rippleColors[Math.floor(Math.random() * rippleColors.length)]

      const affectedTiles = new Map<string, { color: THREE.Color; activatedTime: number }>()
      affectedTiles.set(tileKey, { color: randomColor.clone(), activatedTime: now })

      activeHybridWaves.push({
        originRow: row,
        originCol: col,
        startTime: now,
        affectedTiles,
        processedDistances: new Set([0]),
      })
    }

    // Raycaster for click detection
    const raycaster = new THREE.Raycaster()
    const clickMouse = new THREE.Vector2()

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
            rippleColor: null,
            rippleIntensity: 0,
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

      // Update base frustum for scroll zoom
      baseFrustumWidth = newFrustumWidth
      baseFrustumHeight = newFrustumHeight

      // Apply current scroll zoom to frustum (zoom in = smaller frustum)
      const zoomFactor = 1 - scrollProgress * BACKGROUND_ZOOM_IN
      camera.left = -newFrustumWidth * zoomFactor
      camera.right = newFrustumWidth * zoomFactor
      camera.top = newFrustumHeight * zoomFactor
      camera.bottom = -newFrustumHeight * zoomFactor
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      composer.setSize(width, height)

      // Update text overlay camera and sizing
      if (textOverlay.resize) {
        textOverlay.resize(width, height, newAspect)
      } else {
        textCamera.aspect = newAspect
        textCamera.updateProjectionMatrix()
      }

      // Resize text render target
      const pixelRatio = Math.min(window.devicePixelRatio, 2)
      textRenderTarget.setSize(width * pixelRatio, height * pixelRatio)
      blurMaterial.uniforms.resolution.value.set(width, height)
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

    // Click handler for ripple effect
    let clickStartX = 0
    let clickStartY = 0
    const handleClickStart = (event: MouseEvent) => {
      clickStartX = event.clientX
      clickStartY = event.clientY
    }

    const handleClick = (event: MouseEvent) => {
      // Only trigger ripple if it wasn't a drag (mouse didn't move much)
      const dragDistance = Math.sqrt(
        Math.pow(event.clientX - clickStartX, 2) + Math.pow(event.clientY - clickStartY, 2),
      )
      if (dragDistance > 10) return

      // Update click mouse position for raycasting
      const rect = container.getBoundingClientRect()
      clickMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      clickMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Raycast to find clicked cube
      raycaster.setFromCamera(clickMouse, camera)
      const intersects = raycaster.intersectObjects(
        cubeDataList.map((c) => c.mesh),
        false,
      )

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh
        const hitIndex = cubeDataList.findIndex((c) => c.mesh === hitMesh)

        if (hitIndex !== -1) {
          const cubeData = cubeDataList[hitIndex]
          const now = performance.now() / 1000

          // Start a new hybrid wave from this tile
          const tileKey = `${cubeData.row},${cubeData.col}`
          const randomColor = rippleColors[Math.floor(Math.random() * rippleColors.length)]

          const affectedTiles = new Map<string, { color: THREE.Color; activatedTime: number }>()
          affectedTiles.set(tileKey, { color: randomColor.clone(), activatedTime: now })

          activeHybridWaves.push({
            originRow: cubeData.row,
            originCol: cubeData.col,
            startTime: now,
            affectedTiles,
            processedDistances: new Set([0]),
          })
        }
      }
    }

    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mousedown', handleClickStart)
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('mouseup', handleClick)
    container.addEventListener('mouseleave', handleMouseLeave)

    // Scroll handler for zoom effect
    const handleScroll = () => {
      const scrollY = window.scrollY
      targetScrollProgress = Math.min(1, Math.max(0, scrollY / SCROLL_RANGE))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

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

      // Smooth scroll following for zoom effects
      scrollProgress += (targetScrollProgress - scrollProgress) * 0.1

      // Apply scroll zoom to background camera (zoom in = smaller frustum)
      const bgZoomFactor = 1 - scrollProgress * BACKGROUND_ZOOM_IN
      camera.left = -baseFrustumWidth * bgZoomFactor
      camera.right = baseFrustumWidth * bgZoomFactor
      camera.top = baseFrustumHeight * bgZoomFactor
      camera.bottom = -baseFrustumHeight * bgZoomFactor
      camera.updateProjectionMatrix()

      // Apply scroll zoom to text (zoom out = smaller scale)
      const textZoomFactor = 1 - scrollProgress * TEXT_ZOOM_OUT
      blurMaterial.uniforms.textZoom.value = textZoomFactor

      // Update chromatic aberration based on mouse position
      // Radial modulation pushes the effect outward from center
      const distFromCenter = Math.sqrt(mouseX * mouseX + mouseY * mouseY)
      const baseStrength = 0.004
      const mouseStrength = distFromCenter * 0.006
      chromaticAberrationEffect.offset.set(
        baseStrength + mouseStrength,
        baseStrength + mouseStrength,
      )

      // Update tilt-shift based on mouse position and current slide settings
      // Offset moves the focus band up/down, rotation tilts it
      const currentTiltShift = SLIDES[currentSlideIndex].tiltShift || defaultTiltShift
      tiltShiftEffect.offset = mouseY * 0.3
      tiltShiftEffect.rotation = mouseX * 0.5
      tiltShiftEffect.focusArea = currentTiltShift.focusArea
      tiltShiftEffect.feather = currentTiltShift.feather
      tiltShiftEffect.blur = currentTiltShift.blur

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

      // ============================================
      // Process hybrid wave-chaos effects
      // ============================================
      // Reset all cube ripple intensities
      for (const cubeData of cubeDataList) {
        cubeData.rippleIntensity = 0
        cubeData.rippleColor = null
      }

      // Process each active hybrid wave
      for (let w = activeHybridWaves.length - 1; w >= 0; w--) {
        const wave = activeHybridWaves[w]
        const waveAge = currentTime - wave.startTime
        const currentWaveRadius = waveAge * WAVE_SPEED

        // Determine which distance rings the wave front is currently at
        const minRingDist = Math.max(0, currentWaveRadius - WAVE_WIDTH)
        const maxRingDist = currentWaveRadius

        // Process new distance rings as the wave expands
        const maxPossibleDist = Math.ceil(currentWaveRadius) + 1
        for (let dist = 0; dist <= maxPossibleDist && dist < GRID_SIZE * 2; dist++) {
          if (wave.processedDistances.has(dist)) continue

          // Only process this ring if the wave has reached it
          if (currentWaveRadius < dist) continue

          wave.processedDistances.add(dist)

          // Find all tiles at this distance and apply probability
          for (const cubeData of cubeDataList) {
            const dx = cubeData.col - wave.originCol
            const dy = cubeData.row - wave.originRow
            const tileDist = Math.sqrt(dx * dx + dy * dy)

            // Check if this tile is approximately at this distance ring
            if (Math.abs(tileDist - dist) < 0.5) {
              const tileKey = `${cubeData.row},${cubeData.col}`
              if (wave.affectedTiles.has(tileKey)) continue

              // Probability decreases with distance
              const spreadProbability = Math.pow(SPREAD_DROPOFF, dist)

              if (Math.random() < spreadProbability) {
                const randomColor = rippleColors[Math.floor(Math.random() * rippleColors.length)]
                wave.affectedTiles.set(tileKey, {
                  color: randomColor.clone(),
                  activatedTime: currentTime,
                })
              }
            }
          }
        }

        // Apply wave effect to affected tiles
        for (const [tileKey, tileData] of wave.affectedTiles) {
          const [rowStr, colStr] = tileKey.split(',')
          const row = parseInt(rowStr)
          const col = parseInt(colStr)

          const cubeData = cubeDataList.find((c) => c.row === row && c.col === col)
          if (!cubeData) continue

          const dx = col - wave.originCol
          const dy = row - wave.originRow
          const tileDist = Math.sqrt(dx * dx + dy * dy)

          // Calculate intensity based on wave position
          const distFromWaveFront = Math.abs(tileDist - currentWaveRadius)
          const waveIntensity =
            distFromWaveFront < WAVE_WIDTH ? 1 - distFromWaveFront / WAVE_WIDTH : 0

          // Also fade based on time since activation
          const timeSinceActivation = currentTime - tileData.activatedTime
          const timeFade = Math.max(0, 1 - timeSinceActivation / COLOR_FADE_DURATION)

          // Combine: strong when wave passes, then fades over time
          const intensity = Math.max(waveIntensity * 0.8, timeFade * 0.5)

          if (intensity > cubeData.rippleIntensity) {
            cubeData.rippleIntensity = intensity
            cubeData.rippleColor = tileData.color
          }
        }

        // Remove wave if it's completely faded
        const maxWaveDist = GRID_SIZE * 1.5
        if (waveAge > maxWaveDist / WAVE_SPEED + COLOR_FADE_DURATION) {
          activeHybridWaves.splice(w, 1)
        }
      }

      // Apply colors to materials
      for (const cubeData of cubeDataList) {
        if (cubeData.rippleIntensity > 0 && cubeData.rippleColor) {
          const intensity = cubeData.rippleIntensity
          for (const mat of cubeData.faceMaterials) {
            mat.emissive.copy(cubeData.rippleColor)
            mat.emissiveIntensity = intensity * COLOR_INTENSITY
          }
        } else {
          // Reset to default (no emissive)
          for (const mat of cubeData.faceMaterials) {
            mat.emissive.setHex(0x000000)
            mat.emissiveIntensity = 0
          }
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

      // ============================================
      // Render text overlay on top with blur
      // ============================================
      textOverlay.update(deltaTime)

      // First render text to render target
      renderer.setRenderTarget(textRenderTarget)
      renderer.setClearColor(0x000000, 0)
      renderer.clear()
      renderer.render(textOverlay.scene, textOverlay.camera)
      renderer.setRenderTarget(null)

      // Then render blurred text over the main scene
      renderer.autoClear = false
      renderer.render(blurScene, blurCamera)
      renderer.autoClear = true
    }
    animate()

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('mousedown', handleClickStart)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('mouseup', handleClick)
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
      textOverlay.dispose()
      textRenderTarget.dispose()
      blurMaterial.dispose()
      blurQuad.geometry.dispose()
      composer.dispose()
      renderer.dispose()
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
}
