'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { PyramidCubes } from '@/components/PyramidCubes'
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  ChromaticAberrationEffect,
  TiltShiftEffect,
} from 'postprocessing'
import { pixelText, codeRain } from './scenes3d'
import { SLIDES } from './slides'
import {
  GRID_SIZE,
  CUBE_SIZE,
  GAP,
  DRAG_THRESHOLD,
  ANIMATION_SPEED,
  RENDER_TARGET_SIZE,
  BACKGROUND_ZOOM_IN,
  MOBILE_GRID_SIZE,
  MOBILE_RENDER_TARGET_SIZE,
  MOBILE_MAX_PIXEL_RATIO,
  DESKTOP_MAX_PIXEL_RATIO,
} from './constants'
import { defaultTiltShift } from './types'
import type { CubeData, CubeFaceMaterial, AnimatedSlide, HybridWave } from './types'
import { getGridExtent, easeInOutCubic, calculateCoverFrustum } from './utils'
import { textBlurVertexShader, textBlurFragmentShader } from './shaders/textBlur'
import { createWave, processWaves } from './rippleWave'

export const HeroSlider: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showLoader, setShowLoader] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const slideCount = SLIDES.length

    // Quality settings - strip down effects on constrained devices
    const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const gridSize = isMobile ? MOBILE_GRID_SIZE : GRID_SIZE
    const renderTargetSize = isMobile ? MOBILE_RENDER_TARGET_SIZE : RENDER_TARGET_SIZE
    const maxPixelRatio = isMobile ? MOBILE_MAX_PIXEL_RATIO : DESKTOP_MAX_PIXEL_RATIO

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    // Camera setup - use OrthographicCamera with "cover" behavior
    const aspect = container.clientWidth / container.clientHeight
    const { frustumWidth, frustumHeight } = calculateCoverFrustum(aspect, gridSize)

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

    // Renderer setup - skip antialiasing on mobile (the composer's fullscreen
    // passes dominate the output anyway and MSAA is expensive on tiled GPUs)
    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      powerPreference: 'high-performance',
      stencil: false,
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio))
    container.appendChild(renderer.domElement)

    // Post-processing setup
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    // Chromatic aberration on the main scene. On desktop the tilt-shift
    // depth-of-field is merged into the SAME EffectPass, so both run in one
    // fullscreen composite instead of two (only one convolution effect is
    // allowed per pass - CA is the convolution one here). Tilt-shift is
    // skipped on mobile: it is driven by mouse position (static on touch)
    // and costs a fullscreen blur.
    const chromaticAberrationEffect = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.002, 0.002),
      radialModulation: true,
      modulationOffset: 0.2,
    })
    let tiltShiftEffect: TiltShiftEffect | null = null
    if (!isMobile) {
      tiltShiftEffect = new TiltShiftEffect({
        offset: 0.0,
        rotation: 0.0,
        focusArea: 0.4,
        feather: 0.3,
        kernelSize: 3,
      })
    }
    const effectPass = new EffectPass(
      camera,
      chromaticAberrationEffect,
      ...(tiltShiftEffect ? [tiltShiftEffect] : []),
    )
    composer.addPass(effectPass)

    // ============================================
    // Text Overlay Setup
    // ============================================
    let triggerGridWave: ((row: number, col: number) => void) | null = null

    // Create render target for text with blur effect
    const textRenderTarget = new THREE.WebGLRenderTarget(
      container.clientWidth * Math.min(window.devicePixelRatio, maxPixelRatio),
      container.clientHeight * Math.min(window.devicePixelRatio, maxPixelRatio),
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      },
    )

    // Fullscreen quad for rendering blurred text with chromatic aberration
    // Start in dissipated state (pixelation = 1, opacity = 0) for materialization effect
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
        opacity: { value: 0.0 },
        pixelation: { value: 1.0 },
        vibrate: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: textBlurVertexShader,
      fragmentShader: textBlurFragmentShader,
    })

    const blurQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurMaterial)
    const blurScene = new THREE.Scene()
    blurScene.add(blurQuad)
    const blurCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    // Check initial scroll position - if scrolled past threshold, start fully faded out
    const INITIAL_SCROLL_DEATH_THRESHOLD = 0.4
    const initialScroll = window.scrollY / window.innerHeight
    if (initialScroll >= INITIAL_SCROLL_DEATH_THRESHOLD) {
      // Start in fully dead/faded state
      blurMaterial.uniforms.pixelation.value = 1.0
      blurMaterial.uniforms.opacity.value = 0.0
    }

    const textOverlay = pixelText.create({
      text: 'MAKE\nFUN',
      colorStart: 0xff6b6b,
      colorEnd: 0x4ecdc4,
      fontSize: 0.4,
      depth: 0.2,
      depthLayers: 16,
      onSnapBack: (dirX, dirY) => {
        const centerRow = Math.floor(gridSize / 2)
        const centerCol = Math.floor(gridSize / 2)
        const offsetAmount = Math.floor(gridSize * 0.4)
        const targetRow = Math.round(centerRow + dirY * offsetAmount)
        const targetCol = Math.round(centerCol + dirX * offsetAmount)
        const clampedRow = Math.max(0, Math.min(gridSize - 1, targetRow))
        const clampedCol = Math.max(0, Math.min(gridSize - 1, targetCol))

        if (triggerGridWave) {
          triggerGridWave(clampedRow, clampedCol)
        }
      },
      // Align with Tailwind container padding
      tailwindContainer: {
        screens: {
          sm: '40rem',
          md: '48rem',
          lg: '64rem',
          xl: '80rem',
          '2xl': '86rem',
        },
        padding: {
          DEFAULT: '1rem',
          sm: '1rem',
          md: '2rem',
          lg: '2rem',
          xl: '2rem',
          '2xl': '2rem',
        },
      },
      // Breakpoint-based font sizes
      fontSizeBreakpoints: {
        DEFAULT: '5rem',
        sm: '6rem',
        md: '8rem',
        lg: '10rem',
        xl: '12rem',
        '2xl': '12rem',
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

    // Apply initial scroll offset based on current scroll position
    const earlyScrollY = window.scrollY
    const earlyScrollProgress = Math.min(1, Math.max(0, earlyScrollY / window.innerHeight))
    // @ts-ignore
    if (textOverlay.setScrollOffset) {
      // @ts-ignore
      textOverlay.setScrollOffset(earlyScrollProgress)
    }

    // ============================================
    // Code Rain Background Text Layer
    // ============================================
    const codeRainOverlay = codeRain.create({
      colorStart: 0xff6b6b,
      colorEnd: 0x4ecdc4,
      opacity: 0.6,
      glowOpacity: 0.2,
      typingSpeed: 600,
      burstMin: 5,
      burstMax: 20,
      pauseMin: 0.01,
      pauseMax: 0.08,
      marginLeft: 0.05, // fallback
      marginTop: 0.08,
      marginBottom: 0.08,
      containerWidthPercent: 0.5, // 50% of viewport width
      fontSizePercent: 0.025, // 2.5% of container width (fallback)
      outlineColor: 0x000000,
      outlineWidth: 0.06,
      // Align with Tailwind container padding
      tailwindContainer: {
        screens: {
          sm: '40rem',
          md: '48rem',
          lg: '64rem',
          xl: '80rem',
          '2xl': '86rem',
        },
        padding: {
          DEFAULT: '1rem',
          sm: '1rem',
          md: '2rem',
          lg: '2rem',
          xl: '2rem',
          '2xl': '2rem',
        },
      },
      // Breakpoint-based font sizes
      fontSizeBreakpoints: {
        DEFAULT: '0.75rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.25rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
    })

    // Update code rain camera
    const codeRainCamera = codeRainOverlay.camera as THREE.PerspectiveCamera
    if (codeRainOverlay.resize) {
      codeRainOverlay.resize(container.clientWidth, container.clientHeight, initialAspect)
    } else {
      codeRainCamera.aspect = initialAspect
      codeRainCamera.updateProjectionMatrix()
    }

    // Start codeRain hidden for materialization effect
    // @ts-ignore
    if (codeRainOverlay.setOpacity) {
      // @ts-ignore
      codeRainOverlay.setOpacity(0)
    }

    // Track mouse position for chromatic aberration
    let mouseX = 0
    let mouseY = 0
    let targetMouseX = 0
    let targetMouseY = 0

    // Cache bounding rect (updated on resize)
    let cachedRect: DOMRect = container.getBoundingClientRect()

    // Throttle mouse move events
    let lastMouseMoveTime = 0
    const MOUSE_THROTTLE_MS = 16 // ~60fps

    // Scroll-based zoom state
    const SCROLL_RANGE = window.innerHeight
    // Initialize scroll progress from current scroll position immediately
    const initialScrollY = window.scrollY
    const initialScrollProgress = Math.min(1, Math.max(0, initialScrollY / SCROLL_RANGE))
    let scrollProgress = initialScrollProgress
    let targetScrollProgress = initialScrollProgress

    // Materialization state - starts dissipated, materializes on load
    // If already scrolled past threshold, skip materialization entirely
    const SKIP_MATERIALIZE_THRESHOLD = 0.4
    const shouldSkipMaterialization = initialScrollProgress >= SKIP_MATERIALIZE_THRESHOLD
    let materializeProgress = shouldSkipMaterialization ? 1 : 0 // 0 = dissipated, 1 = fully materialized
    const MATERIALIZE_DELAY = 500 // ms before starting materialization
    const materializeStartTime = performance.now() + MATERIALIZE_DELAY
    let hasTriggeredInitialWave = shouldSkipMaterialization // Skip initial wave if materialization was skipped

    // Store base frustum for scroll zoom calculations
    let baseFrustumWidth = frustumWidth
    let baseFrustumHeight = frustumHeight

    // Load textures
    const textureLoader = new THREE.TextureLoader()
    textureLoader.crossOrigin = 'anonymous'

    // Array to hold textures for each slide
    const slideTextures: THREE.Texture[] = []
    const geometries: THREE.BufferGeometry[] = []
    const materials: THREE.Material[] = []

    // ============================================
    // 3D Scene Setup for animated slides
    // ============================================
    const animatedSlides: AnimatedSlide[] = []

    // Setup 3D scenes for animated slides
    SLIDES.forEach((slide, index) => {
      if (slide.type === '3d') {
        const renderTarget = new THREE.WebGLRenderTarget(renderTargetSize, renderTargetSize, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
        })

        const scene3d = slide.createScene({ isMobile })

        animatedSlides.push({
          slideIndex: index,
          renderTarget,
          scene3d,
        })

        slideTextures[index] = renderTarget.texture
      }
    })

    // Store cube data with animation state
    const cubeDataList: CubeData[] = []

    // Track active hybrid waves
    const activeHybridWaves: HybridWave[] = []

    // Assign the triggerGridWave function
    triggerGridWave = (row: number, col: number) => {
      const now = performance.now() / 1000
      activeHybridWaves.push(createWave(row, col, now))
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
      // Swapping one non-null map for another is a plain uniform update -
      // needsUpdate (a shader program revalidation) is only required when a
      // map is added or removed, so skip it for the whole grid
      for (const cubeData of cubeDataList) {
        cubeData.faceMaterials[0].map = targetTexture
        cubeData.faceMaterials[1].map = targetTexture
      }
    }

    // Complete the transition - update current slide and reset
    const completeTransition = () => {
      currentSlideIndex = getNextSlideIndex(animationDirection)
      animationProgress = 0
      targetProgress = 0

      const currentTexture = slideTextures[currentSlideIndex]
      for (const cubeData of cubeDataList) {
        cubeData.mesh.rotation.y = 0
        cubeData.mesh.position.z = cubeData.baseZ
        cubeData.faceMaterials[4].map = currentTexture
        cubeData.faceMaterials[5].map = currentTexture
        cubeData.faceMaterials[2].map = currentTexture
        cubeData.faceMaterials[3].map = currentTexture
      }

      isAutoAnimating = false
      scheduleAutoPlay()
    }

    // Schedule auto-play
    const scheduleAutoPlay = () => {
      if (prefersReducedMotion) return
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
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const uMin = col / gridSize
          const uMax = (col + 1) / gridSize
          const vMin = row / gridSize
          const vMax = (row + 1) / gridSize

          const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)
          geometries.push(geometry)

          const uvAttribute = geometry.getAttribute('uv')
          const uvArray = uvAttribute.array as Float32Array

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

          // Lambert on mobile - much cheaper fragment shading than Standard's
          // PBR, and visually near-identical for flat textured cubes
          const createFaceMaterial = (): CubeFaceMaterial =>
            isMobile
              ? new THREE.MeshLambertMaterial({ map: initialTexture })
              : new THREE.MeshStandardMaterial({ map: initialTexture })

          const faceMaterials = [
            createFaceMaterial(),
            createFaceMaterial(),
            createFaceMaterial(),
            createFaceMaterial(),
            createFaceMaterial(),
            createFaceMaterial(),
          ]
          materials.push(...faceMaterials)

          const cube = new THREE.Mesh(geometry, faceMaterials)

          const x = col * (CUBE_SIZE + GAP)
          const y = row * (CUBE_SIZE + GAP)
          cube.position.set(x, y, 0)

          cubeGroup.add(cube)

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
      const centerOffset = getGridExtent(gridSize) / 2
      cubeGroup.position.set(-centerOffset + CUBE_SIZE / 2, -centerOffset + CUBE_SIZE / 2, 0)

      // Mark as loaded and start the first animation after a short delay
      setIsLoaded(true)
      if (!prefersReducedMotion) {
        setTimeout(() => {
          animationDirection = 'forward'
          updateSideTextures('forward')
          targetProgress = 1
          isAutoAnimating = true
        }, 1000)
      }
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
        calculateCoverFrustum(newAspect, gridSize)

      baseFrustumWidth = newFrustumWidth
      baseFrustumHeight = newFrustumHeight

      const zoomFactor = 1 - scrollProgress * BACKGROUND_ZOOM_IN
      camera.left = -newFrustumWidth * zoomFactor
      camera.right = newFrustumWidth * zoomFactor
      camera.top = newFrustumHeight * zoomFactor
      camera.bottom = -newFrustumHeight * zoomFactor
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      composer.setSize(width, height)

      if (textOverlay.resize) {
        textOverlay.resize(width, height, newAspect)
      } else {
        textCamera.aspect = newAspect
        textCamera.updateProjectionMatrix()
      }

      // Update code rain overlay
      if (codeRainOverlay.resize) {
        codeRainOverlay.resize(width, height, newAspect)
      } else {
        codeRainCamera.aspect = newAspect
        codeRainCamera.updateProjectionMatrix()
      }

      const pixelRatio = Math.min(window.devicePixelRatio, maxPixelRatio)
      textRenderTarget.setSize(width * pixelRatio, height * pixelRatio)
      blurMaterial.uniforms.resolution.value.set(width, height)

      // Update cached bounding rect
      cachedRect = container.getBoundingClientRect()
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
      // Throttle mouse move events for performance
      const now = performance.now()

      // Always process drag events without throttling for responsiveness
      if (isDragging && !isAutoAnimating) {
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

      // Throttle chromatic aberration mouse tracking
      if (now - lastMouseMoveTime < MOUSE_THROTTLE_MS) return
      lastMouseMoveTime = now

      // Use cached rect instead of forcing layout recalculation
      targetMouseX = ((event.clientX - cachedRect.left) / cachedRect.width) * 2 - 1
      targetMouseY = -((event.clientY - cachedRect.top) / cachedRect.height) * 2 + 1
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
      const dragDistance = Math.sqrt(
        Math.pow(event.clientX - clickStartX, 2) + Math.pow(event.clientY - clickStartY, 2),
      )
      if (dragDistance > 10) return

      // Use cached rect instead of forcing layout recalculation
      clickMouse.x = ((event.clientX - cachedRect.left) / cachedRect.width) * 2 - 1
      clickMouse.y = -((event.clientY - cachedRect.top) / cachedRect.height) * 2 + 1

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
          activeHybridWaves.push(createWave(cubeData.row, cubeData.col, now))
        }
      }
    }

    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mousedown', handleClickStart)
    container.addEventListener('mousemove', handleMouseMove, { passive: true })
    container.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('mouseup', handleClick)
    container.addEventListener('mouseleave', handleMouseLeave)

    // Scroll handler for zoom effect
    const handleScroll = () => {
      const scrollY = window.scrollY
      targetScrollProgress = Math.min(1, Math.max(0, scrollY / SCROLL_RANGE))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Animation loop
    let animationId: number
    let lastTime = performance.now() / 1000
    let isBackgrounded = false
    let wavesNeedReset = false
    let textFrameCounter = 0

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const currentTime = performance.now() / 1000

      // Background mode (mobile): once the hero is scrolled past it acts as
      // the page background behind the content cards - keep the same animation
      // running but at ~30fps instead of 60 to halve the GPU/CPU cost.
      // Skipped frames don't update lastTime, so deltaTime stays accurate.
      if (isBackgrounded && currentTime - lastTime < 1 / 32) return

      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      // Smooth mouse following for chromatic aberration
      mouseX += (targetMouseX - mouseX) * 0.1
      mouseY += (targetMouseY - mouseY) * 0.1

      // Smooth scroll following for zoom effects
      scrollProgress += (targetScrollProgress - scrollProgress) * 0.1

      // Move pixelText up as we scroll down
      // @ts-ignore
      if (textOverlay.setScrollOffset) {
        // @ts-ignore
        textOverlay.setScrollOffset(scrollProgress)
      }

      // Apply scroll zoom to background camera
      const bgZoomFactor = 1 - scrollProgress * BACKGROUND_ZOOM_IN
      camera.left = -baseFrustumWidth * bgZoomFactor
      camera.right = baseFrustumWidth * bgZoomFactor
      camera.top = baseFrustumHeight * bgZoomFactor
      camera.bottom = -baseFrustumHeight * bgZoomFactor
      camera.updateProjectionMatrix()

      // Text zoom disabled - keep at 1.0
      blurMaterial.uniforms.textZoom.value = 1.0

      // Materialization on load - starts dissipated, then materializes
      const now = performance.now()
      if (materializeProgress < 1) {
        if (now >= materializeStartTime) {
          // Smooth materialization over time
          materializeProgress = Math.min(1, materializeProgress + deltaTime * 1.2)
        }
      }

      // Trigger initial rainbow wave when materialization completes
      // Wave originates from approximate center of the "MAKE FUN" text (left-center of screen)
      if (materializeProgress >= 1 && !hasTriggeredInitialWave && cubeDataList.length > 0) {
        hasTriggeredInitialWave = true
        if (!prefersReducedMotion) {
          // Text is left-aligned and vertically centered
          // Approximate text center: ~25% from left (col), ~50% from bottom (row)
          const textCenterRow = Math.floor(gridSize * 0.5)
          const textCenterCol = Math.floor(gridSize * 0.25)
          activeHybridWaves.push(createWave(textCenterRow, textCenterCol, currentTime))
        }
      }

      // Calculate effective pixelation based on materialization state
      // Text stays solid after materialization (no death animation on scroll)
      let targetPixelation: number
      if (materializeProgress < 1) {
        // During materialization: go from 1 (dissipated) to 0 (solid)
        targetPixelation = 1 - materializeProgress
      } else {
        // After materialization: stay solid
        targetPixelation = 0
      }

      // Smoothly interpolate pixelation
      const currentPixelation = blurMaterial.uniforms.pixelation.value
      const newPixelation = currentPixelation + (targetPixelation - currentPixelation) * 0.06

      blurMaterial.uniforms.pixelation.value = newPixelation

      // Vibration: peaks during materialization transition
      // Using sine wave that's strongest when pixelation is around 0.3-0.5
      const vibratePhase = Math.sin(newPixelation * Math.PI) // peaks at 0.5
      const vibrateIntensity = vibratePhase * 0.012
      const vibrateX = Math.sin(currentTime * 45) * vibrateIntensity
      const vibrateY = Math.cos(currentTime * 55) * vibrateIntensity * 0.8
      blurMaterial.uniforms.vibrate.value.set(vibrateX, vibrateY)

      // Opacity: stays at 1 until pixelation reaches 0.7, then fades out
      const fadeStart = 0.7
      const fadeOpacity =
        newPixelation < fadeStart ? 1 : 1 - (newPixelation - fadeStart) / (1 - fadeStart)
      blurMaterial.uniforms.opacity.value = fadeOpacity

      // CodeRain: fade in during materialization, then stay visible (no scroll fade)
      // @ts-ignore
      if (codeRainOverlay.setOpacity) {
        // @ts-ignore
        codeRainOverlay.setOpacity(materializeProgress)
      }

      // Update chromatic aberration based on mouse position
      const distFromCenter = Math.sqrt(mouseX * mouseX + mouseY * mouseY)
      const baseStrength = 0.004
      const mouseStrength = distFromCenter * 0.006
      chromaticAberrationEffect.offset.set(
        baseStrength + mouseStrength,
        baseStrength + mouseStrength,
      )

      // Update tilt-shift based on mouse position and current slide settings
      if (tiltShiftEffect) {
        const currentTiltShift = SLIDES[currentSlideIndex].tiltShift || defaultTiltShift
        tiltShiftEffect.offset = mouseY * 0.3
        tiltShiftEffect.rotation = mouseX * 0.5
        tiltShiftEffect.focusArea = currentTiltShift.focusArea
        tiltShiftEffect.feather = currentTiltShift.feather
      }

      // Update and render only the animated 3D slides whose textures are
      // currently on screen: the active slide, plus the target slide while a
      // transition is in progress (side faces show the target texture)
      const isTransitioning = isDragging || isAutoAnimating || animationProgress > 0
      const transitionTargetIndex = isTransitioning ? getNextSlideIndex(animationDirection) : -1
      for (const animSlide of animatedSlides) {
        if (
          animSlide.slideIndex !== currentSlideIndex &&
          animSlide.slideIndex !== transitionTargetIndex
        ) {
          continue
        }

        animSlide.scene3d.update(deltaTime)

        if (animSlide.scene3d.render) {
          animSlide.scene3d.render(renderer, animSlide.renderTarget)
        } else {
          renderer.setRenderTarget(animSlide.renderTarget)
          renderer.render(animSlide.scene3d.scene, animSlide.scene3d.camera)
          renderer.setRenderTarget(null)
        }
      }

      // Process hybrid wave-chaos effects - skip entirely when idle (one extra
      // pass runs after the last wave fades to reset material emissives)
      if (activeHybridWaves.length > 0) {
        processWaves(activeHybridWaves, cubeDataList, currentTime, gridSize)
        wavesNeedReset = true
      } else if (wavesNeedReset) {
        processWaves(activeHybridWaves, cubeDataList, currentTime, gridSize)
        wavesNeedReset = false
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
        const maxDiagonal = (gridSize - 1) * 2

        for (const cubeData of cubeDataList) {
          const flippedRow = gridSize - 1 - cubeData.row
          let diagonalIndex: number
          if (animationDirection === 'forward') {
            diagonalIndex = cubeData.col + flippedRow
          } else {
            diagonalIndex = gridSize - 1 - cubeData.col + cubeData.row
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

      // Update code rain color scheme based on current slide
      // Slides 0-1 (hypercube) = scheme 0 (pink text), slides 2-3 (waveDots) = scheme 1 (teal text)
      if (codeRainOverlay.setColorScheme) {
        const colorScheme = currentSlideIndex >= 2 ? 1 : 0
        codeRainOverlay.setColorScheme(colorScheme)
      }

      // Render code rain layer (between background and text)
      codeRainOverlay.update(deltaTime)
      renderer.autoClear = false
      renderer.clearDepth()
      renderer.render(codeRainOverlay.scene, codeRainOverlay.camera)
      renderer.autoClear = true

      // Render text overlay on top with blur. Re-render the text scene at
      // full rate only while something user-visible is in motion
      // (materialization, scroll, drag/wobble/ripple, mouse follow). When
      // only the slow ambient float and gradient shift animate, refresh at a
      // third of the frame rate - imperceptible at those speeds, and it
      // skips a fullscreen offscreen render on most frames.
      textOverlay.update(deltaTime)

      textFrameCounter++
      const textInMotion =
        materializeProgress < 1 ||
        newPixelation > 0.001 ||
        Math.abs(targetScrollProgress - scrollProgress) > 0.0005 ||
        // @ts-ignore
        (textOverlay.isInteracting ? textOverlay.isInteracting() : true)
      if (textInMotion || textFrameCounter % 3 === 0) {
        renderer.setRenderTarget(textRenderTarget)
        renderer.setClearColor(0x000000, 0)
        renderer.clear()
        renderer.render(textOverlay.scene, textOverlay.camera)
        renderer.setRenderTarget(null)
      }

      renderer.autoClear = false
      renderer.render(blurScene, blurCamera)
      renderer.autoClear = true
    }
    animate()

    // Mobile only: track when the hero section is scrolled past so the loop
    // can drop to ~30fps background mode (see the check in animate above).
    // The canvas stays visible behind the content cards for the whole page,
    // so it must keep animating - it just doesn't need full frame rate when
    // it's a backdrop rather than the main interactive element.
    // The wrapper div (100vh of padding) is the in-flow scroll sentinel.
    let visibilityObserver: IntersectionObserver | null = null
    if (isMobile && wrapperRef.current) {
      visibilityObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (!entry) return
          isBackgrounded = !entry.isIntersecting
        },
        // Restore full frame rate slightly before the hero scrolls back into view
        { rootMargin: '25% 0px 25% 0px' },
      )
      visibilityObserver.observe(wrapperRef.current)
    }

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
      if (visibilityObserver) {
        visibilityObserver.disconnect()
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
      codeRainOverlay.dispose()
      textRenderTarget.dispose()
      blurMaterial.dispose()
      blurQuad.geometry.dispose()
      composer.dispose()
      renderer.dispose()
    }
  }, [])

  // Hide loader after fade-out transition completes
  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => setShowLoader(false), 600)
      return () => clearTimeout(timer)
    }
  }, [isLoaded])

  return (
    <div ref={wrapperRef} style={{ paddingTop: '100vh' }}>
      {/* Loading animation - shown while Three.js loads */}
      {showLoader && (
        <div
          className="fixed inset-0 bg-noise-gradient-clipped overflow-hidden"
          style={{
            zIndex: 50,
            opacity: isLoaded ? 0 : 1,
            transition: 'opacity 0.5s ease-out',
            pointerEvents: isLoaded ? 'none' : 'auto',
          }}
        >
          {/* Rotating gradient overlay */}
          <div className="loader-gradient-overlay" />
          <div
            className="noise-overlay-clipped"
            style={{
              opacity: 0.15,
            }}
          />
          <div
            className="flex items-center justify-center"
            style={{ position: 'absolute', inset: 0 }}
          >
            <PyramidCubes />
          </div>
        </div>
      )}

      {/* Three.js canvas container */}
      <div
        ref={containerRef}
        style={{
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease-in',
        }}
      />
      {/* Noise overlay layer - on top of everything for visible grain */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 2,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          className="noise-overlay-clipped"
          style={{
            opacity: 0.15,
          }}
        />
      </div>
    </div>
  )
}
