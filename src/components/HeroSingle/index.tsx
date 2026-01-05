'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
// @ts-ignore
import { Text } from 'troika-three-text'

import type { Media } from '@/payload-types'

interface HeroSingleProps {
  title: string
  heroImage?: Media | number | null
  thumbnail?: Media | number | null
  height?: string
  titleBottomOffset?: string // e.g. '2rem', '48px' - offset from bottom of hero
}

// Helper to convert rem string to pixels
const remToPx = (remStr: string): number => {
  const remValue = parseFloat(remStr)
  return remValue * 16
}

// Helper to parse CSS unit string to pixels
const cssUnitToPx = (value: string): number => {
  const numValue = parseFloat(value)
  if (value.endsWith('rem')) {
    return numValue * 16
  } else if (value.endsWith('em')) {
    return numValue * 16 // Approximation, assumes 16px base
  } else if (value.endsWith('px')) {
    return numValue
  } else if (value.endsWith('vh')) {
    return (numValue / 100) * window.innerHeight
  }
  // Default to pixels if no unit
  return numValue
}

// Get the active breakpoint key based on viewport width
const getActiveBreakpoint = (viewportWidth: number, screens: { [key: string]: string }): string => {
  const breakpoints = Object.entries(screens)
    .map(([key, value]) => ({ key, width: remToPx(value) }))
    .sort((a, b) => b.width - a.width)

  for (const bp of breakpoints) {
    if (viewportWidth >= bp.width) {
      return bp.key
    }
  }

  return 'DEFAULT'
}

// Get font size in pixels for the current breakpoint
const getFontSizeForBreakpoint = (
  viewportWidth: number,
  screens: { [key: string]: string },
  fontSizeBreakpoints: { [key: string]: string },
  defaultFontSizePx = 32,
): number => {
  const activeBreakpoint = getActiveBreakpoint(viewportWidth, screens)
  const fontSizeStr = fontSizeBreakpoints[activeBreakpoint] || fontSizeBreakpoints['DEFAULT']

  if (!fontSizeStr) return defaultFontSizePx

  return remToPx(fontSizeStr)
}

// Calculate container left margin based on Tailwind config
const calculateContainerLeftMargin = (
  viewportWidth: number,
  screens: { [key: string]: string },
  padding: { [key: string]: string },
  fallbackMargin = 0.05,
): number => {
  const breakpoints = Object.entries(screens)
    .map(([key, value]) => ({ key, width: remToPx(value) }))
    .sort((a, b) => b.width - a.width)

  let activeBreakpoint = 'DEFAULT'
  for (const bp of breakpoints) {
    if (viewportWidth >= bp.width) {
      activeBreakpoint = bp.key
      break
    }
  }

  const paddingValue = padding[activeBreakpoint] || padding['DEFAULT'] || '1rem'
  const paddingPx = remToPx(paddingValue)

  const maxWidthStr = screens[activeBreakpoint]
  if (!maxWidthStr) {
    return paddingPx
  }

  const maxWidthPx = remToPx(maxWidthStr)

  if (viewportWidth <= maxWidthPx) {
    return paddingPx
  }

  return (viewportWidth - maxWidthPx) / 2 + paddingPx
}

// Tailwind container config
const tailwindScreens = {
  sm: '40rem',
  md: '48rem',
  lg: '64rem',
  xl: '80rem',
  '2xl': '86rem',
}

const tailwindPadding = {
  DEFAULT: '1rem',
  sm: '1rem',
  md: '2rem',
  lg: '2rem',
  xl: '2rem',
  '2xl': '2rem',
}

const fontSizeBreakpoints = {
  DEFAULT: '2rem',
  sm: '2.5rem',
  md: '3rem',
  lg: '4rem',
  xl: '5rem',
  '2xl': '5rem',
}

// max-w-single from tailwind config
const MAX_W_SINGLE_PX = 50 * 16 // 50rem = 800px

