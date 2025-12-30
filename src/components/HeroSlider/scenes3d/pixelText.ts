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
      // Front face - animated gradient with Mario 64 stretch effect
      textMesh.material = new THREE.ShaderMaterial({
        uniforms: {
          colorStart: { value: new THREE.Color(colorStart) },
          colorEnd: { value: new THREE.Color(colorEnd) },
          time: { value: 0 },
          stretchX: { value: 0 },
          stretchY: { value: 0 },
        },
        vertexShader: `
          uniform float stretchX;
          uniform float stretchY;
          varying vec2 vUv;
          varying vec3 vPosition;

          void main() {
            vUv = uv;
            vPosition = position;

            // Mario 64 style vertex displacement
            // Vertices further from center get displaced more
            vec3 displaced = position;

            // Calculate distance from center for falloff
            float distFromCenter = length(position.xy);
            float falloff = 1.0 / (1.0 + distFromCenter * 0.5);

            // Apply stretch with center-based displacement
            // Center moves most, edges follow with a wave-like delay
            displaced.x += stretchX * (1.0 - falloff * 0.3);
            displaced.y += stretchY * (1.0 - falloff * 0.3);

            // Add some bulging effect perpendicular to stretch direction
            float stretchMagnitude = length(vec2(stretchX, stretchY));
            displaced.z += stretchMagnitude * falloff * 0.5;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 colorStart;
          uniform vec3 colorEnd;
          uniform float time;
          uniform float stretchX;
          uniform float stretchY;
          varying vec2 vUv;
          varying vec3 vPosition;

          void main() {
            // Add some color shift based on stretch
            float stretchEffect = (stretchX + stretchY) * 0.1;
            float t = vUv.x + sin(time * 2.0) * 0.2 + stretchEffect;
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

  // Interaction state for rotation
  let mouseX = 0
  let mouseY = 0
  let targetMouseX = 0
  let targetMouseY = 0

  let elapsedTime = 0

  // Mario 64 face stretch state
  let isDragging = false
  let dragStartX = 0
  let dragStartY = 0
  let dragOffsetX = 0
  let dragOffsetY = 0
  // Spring physics for wobble effect
  let stretchX = 0
  let stretchY = 0
  let velocityX = 0
  let velocityY = 0
  const springStiffness = 180 // How fast it snaps back
  const springDamping = 12 // How quickly oscillations die down
  const stretchMultiplier = 0.8 // How much the drag affects the stretch

  const updateTarget = (clientX: number, clientY: number) => {
    targetMouseX = (clientX / window.innerWidth) * 2 - 1
    targetMouseY = -((clientY / window.innerHeight) * 2 - 1)
  }

  const handleMouseMove = (event: MouseEvent) => {
    updateTarget(event.clientX, event.clientY)

    if (isDragging) {
      dragOffsetX = (event.clientX - dragStartX) / window.innerWidth
      dragOffsetY = -(event.clientY - dragStartY) / window.innerHeight
    }
  }

  const handleMouseDown = (event: MouseEvent) => {
    isDragging = true
    dragStartX = event.clientX
    dragStartY = event.clientY
    dragOffsetX = 0
    dragOffsetY = 0
  }

  const handleMouseUp = () => {
    if (isDragging) {
      // Transfer drag momentum to velocity for wobble
      velocityX += dragOffsetX * 15
      velocityY += dragOffsetY * 15
      isDragging = false
      dragOffsetX = 0
      dragOffsetY = 0
    }
  }

  const handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length > 0) {
      const touch = event.touches[0]
      updateTarget(touch.clientX, touch.clientY)

      if (isDragging) {
        dragOffsetX = (touch.clientX - dragStartX) / window.innerWidth
        dragOffsetY = -(touch.clientY - dragStartY) / window.innerHeight
      }
    }
  }

  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length > 0) {
      isDragging = true
      dragStartX = event.touches[0].clientX
      dragStartY = event.touches[0].clientY
      dragOffsetX = 0
      dragOffsetY = 0
    }
  }

  const handleTouchEnd = () => {
    if (isDragging) {
      velocityX += dragOffsetX * 15
      velocityY += dragOffsetY * 15
      isDragging = false
      dragOffsetX = 0
      dragOffsetY = 0
    }
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('touchmove', handleTouchMove, { passive: true })
  window.addEventListener('touchstart', handleTouchStart, { passive: true })
  window.addEventListener('touchend', handleTouchEnd)

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

      // Spring physics for Mario 64 wobble effect
      if (isDragging) {
        // While dragging, directly apply the stretch
        stretchX = dragOffsetX * stretchMultiplier
        stretchY = dragOffsetY * stretchMultiplier
      } else {
        // Spring physics: F = -kx - cv (spring force - damping)
        const forceX = -springStiffness * stretchX - springDamping * velocityX
        const forceY = -springStiffness * stretchY - springDamping * velocityY

        velocityX += forceX * deltaTime
        velocityY += forceY * deltaTime

        stretchX += velocityX * deltaTime
        stretchY += velocityY * deltaTime

        // Stop tiny oscillations
        if (Math.abs(stretchX) < 0.0001 && Math.abs(velocityX) < 0.0001) {
          stretchX = 0
          velocityX = 0
        }
        if (Math.abs(stretchY) < 0.0001 && Math.abs(velocityY) < 0.0001) {
          stretchY = 0
          velocityY = 0
        }
      }

      // Update shader uniforms on front face
      const frontMesh = textMeshes[0]
      if (frontMesh) {
        const material = frontMesh.material as THREE.ShaderMaterial
        if (material.uniforms) {
          material.uniforms.time.value = elapsedTime
          material.uniforms.stretchX.value = stretchX
          material.uniforms.stretchY.value = stretchY
        }
      }

      // Apply stretch to back layers as position offset (simpler effect)
      for (let i = 1; i < textMeshes.length; i++) {
        const mesh = textMeshes[i]
        const layerDepth = i / textMeshes.length
        // Back layers lag behind the front slightly
        mesh.position.x = stretchX * (1 - layerDepth * 0.5)
        mesh.position.y = stretchY * (1 - layerDepth * 0.5)
      }

      // Subtle floating animation
      textGroup.position.y = Math.sin(elapsedTime * 0.5) * 0.1
    },
    dispose: () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
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
