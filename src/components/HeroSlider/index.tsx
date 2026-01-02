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
} from './constants'
import { defaultTiltShift } from './types'
import type { CubeData, AnimatedSlide, HybridWave } from './types'
import { GRID_EXTENT, easeInOutCubic, calculateCoverFrustum } from './utils'
import { textBlurVertexShader, textBlurFragmentShader } from './shaders/textBlur'
import { createWave, processWaves } from './rippleWave'

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
      kernelSize: 3,
    })
    // tiltShiftEffect.blur = 0.15
    const tiltShiftPass = new EffectPass(camera, tiltShiftEffect)
    composer.addPass(tiltShiftPass)

    // ============================================
    // Text Overlay Setup
    // ============================================
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

    const textOverlay = pixelText.create({
      text: 'MAKE\nFUN',
      colorStart: 0xff6b6b,
      colorEnd: 0x4ecdc4,
      fontSize: 0.4,
      depth: 0.2,
      depthLayers: 16,
      onSnapBack: (dirX, dirY) => {
        const centerRow = Math.floor(GRID_SIZE / 2)
        const centerCol = Math.floor(GRID_SIZE / 2)
        const offsetAmount = Math.floor(GRID_SIZE * 0.4)
        const targetRow = Math.round(centerRow + dirY * offsetAmount)
        const targetCol = Math.round(centerCol + dirX * offsetAmount)
        const clampedRow = Math.max(0, Math.min(GRID_SIZE - 1, targetRow))
        const clampedCol = Math.max(0, Math.min(GRID_SIZE - 1, targetCol))

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

    // Scroll-based zoom state
    let scrollProgress = 0
    let targetScrollProgress = 0
    const SCROLL_RANGE = window.innerHeight

    // Materialization state - starts dissipated, materializes on load
    let materializeProgress = 0 // 0 = dissipated, 1 = fully materialized
    let isMaterializing = false
    const MATERIALIZE_DELAY = 500 // ms before starting materialization
    const materializeStartTime = performance.now() + MATERIALIZE_DELAY

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
        const renderTarget = new THREE.WebGLRenderTarget(RENDER_TARGET_SIZE, RENDER_TARGET_SIZE, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
        })

        const scene3d = slide.createScene()

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
          const uMin = col / GRID_SIZE
          const uMax = (col + 1) / GRID_SIZE
          const vMin = row / GRID_SIZE
          const vMax = (row + 1) / GRID_SIZE

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
      const centerOffset = GRID_EXTENT / 2
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
      const dragDistance = Math.sqrt(
        Math.pow(event.clientX - clickStartX, 2) + Math.pow(event.clientY - clickStartY, 2),
      )
      if (dragDistance > 10) return

      const rect = container.getBoundingClientRect()
      clickMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      clickMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

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
          isMaterializing = true
          // Smooth materialization over time
          materializeProgress = Math.min(1, materializeProgress + deltaTime * 1.2)
        }
      }

      // Death animation for pixelText when scrolled past threshold
      // Only apply scroll-based death after materialization is complete
      const SCROLL_DEATH_THRESHOLD = 0.4
      const shouldDie = materializeProgress >= 1 && scrollProgress >= SCROLL_DEATH_THRESHOLD

      // Calculate effective pixelation based on materialization and death states
      let targetPixelation: number
      if (materializeProgress < 1) {
        // During materialization: go from 1 (dissipated) to 0 (solid)
        targetPixelation = 1 - materializeProgress
      } else {
        // After materialization: normal scroll-based death
        targetPixelation = shouldDie ? 1 : 0
      }

      // Track death progress (0 = alive, 1 = fully dead)
      const currentPixelation = blurMaterial.uniforms.pixelation.value
      const newPixelation = currentPixelation + (targetPixelation - currentPixelation) * 0.06

      blurMaterial.uniforms.pixelation.value = newPixelation

      // Vibration: peaks in first half of death/materialization
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

      // CodeRain just fades (for now, focusing on pixelText)
      // @ts-ignore
      if (codeRainOverlay.setOpacity) {
        // @ts-ignore
        codeRainOverlay.setOpacity(fadeOpacity)
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
      const currentTiltShift = SLIDES[currentSlideIndex].tiltShift || defaultTiltShift
      tiltShiftEffect.offset = mouseY * 0.3
      tiltShiftEffect.rotation = mouseX * 0.5
      tiltShiftEffect.focusArea = currentTiltShift.focusArea
      tiltShiftEffect.feather = currentTiltShift.feather
      // tiltShiftEffect.blur = currentTiltShift.blur

      // Update and render all animated 3D slides
      for (const animSlide of animatedSlides) {
        animSlide.scene3d.update(deltaTime)

        if (animSlide.scene3d.render) {
          animSlide.scene3d.render(renderer, animSlide.renderTarget)
        } else {
          renderer.setRenderTarget(animSlide.renderTarget)
          renderer.render(animSlide.scene3d.scene, animSlide.scene3d.camera)
          renderer.setRenderTarget(null)
        }
      }

      // Process hybrid wave-chaos effects
      processWaves(activeHybridWaves, cubeDataList, currentTime)

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

      // Render text overlay on top with blur
      textOverlay.update(deltaTime)

      renderer.setRenderTarget(textRenderTarget)
      renderer.setClearColor(0x000000, 0)
      renderer.clear()
      renderer.render(textOverlay.scene, textOverlay.camera)
      renderer.setRenderTarget(null)

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
      codeRainOverlay.dispose()
      textRenderTarget.dispose()
      blurMaterial.dispose()
      blurQuad.geometry.dispose()
      composer.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div style={{ paddingTop: '100vh' }}>
      <div
        ref={containerRef}
        style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}
      />
    </div>
  )
}
