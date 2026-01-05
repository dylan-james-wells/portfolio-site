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
}

// Helper to convert rem string to pixels
const remToPx = (remStr: string): number => {
  const remValue = parseFloat(remStr)
  return remValue * 16
}

// Get the active breakpoint key based on viewport width
const getActiveBreakpoint = (
  viewportWidth: number,
  screens: { [key: string]: string },
): string => {
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

export const HeroSingle: React.FC<HeroSingleProps> = ({
  title,
  heroImage,
  thumbnail,
  height = '60vh',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    // Camera setup - perspective for 3D text effect
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 5)
    camera.lookAt(0, 0, 0)

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Track state
    let currentViewportWidth = container.clientWidth
    let currentViewportHeight = container.clientHeight
    let elapsedTime = 0
    let scrollProgress = 0

    // Calculate visible dimensions at z=0
    const getVisibleDimensions = (aspect: number): { visibleWidth: number; visibleHeight: number } => {
      const distance = camera.position.z
      const vFov = (camera.fov * Math.PI) / 180
      const visibleHeight = 2 * Math.tan(vFov / 2) * distance
      const visibleWidth = visibleHeight * aspect
      return { visibleWidth, visibleHeight }
    }

    // ============================================
    // Background Image
    // ============================================
    let backgroundMesh: THREE.Mesh | null = null
    const textureLoader = new THREE.TextureLoader()

    const heroImageUrl = typeof heroImage === 'object' && heroImage?.url ? heroImage.url : null

    if (heroImageUrl) {
      textureLoader.load(heroImageUrl, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace

        // Create shader material for object-cover + zoom effect
        const bgMaterial = new THREE.ShaderMaterial({
          uniforms: {
            map: { value: texture },
            zoom: { value: 1.0 },
            imageAspect: { value: texture.image.width / texture.image.height },
            containerAspect: { value: container.clientWidth / container.clientHeight },
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
            uniform float imageAspect;
            uniform float containerAspect;
            varying vec2 vUv;

            void main() {
              vec2 uv = vUv;

              // Center the UV
              uv -= 0.5;

              // Apply zoom (zoom > 1 means zoomed in)
              uv /= zoom;

              // Object-cover: scale image to cover container, cropping as needed
              // We need to shrink UV space so image covers the container
              if (containerAspect > imageAspect) {
                // Container is wider than image - scale by width, crop height
                uv.y *= imageAspect / containerAspect;
              } else {
                // Container is taller than image - scale by height, crop width
                uv.x *= containerAspect / imageAspect;
              }

              // Re-center
              uv += 0.5;

              // Clamp to avoid edge artifacts
              uv = clamp(uv, 0.0, 1.0);

              gl_FragColor = texture2D(map, uv);
            }
          `,
          depthWrite: false,
        })

        const { visibleWidth, visibleHeight } = getVisibleDimensions(container.clientWidth / container.clientHeight)
        const bgGeometry = new THREE.PlaneGeometry(visibleWidth * 2, visibleHeight * 2)
        backgroundMesh = new THREE.Mesh(bgGeometry, bgMaterial)
        backgroundMesh.position.z = -2
        scene.add(backgroundMesh)
      })
    }

    // ============================================
    // Thumbnail (centered, behind text)
    // ============================================
    let thumbnailMesh: THREE.Mesh | null = null
    const thumbnailUrl = typeof thumbnail === 'object' && thumbnail?.url ? thumbnail.url : null

    if (thumbnailUrl) {
      textureLoader.load(thumbnailUrl, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace

        const imgWidth = texture.image.width
        const imgHeight = texture.image.height
        const imgAspect = imgWidth / imgHeight

        // Target 150px square, object-fit contain
        const targetSizePx = 150
        const { visibleWidth } = getVisibleDimensions(container.clientWidth / container.clientHeight)
        const targetSizeWorld = (targetSizePx / container.clientWidth) * visibleWidth

        let planeWidth: number
        let planeHeight: number

        if (imgAspect > 1) {
          // Wide image
          planeWidth = targetSizeWorld
          planeHeight = targetSizeWorld / imgAspect
        } else {
          // Tall image
          planeHeight = targetSizeWorld
          planeWidth = targetSizeWorld * imgAspect
        }

        const thumbGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
        const thumbMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
        })

        thumbnailMesh = new THREE.Mesh(thumbGeometry, thumbMaterial)
        thumbnailMesh.position.z = -0.5
        scene.add(thumbnailMesh)
      })
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

      textGroup.scale.setScalar(1)

      for (const mesh of textMeshes) {
        mesh.fontSize = fontSize
        mesh.sync()
      }

      // Calculate left margin position (aligned with container)
      const marginPx = calculateContainerLeftMargin(
        currentViewportWidth,
        tailwindScreens,
        tailwindPadding,
        0.05,
      )
      const marginLeftWorld = (marginPx / currentViewportWidth) * visibleWidth

      textGroup.position.x = -visibleWidth / 2 + marginLeftWorld
    }

    // Create text layers
    for (let i = 0; i < depthLayers; i++) {
      const layerZ = -i * (depth / depthLayers)
      const isFront = i === 0

      const textMesh = new Text()
      textMesh.text = title.toUpperCase()
      textMesh.font = 'https://raw.githubusercontent.com/google/fonts/main/ofl/pressstart2p/PressStart2P-Regular.ttf'
      textMesh.fontSize = initialFontSize
      textMesh.anchorX = 'left'
      textMesh.anchorY = 'middle'
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
    // Gradient Overlay (spinning)
    // ============================================
    const gradientMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
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
        uniform float time;
        varying vec2 vUv;

        void main() {
          // Rotate UV around center
          vec2 centeredUv = vUv - 0.5;
          float angle = time * 0.628318; // 2*PI / 10 seconds
          float cosA = cos(angle);
          float sinA = sin(angle);
          vec2 rotatedUv = vec2(
            centeredUv.x * cosA - centeredUv.y * sinA,
            centeredUv.x * sinA + centeredUv.y * cosA
          );
          rotatedUv += 0.5;

          // Gradient from pink-red to teal
          vec3 color1 = vec3(1.0, 0.42, 0.42); // rgba(255, 107, 107)
          vec3 color2 = vec3(0.306, 0.804, 0.769); // rgba(78, 205, 196)

          // Diagonal gradient based on rotated position
          float t = (rotatedUv.x + rotatedUv.y) * 0.5;
          vec3 color = mix(color1, color2, t);

          // Apply opacity (0.5-0.55 range)
          float alpha = 0.5;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const { visibleWidth: initVisibleWidth, visibleHeight: initVisibleHeight } = getVisibleDimensions(
      container.clientWidth / container.clientHeight,
    )
    const gradientGeometry = new THREE.PlaneGeometry(initVisibleWidth * 2, initVisibleHeight * 2)
    const gradientMesh = new THREE.Mesh(gradientGeometry, gradientMaterial)
    gradientMesh.position.z = 1
    scene.add(gradientMesh)

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

      // Resize background
      if (backgroundMesh) {
        const { visibleWidth, visibleHeight } = getVisibleDimensions(aspect)
        backgroundMesh.geometry.dispose()
        backgroundMesh.geometry = new THREE.PlaneGeometry(visibleWidth * 2, visibleHeight * 2)
        const bgMat = backgroundMesh.material as THREE.ShaderMaterial
        bgMat.uniforms.containerAspect.value = aspect
      }

      // Resize gradient overlay
      const { visibleWidth: vw, visibleHeight: vh } = getVisibleDimensions(aspect)
      gradientMesh.geometry.dispose()
      gradientMesh.geometry = new THREE.PlaneGeometry(vw * 2, vh * 2)

      // Resize thumbnail
      if (thumbnailMesh && thumbnail && typeof thumbnail === 'object' && thumbnail.url) {
        const imgAspect = (thumbnail.width || 1) / (thumbnail.height || 1)
        const targetSizePx = 150
        const targetSizeWorld = (targetSizePx / width) * vw

        let planeWidth: number
        let planeHeight: number

        if (imgAspect > 1) {
          planeWidth = targetSizeWorld
          planeHeight = targetSizeWorld / imgAspect
        } else {
          planeHeight = targetSizeWorld
          planeWidth = targetSizeWorld * imgAspect
        }

        thumbnailMesh.geometry.dispose()
        thumbnailMesh.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
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

      // Update gradient rotation
      gradientMaterial.uniforms.time.value = elapsedTime

      // Update background zoom based on scroll
      if (backgroundMesh) {
        const bgMat = backgroundMesh.material as THREE.ShaderMaterial
        // Zoom from 1.0 to 1.3 as we scroll
        bgMat.uniforms.zoom.value = 1.0 + scrollProgress * 0.3
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
      gradientGeometry.dispose()
      gradientMaterial.dispose()

      if (backgroundMesh) {
        backgroundMesh.geometry.dispose()
        ;(backgroundMesh.material as THREE.Material).dispose()
      }

      if (thumbnailMesh) {
        thumbnailMesh.geometry.dispose()
        ;(thumbnailMesh.material as THREE.Material).dispose()
      }

      renderer.dispose()
    }
  }, [title, heroImage, thumbnail])

  return (
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
  )
}