// Calculate left margin for content constrained by max-w-single inside container
const calculateContentLeftMargin = (viewportWidth: number): number => {
  // First get the container's left edge (margin + padding)
  const containerMargin = calculateContainerLeftMargin(
    viewportWidth,
    tailwindScreens,
    tailwindPadding,
    0.05,
  )

  // Get the container's inner width
  const breakpoints = Object.entries(tailwindScreens)
    .map(([key, value]) => ({ key, width: remToPx(value) }))
    .sort((a, b) => b.width - a.width)

  let activeBreakpoint = 'DEFAULT'
  for (const bp of breakpoints) {
    if (viewportWidth >= bp.width) {
      activeBreakpoint = bp.key
      break
    }
  }

  const maxWidthStr = tailwindScreens[activeBreakpoint as keyof typeof tailwindScreens]
  let containerInnerWidth: number

  if (!maxWidthStr || viewportWidth <= remToPx(maxWidthStr)) {
    // Below breakpoint - container is full width minus padding
    const paddingValue =
      tailwindPadding[activeBreakpoint as keyof typeof tailwindPadding] ||
      tailwindPadding['DEFAULT']
    containerInnerWidth = viewportWidth - 2 * remToPx(paddingValue)
  } else {
    // Above breakpoint - container is capped at max-width
    containerInnerWidth = remToPx(maxWidthStr)
  }

  // If content is constrained by max-w-single and container is wider
  if (containerInnerWidth > MAX_W_SINGLE_PX) {
    // Content is centered within container, so add half the difference
    const extraMargin = (containerInnerWidth - MAX_W_SINGLE_PX) / 2
    return containerMargin + extraMargin
  }

  // Content fills the container
  return containerMargin
}

const GRADIENT_LOOP_DURATION = 10000 // ms for one full rotation

