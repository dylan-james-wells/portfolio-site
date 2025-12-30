import * as THREE from 'three'
import { Text } from 'troika-three-text'
import type { Scene3D } from './types'

export interface PixelTextOptions {
  text?: string
  colorStart?: number
  colorEnd?: number
  backgroundColor?: number
  fontSize?: number
  depth?: number
  depthLayers?: number
  paddingPercent?: number // Percentage of viewport width to use as padding on each side (0-1)
}

export function create(options: PixelTextOptions = {}): Scene3D {
  const {
    text = 'HELLO\nWORLD',
    colorStart = 0xff6b6b,
    colorEnd = 0x4ecdc4,
    fontSize: initialFontSize = 0.5,
    depth = 0.15,
    depthLayers = 12,
    paddingPercent = 0.2, // 10% padding on each side
  } = options

  const scene = new THREE.Scene()
  // Transparent background for overlay mode
  scene.background = null

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 0, 5)
  camera.lookAt(0, 0, 0)

  // Create a group to hold all text layers
  const textGroup = new THREE.Group()
  scene.add(textGroup)

  // Store all text meshes for animation
  const textMeshes: InstanceType<typeof Text>[] = []

  // Track state for responsive sizing
  let currentAspect = 1
  let hasSizedText = false

  // Calculate visible width at z=0 based on camera FOV and aspect ratio
  const getVisibleWidth = (aspect: number): number => {
    const distance = camera.position.z
    const vFov = (camera.fov * Math.PI) / 180
    const visibleHeight = 2 * Math.tan(vFov / 2) * distance
    return visibleHeight * aspect
  }

  // Resize text to fit viewport
  const resizeTextToFit = (aspect: number) => {
    const frontMesh = textMeshes[0]
    if (!frontMesh || !frontMesh.textRenderInfo) return

    const bounds = frontMesh.textRenderInfo.blockBounds
    const textWidth = bounds[2] - bounds[0]
    if (textWidth <= 0) return

    const visibleWidth = getVisibleWidth(aspect)
    const targetWidth = visibleWidth * (1 - paddingPercent * 2)
    const scale = targetWidth / textWidth

    // Apply scale to the group instead of changing font size
    textGroup.scale.setScalar(scale)
    hasSizedText = true
  }

  // Create multiple layers for depth effect
  for (let i = 0; i < depthLayers; i++) {
    const layerZ = -i * (depth / depthLayers)
    const isfront = i === 0

    const textMesh = new Text()
    textMesh.text = text
    textMesh.font =
      'https://raw.githubusercontent.com/google/fonts/main/ofl/pressstart2p/PressStart2P-Regular.ttf'
    textMesh.fontSize = initialFontSize
    textMesh.anchorX = 'center'
    textMesh.anchorY = 'middle'
    textMesh.textAlign = 'center'
    textMesh.position.z = layerZ

    if (isfront) {
      // Front face - animated gradient
      textMesh.material = new THREE.ShaderMaterial({
        uniforms: {
          colorStart: { value: new THREE.Color(colorStart) },
          colorEnd: { value: new THREE.Color(colorEnd) },
          time: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPosition;
          void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 colorStart;
          uniform vec3 colorEnd;
          uniform float time;
          varying vec2 vUv;
          varying vec3 vPosition;
          void main() {
            float t = vUv.x + sin(time * 2.0) * 0.2;
            vec3 color = mix(colorStart, colorEnd, t);
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      })
    } else {
      // Back layers - darker color for depth effect
      const layerProgress = i / (depthLayers - 1)
      const darkColor = new THREE.Color(colorStart).multiplyScalar(0.3 - layerProgress * 0.2)
      textMesh.material = new THREE.MeshBasicMaterial({
        color: darkColor,
      })
    }

    // On front mesh sync, trigger initial sizing
    if (isfront) {
      textMesh.sync(() => {
        resizeTextToFit(currentAspect)
      })
    } else {
      textMesh.sync()
    }
    textGroup.add(textMesh)
    textMeshes.push(textMesh)
  }

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  // Interaction state
  let mouseX = 0
  let mouseY = 0
  let targetMouseX = 0
  let targetMouseY = 0

  let elapsedTime = 0

  const updateTarget = (clientX: number, clientY: number) => {
    targetMouseX = (clientX / window.innerWidth) * 2 - 1
    targetMouseY = -((clientY / window.innerHeight) * 2 - 1)
  }

  const handleMouseMove = (event: MouseEvent) => {
    updateTarget(event.clientX, event.clientY)
  }

  const handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length > 0) {
      updateTarget(event.touches[0].clientX, event.touches[0].clientY)
    }
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('touchmove', handleTouchMove, { passive: true })

  return {
    scene,
    camera,
    update: (deltaTime: number) => {
      elapsedTime += deltaTime

      // Smooth following
      mouseX += (targetMouseX - mouseX) * 0.05
      mouseY += (targetMouseY - mouseY) * 0.05

      // Rotate entire text group based on mouse
      textGroup.rotation.y = mouseX * 0.3
      textGroup.rotation.x = mouseY * 0.2

      // Update shader time uniform on front face
      const frontMesh = textMeshes[0]
      if (frontMesh) {
        const material = frontMesh.material as THREE.ShaderMaterial
        if (material.uniforms) {
          material.uniforms.time.value = elapsedTime
        }
      }

      // Subtle floating animation
      textGroup.position.y = Math.sin(elapsedTime * 0.5) * 0.1
    },
    dispose: () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      textMeshes.forEach((mesh) => mesh.dispose())
    },
    resize: (_width: number, _height: number, aspect: number) => {
      currentAspect = aspect
      camera.aspect = aspect
      camera.updateProjectionMatrix()
      resizeTextToFit(aspect)
    },
  }
}
