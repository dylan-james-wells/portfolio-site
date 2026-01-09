'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
// @ts-ignore
import { Text } from 'troika-three-text'
import Link from 'next/link'

import type { Media } from '@/payload-types'
import { GlitchHover } from '@/components/GlitchHover'
import { PyramidCubes } from '@/components/PyramidCubes'

interface HeroSingleProps {
  title: string
  heroImage?: Media | number | null
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
  // For screens below md breakpoint (768px), just use simple padding
  // This ensures 3D text matches the container padding on mobile
  const mdBreakpointPx = remToPx(tailwindScreens.md) // 768px

  if (viewportWidth < mdBreakpointPx) {
    // Below md: use DEFAULT padding (1rem = 16px)
    return remToPx(tailwindPadding['DEFAULT'])
  }

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

export const HeroSingle: React.FC<HeroSingleProps> = ({
  title,
  heroImage,
  height = '60vh',
  titleBottomOffset = '2rem',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Loading state for Three.js content
  const [isLoaded, setIsLoaded] = useState(false)
  const [showLoader, setShowLoader] = useState(true)

  // Scroll hide/show state for back button (same pattern as nav)
  const [isButtonVisible, setIsButtonVisible] = useState(true)
  // Start hidden, then slide in after mount + delay
  const [hasInitialized, setHasInitialized] = useState(false)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  // Handle scroll to hide/show back button
  const handleButtonScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY

        if (currentScrollY < 50) {
          // Always show button near top of page
          setIsButtonVisible(true)
        } else if (currentScrollY < lastScrollY.current) {
          // Scrolling up - show button
          setIsButtonVisible(true)
        } else if (currentScrollY > lastScrollY.current) {
          // Scrolling down - hide button
          setIsButtonVisible(false)
        }

        lastScrollY.current = currentScrollY
        ticking.current = false
      })
      ticking.current = true
    }
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleButtonScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleButtonScroll)
  }, [handleButtonScroll])

  // Initialize with slide-in animation after mount + delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasInitialized(true)
    }, 300) // 300ms delay after mount
    return () => clearTimeout(timer)
  }, [])

  // Hide loader after fade-out transition completes
  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => setShowLoader(false), 600)
      return () => clearTimeout(timer)
    }
  }, [isLoaded])

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
    // PixelText Title (adapted from pixelText.ts)
    // ============================================
    const textGroup = new THREE.Group()
    scene.add(textGroup)

    // Structure: lineGroups[lineIndex] contains { group, meshes[] } for each line
    const lineGroups: { group: THREE.Group; meshes: InstanceType<typeof Text>[] }[] = []
    const colorStart = 0xff6b6b
    const colorEnd = 0x4ecdc4
    const depthLayers = 12
    const depth = 0.15
    const initialFontSize = 0.5

    // Split title into lines: words with N+ letters get their own line,
    // shorter words are grouped together
    const splitTitleIntoLines = (titleText: string, minWordLength = 6): string[] => {
      const words = titleText.toUpperCase().split(/\s+/)
      const lines: string[] = []
      let currentGroup: string[] = []

      for (const word of words) {
        if (word.length >= minWordLength) {
          // If we have accumulated short words, push them as a line first
          if (currentGroup.length > 0) {
            lines.push(currentGroup.join(' '))
            currentGroup = []
          }
          // Long word gets its own line
          lines.push(word)
        } else {
          // Short word - accumulate with other short words
          currentGroup.push(word)
        }
      }

      // Don't forget remaining short words
      if (currentGroup.length > 0) {
        lines.push(currentGroup.join(' '))
      }

      return lines
    }

    const titleLines = splitTitleIntoLines(title)

    // Resize text to fit viewport - scale based on longest line width
    const resizeTextToFit = (aspect: number) => {
      const { visibleWidth, visibleHeight } = getVisibleDimensions(aspect)

      // Calculate available content width (viewport minus padding on both sides)
      const marginPx = calculateContentLeftMargin(currentViewportWidth)
      const availableWidthPx = currentViewportWidth - marginPx * 2
      const availableWidthWorld = (availableWidthPx / currentViewportWidth) * visibleWidth

      // Calculate left margin position
      const marginLeftWorld = (marginPx / currentViewportWidth) * visibleWidth

      // Position text from bottom of viewport
      const bottomOffsetPx = cssUnitToPx(titleBottomOffset)
      const bottomOffsetWorld = (bottomOffsetPx / currentViewportHeight) * visibleHeight

      // Base font size for measuring
      const baseFontSize = 0.5

      // First pass: find the longest line width to determine uniform scale
      let maxLineWidth = 0
      const lineWidths: number[] = []
      const lineHeights: number[] = []

      for (let lineIdx = 0; lineIdx < lineGroups.length; lineIdx++) {
        const { meshes } = lineGroups[lineIdx]
        const frontMesh = meshes[0]

        if (frontMesh && frontMesh.textRenderInfo) {
          const bounds = frontMesh.textRenderInfo.blockBounds
          const textWidth = bounds[2] - bounds[0]
          const textHeight = bounds[3] - bounds[1]

          lineWidths[lineIdx] = textWidth
          lineHeights[lineIdx] = textHeight

          if (textWidth > maxLineWidth) {
            maxLineWidth = textWidth
          }
        } else {
          lineWidths[lineIdx] = 0
          lineHeights[lineIdx] = baseFontSize
        }
      }

      // Calculate uniform scale based on longest line
      const uniformScale = maxLineWidth > 0 ? availableWidthWorld / maxLineWidth : 1

      // Calculate total height with uniform scale
      let totalHeight = 0
      for (const height of lineHeights) {
        totalHeight += height * uniformScale
      }

      // Second pass: position all lines with uniform scale
      let yOffset = bottomOffsetWorld + totalHeight

      for (let lineIdx = 0; lineIdx < lineGroups.length; lineIdx++) {
        const { group, meshes } = lineGroups[lineIdx]
        const lineHeight = lineHeights[lineIdx] * uniformScale

        // Position the line group
        group.position.x = -visibleWidth / 2 + marginLeftWorld
        group.position.z = -2

        // Position from top of text block going down
        yOffset -= lineHeight
        group.position.y = -visibleHeight / 2 + yOffset

        // Apply uniform scale to all line groups
        group.scale.setScalar(uniformScale)

        // Reset individual mesh font sizes (scaling is handled by group)
        for (const mesh of meshes) {
          mesh.fontSize = baseFontSize
        }
      }
    }

    // Create text meshes for each line
    for (let lineIdx = 0; lineIdx < titleLines.length; lineIdx++) {
      const lineText = titleLines[lineIdx]
      const lineGroup = new THREE.Group()
      textGroup.add(lineGroup)

      const lineMeshes: InstanceType<typeof Text>[] = []

      // Create depth layers for this line
      for (let i = 0; i < depthLayers; i++) {
        const layerZ = -i * (depth / depthLayers)
        const isFront = i === 0

        const textMesh = new Text()
        // Replace regular spaces with thin spaces (U+2009) for tighter word spacing
        textMesh.text = lineText.replace(/ /g, '\u2009')
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

        lineGroup.add(textMesh)
        lineMeshes.push(textMesh)
      }

      lineGroups.push({ group: lineGroup, meshes: lineMeshes })
    }

    // Sync all meshes and trigger initial sizing after all are ready
    let syncCount = 0
    const totalMeshes = titleLines.length * depthLayers

    for (const { meshes } of lineGroups) {
      for (const mesh of meshes) {
        mesh.sync(() => {
          syncCount++
          if (syncCount === totalMeshes) {
            resizeTextToFit(container.clientWidth / container.clientHeight)
            setIsLoaded(true)
          }
        })
      }
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

      // Update text shader time for all front meshes
      for (const { meshes } of lineGroups) {
        const frontMesh = meshes[0]
        if (frontMesh) {
          const material = frontMesh.material as THREE.ShaderMaterial
          if (material.uniforms) {
            material.uniforms.time.value = elapsedTime
          }
        }
      }

      // Subtle oscillating rotation for text
      textGroup.rotation.y = Math.sin(elapsedTime * 0.3) * 0.08

      // Update text vertical position based on scroll (move up as scrolling down)
      // Apply scroll offset to the parent textGroup - line positions are relative to this
      const aspect = currentViewportWidth / currentViewportHeight
      const { visibleHeight } = getVisibleDimensions(aspect)
      const scrollOffsetWorld = scrollProgress * visibleHeight * 1
      textGroup.position.y = scrollOffsetWorld

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

      lineGroups.forEach(({ meshes }) => meshes.forEach((mesh) => mesh.dispose()))

      if (backgroundMesh) {
        backgroundMesh.geometry.dispose()
        ;(backgroundMesh.material as THREE.Material).dispose()
      }

      renderer.dispose()
    }
  }, [title, heroImage, titleBottomOffset])


  return (
    <>
      {/* Loading animation - constrained to hero area */}
      {showLoader && (
        <div
          className="bg-noise-gradient-clipped overflow-hidden"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: height,
            zIndex: 5,
            opacity: isLoaded ? 0 : 1,
            transition: 'opacity 0.5s ease-out',
            pointerEvents: isLoaded ? 'none' : 'auto',
          }}
        >
          {/* Rotating gradient overlay */}
          <div className="loader-gradient-overlay" />
          <div className="noise-overlay-clipped" style={{ opacity: 0.15 }} />
          <div
            className="flex items-center justify-center"
            style={{ position: 'absolute', inset: 0 }}
          >
            <PyramidCubes />
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: height,
          zIndex: 0,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease-in',
        }}
      />
      <div
        className="loader-gradient-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: height,
          zIndex: 1,
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
            mixBlendMode: 'overlay',
          }}
        />
      </div>
      {/* Back to home button */}
      <div
        className="fixed top-0 left-0 right-0 z-20 container max-w-single pointer-events-none transition-transform duration-300 ease-out"
        style={{
          transform: hasInitialized && isButtonVisible ? 'translateY(0)' : 'translateY(-100%)',
        }}
      >
        <Link
          href="/"
          className="group border-t-0 relative hidden md:inline-flex items-center gap-2 text-white font-mono px-2 md:px-3 h-10 bg-noise-gradient border-2 border-white transition-colors pointer-events-auto"
        >
          <GlitchHover>
            <span className="inline-flex items-center gap-2">
              <span>←</span>
              <span>Home</span>
            </span>
          </GlitchHover>
        </Link>
      </div>
    </>
  )
}