export const HeroSingle: React.FC<HeroSingleProps> = ({
  title,
  heroImage,
  thumbnail,
  height = '60vh',
  titleBottomOffset = '2rem',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    // Camera setup - narrower FOV to reduce perspective distortion
    const camera = new THREE.PerspectiveCamera(
      35,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    )
    camera.position.set(0, 0, 12)
    camera.lookAt(0, 0, 0)

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.NoToneMapping
    // Use LinearSRGBColorSpace to output colors as-is without gamma correction
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    container.appendChild(renderer.domElement)

    // Track state
    let currentViewportWidth = container.clientWidth
    let currentViewportHeight = container.clientHeight
    let elapsedTime = 0
    let scrollProgress = 0

    // Calculate visible dimensions at a given z-plane (default z=-2 where content is)
    const getVisibleDimensions = (
      aspect: number,
      atZ: number = -2,
    ): { visibleWidth: number; visibleHeight: number } => {
      const distance = camera.position.z - atZ // Distance from camera to the z-plane
      const vFov = (camera.fov * Math.PI) / 180
      const visibleHeight = 2 * Math.tan(vFov / 2) * distance
      const visibleWidth = visibleHeight * aspect
      return { visibleWidth, visibleHeight }
    }

    // ============================================
    // Background Image
    // ============================================
    let backgroundMesh: THREE.Mesh | null = null
    const heroImageUrl = typeof heroImage === 'object' && heroImage?.url ? heroImage.url : null

    if (heroImageUrl) {
      // Load texture using Image element like react-3d-slideshow example
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const texture = new THREE.Texture(img)
        texture.needsUpdate = true
        // Don't set colorSpace - ShaderMaterial reads texture raw, and we output directly
        // Setting SRGB here + SRGB output would cause double gamma correction (darkening)

        // Create shader material for object-cover + zoom + blur effect (no lighting)
        const bgMaterial = new THREE.ShaderMaterial({
          uniforms: {
            map: { value: texture },
            zoom: { value: 1.0 },
            blurAmount: { value: 0.0 },
            imageAspect: { value: texture.image.width / texture.image.height },
            containerAspect: { value: container.clientWidth / container.clientHeight },
            resolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform sampler2D map;
            uniform float zoom;
            uniform float blurAmount;
            uniform float imageAspect;
            uniform float containerAspect;
            uniform vec2 resolution;
            varying vec2 vUv;

            vec2 transformUV(vec2 uv) {
              // Center the UV
              uv -= 0.5;

              // Apply zoom (zoom > 1 means zoomed in)
              uv /= zoom;

              // Object-cover: scale image to cover container, cropping as needed
              if (containerAspect > imageAspect) {
                uv.y *= imageAspect / containerAspect;
              } else {
                uv.x *= containerAspect / imageAspect;
              }

              // Re-center
              uv += 0.5;

              return clamp(uv, 0.0, 1.0);
            }

            void main() {
              vec2 uv = transformUV(vUv);

              if (blurAmount <= 0.0) {
                gl_FragColor = texture2D(map, uv);
                return;
              }

              // Gaussian-like blur with 9 samples
              vec4 color = vec4(0.0);
              vec2 texelSize = 1.0 / resolution;
              float blur = blurAmount * 0.5; // Scale blur amount

              // 3x3 kernel with weights approximating Gaussian
              float kernel[9];
              kernel[0] = 0.0625; kernel[1] = 0.125; kernel[2] = 0.0625;
              kernel[3] = 0.125;  kernel[4] = 0.25;  kernel[5] = 0.125;
              kernel[6] = 0.0625; kernel[7] = 0.125; kernel[8] = 0.0625;

              vec2 offsets[9];
              offsets[0] = vec2(-1.0, -1.0); offsets[1] = vec2(0.0, -1.0); offsets[2] = vec2(1.0, -1.0);
              offsets[3] = vec2(-1.0, 0.0);  offsets[4] = vec2(0.0, 0.0);  offsets[5] = vec2(1.0, 0.0);
              offsets[6] = vec2(-1.0, 1.0);  offsets[7] = vec2(0.0, 1.0);  offsets[8] = vec2(1.0, 1.0);

              for (int i = 0; i < 9; i++) {
                vec2 sampleUV = transformUV(vUv + offsets[i] * texelSize * blur);
                color += texture2D(map, sampleUV) * kernel[i];
              }

              gl_FragColor = color;
            }
          `,
          depthWrite: false,
          toneMapped: false,
        })

        const { visibleWidth, visibleHeight } = getVisibleDimensions(
          container.clientWidth / container.clientHeight,
          -4, // Background is at z=-4
        )
        const bgGeometry = new THREE.PlaneGeometry(visibleWidth * 2, visibleHeight * 2)
        backgroundMesh = new THREE.Mesh(bgGeometry, bgMaterial)
        backgroundMesh.position.z = -4
        scene.add(backgroundMesh)
      }
      img.src = heroImageUrl
    }

    // ============================================
    // Thumbnail Coin (cylinder with textured caps)
    // ============================================
    let thumbnailGroup: THREE.Group | null = null
    let thumbnailCylinder: THREE.Mesh | null = null
    let frontCap: THREE.Mesh | null = null
    let backCap: THREE.Mesh | null = null
    const thumbnailUrl = typeof thumbnail === 'object' && thumbnail?.url ? thumbnail.url : null

    // Helper to get dominant color from image
    const getDominantColor = (img: HTMLImageElement): number => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return 0x333333

      // Sample at a smaller size for performance
      const sampleSize = 50
      canvas.width = sampleSize
      canvas.height = sampleSize
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize)

      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
      const data = imageData.data

      // Count colors (simplified - bucket by rounding to nearest 16)
      const colorCounts: { [key: string]: number } = {}
      let maxCount = 0
      let dominantColor = { r: 51, g: 51, b: 51 } // Default gray

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const a = data[i + 3]

        // Skip transparent or near-transparent pixels
        if (a < 128) continue

        // Skip very dark or very light pixels (likely background)
        const brightness = (r + g + b) / 3
        if (brightness < 30 || brightness > 240) continue

        // Bucket colors
        const key = `${Math.round(r / 16) * 16},${Math.round(g / 16) * 16},${Math.round(b / 16) * 16}`
        colorCounts[key] = (colorCounts[key] || 0) + 1

        if (colorCounts[key] > maxCount) {
          maxCount = colorCounts[key]
          dominantColor = { r, g, b }
        }
      }

      return (dominantColor.r << 16) | (dominantColor.g << 8) | dominantColor.b
    }

    if (thumbnailUrl) {
      const thumbImg = new Image()
      thumbImg.crossOrigin = 'anonymous'
      thumbImg.onload = () => {
        const texture = new THREE.Texture(thumbImg)
        texture.needsUpdate = true

        // Get dominant color for edge
        const edgeColor = getDominantColor(thumbImg)

        // Target size in pixels
        const targetSizePx = 150
        const { visibleWidth } = getVisibleDimensions(
          container.clientWidth / container.clientHeight,
        )
        const radius = (targetSizePx / 2 / container.clientWidth) * visibleWidth
        const depth = radius * 0.3 // Coin thickness

        // Create a group to hold the coin parts
        thumbnailGroup = new THREE.Group()
        // Position will be set in animation loop to align with text

        // Cylinder for the edge (no caps - we'll add custom ones)
        // Use slightly smaller radius so edge sits behind the caps cleanly
        const edgeRadius = radius * 0.995
        const cylinderGeometry = new THREE.CylinderGeometry(
          edgeRadius,
          edgeRadius,
          depth,
          128, // high radial segments for smooth edge
          1,
          true, // open-ended (no caps)
        )
        const edgeMaterial = new THREE.MeshBasicMaterial({
          color: edgeColor,
          side: THREE.DoubleSide,
        })
        thumbnailCylinder = new THREE.Mesh(cylinderGeometry, edgeMaterial)
        // Rotate so the flat faces point towards/away from camera
        thumbnailCylinder.rotation.x = Math.PI / 2
        thumbnailGroup.add(thumbnailCylinder)

        // Front cap (facing camera) - use CircleGeometry for flat texture mapping
        const frontCapGeometry = new THREE.CircleGeometry(radius, 128)
        const frontCapMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.FrontSide,
        })
        frontCap = new THREE.Mesh(frontCapGeometry, frontCapMaterial)
        frontCap.position.z = depth / 2
        thumbnailGroup.add(frontCap)

        // Back cap (facing away) - use CircleGeometry for flat texture mapping
        const backCapGeometry = new THREE.CircleGeometry(radius, 128)
        const backCapMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.FrontSide,
        })
        backCap = new THREE.Mesh(backCapGeometry, backCapMaterial)
        backCap.position.z = -depth / 2
        backCap.rotation.y = Math.PI // Flip to face the other direction
        thumbnailGroup.add(backCap)

        scene.add(thumbnailGroup)
      }
      thumbImg.src = thumbnailUrl
    }

    // ============================================
    // PixelText Title (adapted from pixelText.ts)
    // ============================================
    const textGroup = new THREE.Group()
    scene.add(textGroup)

    const textMeshes: InstanceType<typeof Text>[] = []
    const colorStart = 0xff6b6b
    const colorEnd = 0x4ecdc4
    const depthLayers = 12
    const depth = 0.15
    const initialFontSize = 0.5

    // Resize text to fit viewport (defined before loop so it can be used in sync callback)
    const resizeTextToFit = (aspect: number) => {
      const { visibleWidth } = getVisibleDimensions(aspect)

      // Get font size for current breakpoint
      const fontSizePx = getFontSizeForBreakpoint(
        currentViewportWidth,
        tailwindScreens,
        fontSizeBreakpoints,
        32,
      )
      const fontSize = (fontSizePx / currentViewportWidth) * visibleWidth

      // Calculate available content width (viewport minus padding on both sides)
      const marginPx = calculateContentLeftMargin(currentViewportWidth)
      const availableWidthPx = currentViewportWidth - marginPx * 2

      // Use minimum of max-w-single and available width for text wrapping
      const maxWidthPx = Math.min(MAX_W_SINGLE_PX, availableWidthPx)
      const maxWidthWorld = (maxWidthPx / currentViewportWidth) * visibleWidth

      textGroup.scale.setScalar(1)

      for (const mesh of textMeshes) {
        mesh.fontSize = fontSize
        mesh.maxWidth = maxWidthWorld
        mesh.sync()
      }

      // Calculate left margin position (aligned with max-w-single content)
      const marginLeftWorld = (marginPx / currentViewportWidth) * visibleWidth

      textGroup.position.x = -visibleWidth / 2 + marginLeftWorld
      // Push text back in z-space for more depth
      textGroup.position.z = -2

      // Position text from bottom of viewport
      const { visibleHeight } = getVisibleDimensions(aspect)
      const bottomOffsetPx = cssUnitToPx(titleBottomOffset)
      const bottomOffsetWorld = (bottomOffsetPx / currentViewportHeight) * visibleHeight
      textGroup.position.y = -visibleHeight / 2 + bottomOffsetWorld
    }

    // Create text layers
    for (let i = 0; i < depthLayers; i++) {
      const layerZ = -i * (depth / depthLayers)
      const isFront = i === 0

      const textMesh = new Text()
      textMesh.text = title.toUpperCase()
      textMesh.font =
        'https://raw.githubusercontent.com/google/fonts/main/ofl/pressstart2p/PressStart2P-Regular.ttf'
      textMesh.fontSize = initialFontSize
      textMesh.anchorX = 'left'
      textMesh.anchorY = 'bottom'
      textMesh.textAlign = 'left'
      textMesh.position.z = layerZ

      if (isFront) {
        // Front face - animated gradient
        textMesh.material = new THREE.ShaderMaterial({
          uniforms: {
            colorStart: { value: new THREE.Color(colorStart) },
            colorEnd: { value: new THREE.Color(colorEnd) },
            time: { value: 0 },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 colorStart;
            uniform vec3 colorEnd;
            uniform float time;
            varying vec2 vUv;

            void main() {
              float t = vUv.x + sin(time * 2.0) * 0.2;
              vec3 color = mix(colorStart, colorEnd, t);
              gl_FragColor = vec4(color, 1.0);
            }
          `,
        })
      } else {
        // Back layers - darker color for depth
        const layerProgress = i / (depthLayers - 1)
        const darkColor = new THREE.Color(colorStart).multiplyScalar(0.3 - layerProgress * 0.2)
        textMesh.material = new THREE.MeshBasicMaterial({ color: darkColor })
      }

      // On front mesh sync, trigger initial sizing
      if (isFront) {
        textMesh.sync(() => {
          resizeTextToFit(container.clientWidth / container.clientHeight)
        })
      } else {
        textMesh.sync()
      }
      textGroup.add(textMesh)
      textMeshes.push(textMesh)
    }

    // ============================================
    // Handle Resize
    // ============================================
    const handleResize = () => {
      if (!container) return
      const width = container.clientWidth
      const height = container.clientHeight
      const aspect = width / height

      currentViewportWidth = width
      currentViewportHeight = height

      camera.aspect = aspect
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)

      // Resize text
      resizeTextToFit(aspect)

      // Resize background (at z=-4)
      if (backgroundMesh) {
        const { visibleWidth, visibleHeight } = getVisibleDimensions(aspect, -4)
        backgroundMesh.geometry.dispose()
        backgroundMesh.geometry = new THREE.PlaneGeometry(visibleWidth * 2, visibleHeight * 2)
        const bgMat = backgroundMesh.material as THREE.ShaderMaterial
        bgMat.uniforms.containerAspect.value = aspect
      }

      // Resize thumbnail coin
      const { visibleWidth: vw } = getVisibleDimensions(aspect)
      if (thumbnailGroup && thumbnailCylinder && frontCap && backCap) {
        const targetSizePx = 150
        const newRadius = (targetSizePx / 2 / width) * vw
        const newEdgeRadius = newRadius * 0.995
        const newDepth = newRadius * 0.3

        // Recreate geometries with new radius
        thumbnailCylinder.geometry.dispose()
        thumbnailCylinder.geometry = new THREE.CylinderGeometry(
          newEdgeRadius,
          newEdgeRadius,
          newDepth,
          128,
          1,
          true,
        )

        frontCap.geometry.dispose()
        frontCap.geometry = new THREE.CircleGeometry(newRadius, 128)
        frontCap.position.z = newDepth / 2

        backCap.geometry.dispose()
        backCap.geometry = new THREE.CircleGeometry(newRadius, 128)
        backCap.position.z = -newDepth / 2
      }
    }
    window.addEventListener('resize', handleResize)

    // ============================================
    // Handle Scroll (for background zoom)
    // ============================================
    const handleScroll = () => {
      const scrollY = window.scrollY
      const heroHeight = container.clientHeight
      scrollProgress = Math.min(1, Math.max(0, scrollY / heroHeight))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // ============================================
    // Animation Loop
    // ============================================
    let animationId: number
    let lastTime = performance.now() / 1000

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const currentTime = performance.now() / 1000
      const deltaTime = currentTime - lastTime
      lastTime = currentTime
      elapsedTime += deltaTime

      // Update text shader time
      const frontTextMesh = textMeshes[0]
      if (frontTextMesh) {
        const material = frontTextMesh.material as THREE.ShaderMaterial
        if (material.uniforms) {
          material.uniforms.time.value = elapsedTime
        }
      }

      // Subtle oscillating rotation for text
      textGroup.rotation.y = Math.sin(elapsedTime * 0.3) * 0.08

      // Update text vertical position based on scroll (move up as scrolling down)
      const aspect = currentViewportWidth / currentViewportHeight
      const { visibleHeight } = getVisibleDimensions(aspect)
      const bottomOffsetPx = cssUnitToPx(titleBottomOffset)
      const bottomOffsetWorld = (bottomOffsetPx / currentViewportHeight) * visibleHeight
      // Add scroll-based offset: move up by up to 30% of visible height as we scroll
      const scrollOffsetWorld = scrollProgress * visibleHeight * 1
      textGroup.position.y = -visibleHeight / 2 + bottomOffsetWorld + scrollOffsetWorld

      // Update background zoom and blur based on scroll (but keep position fixed)
      if (backgroundMesh) {
        const bgMat = backgroundMesh.material as THREE.ShaderMaterial
        // Zoom from 1.0 to 1.3 as we scroll
        bgMat.uniforms.zoom.value = 1.0 + scrollProgress * 0.3
        // Blur from 0 to 20 as we scroll (scaled in shader)
        bgMat.uniforms.blurAmount.value = scrollProgress * 20
        // Ensure background stays at y = 0 (fixed position)
        backgroundMesh.position.set(0, 0, -4)
      }

      // Ensure camera stays fixed
      camera.position.set(0, 0, 12)

      // Animate thumbnail coin rotation and position (aligned to left of text)
      if (thumbnailGroup) {
        // Only rotate around Y axis (spin like a coin), no X tilt
        thumbnailGroup.rotation.y = elapsedTime * 0.5
        thumbnailGroup.rotation.x = 0

        // Calculate thumbnail radius (same as in creation and resize)
        const targetSizePx = 150
        const { visibleWidth } = getVisibleDimensions(aspect)
        const thumbnailRadius = (targetSizePx / 2 / currentViewportWidth) * visibleWidth

        // Align X to left of text - position thumbnail so its right edge is at the text's left edge
        // Add a larger gap between thumbnail and text
        const gapPx = 48 // 48px gap between thumbnail and text
        const gapWorld = (gapPx / currentViewportWidth) * visibleWidth
        const marginPx = calculateContentLeftMargin(currentViewportWidth)
        const marginLeftWorld = (marginPx / currentViewportWidth) * visibleWidth
        const textLeftEdge = -visibleWidth / 2 + marginLeftWorld
        thumbnailGroup.position.x = textLeftEdge - thumbnailRadius - gapWorld

        // Align Y to be vertically centered with the entire text block
        // Text anchor is at bottom-left, so we need to calculate total text height
        const fontSizePx = getFontSizeForBreakpoint(
          currentViewportWidth,
          tailwindScreens,
          fontSizeBreakpoints,
          32,
        )
        const fontSizeWorld = (fontSizePx / currentViewportWidth) * visibleWidth

        // Get actual text bounds from the front text mesh if available
        const frontTextMesh = textMeshes[0]
        let textHeight = fontSizeWorld * 2 // Default to 2 lines
        if (frontTextMesh && frontTextMesh.textRenderInfo) {
          const bounds = frontTextMesh.textRenderInfo.blockBounds
          if (bounds) {
            // blockBounds is [minX, minY, maxX, maxY] in local units
            textHeight = bounds[3] - bounds[1]
          }
        }

        // Text bottom edge is at bottomOffsetWorld from viewport bottom
        // Text center is at bottomOffsetWorld + textHeight/2
        const textCenterY = -visibleHeight / 2 + bottomOffsetWorld + textHeight / 2
        const thumbnailScrollOffset = scrollProgress * visibleHeight * 1
        thumbnailGroup.position.y = textCenterY + thumbnailScrollOffset

        // Push thumbnail back to same z-plane as text
        thumbnailGroup.position.z = -2
      }

      renderer.render(scene, camera)
    }
    animate()

    // ============================================
    // Cleanup
    // ============================================
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(animationId)

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }

      textMeshes.forEach((mesh) => mesh.dispose())

      if (backgroundMesh) {
        backgroundMesh.geometry.dispose()
        ;(backgroundMesh.material as THREE.Material).dispose()
      }

      if (thumbnailCylinder) {
        thumbnailCylinder.geometry.dispose()
        ;(thumbnailCylinder.material as THREE.Material).dispose()
      }
      if (frontCap) {
        frontCap.geometry.dispose()
        ;(frontCap.material as THREE.Material).dispose()
      }
      if (backCap) {
        backCap.geometry.dispose()
        ;(backCap.material as THREE.Material).dispose()
      }

      renderer.dispose()
    }
  }, [title, heroImage, thumbnail, titleBottomOffset])

  // Gradient overlay animation (CSS-based like WindowReveal)
  useEffect(() => {
    if (!overlayRef.current) return

    let animationId: number

    const animateGradient = (currentTime: number) => {
      if (overlayRef.current) {
        const progress = (currentTime % GRADIENT_LOOP_DURATION) / GRADIENT_LOOP_DURATION
        const currentAngle = 135 + progress * 360

        overlayRef.current.style.background = `linear-gradient(${currentAngle}deg, rgba(255, 107, 107, 0.55), rgba(78, 205, 196, 0.5))`
      }

      animationId = requestAnimationFrame(animateGradient)
    }

    animationId = requestAnimationFrame(animateGradient)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: height,
          zIndex: 0,
        }}
      />
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: height,
          zIndex: 1,
          mixBlendMode: 'hard-light',
          pointerEvents: 'none',
        }}
      />
      {/* Noise overlay layer - on top of everything for visible grain */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: height,
          zIndex: 2,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          className="noise-overlay-clipped"
          style={{
            opacity: 0.25,
          }}
        />
      </div>
    </>
  )
}
