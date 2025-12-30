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
      // Front face - animated gradient with Mario 64 stretch effect and color ripple
      textMesh.material = new THREE.ShaderMaterial({
        uniforms: {
          colorStart: { value: new THREE.Color(colorStart) },
          colorEnd: { value: new THREE.Color(colorEnd) },
          time: { value: 0 },
          stretchX: { value: 0 },
          stretchY: { value: 0 },
          // Ripple effect uniforms
          rippleTime: { value: -1.0 }, // -1 means no active ripple
          rippleOrigin: { value: new THREE.Vector2(0.5, 0.5) },
          rippleColor1: { value: new THREE.Color(0xff0055) },
          rippleColor2: { value: new THREE.Color(0x00ff88) },
          rippleColor3: { value: new THREE.Color(0x00ffff) },
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
          uniform float rippleTime;
          uniform vec2 rippleOrigin;
          uniform vec3 rippleColor1;
          uniform vec3 rippleColor2;
          uniform vec3 rippleColor3;
          varying vec2 vUv;
          varying vec3 vPosition;

          // Pseudo-random function for blocky effect
          float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
          }

          void main() {
            // Base gradient color
            float stretchEffect = (stretchX + stretchY) * 0.1;
            float t = vUv.x + sin(time * 2.0) * 0.2 + stretchEffect;
            vec3 baseColor = mix(colorStart, colorEnd, t);

            // Blocky/pixelated UV for ripple effect
            float blockSize = 0.08;
            vec2 blockUv = floor(vUv / blockSize) * blockSize;

            // Ripple effect
            vec3 finalColor = baseColor;
            if (rippleTime >= 0.0) {
              float dist = distance(blockUv, rippleOrigin);
              float rippleRadius = rippleTime * 2.0; // Speed of ripple expansion
              float rippleWidth = 0.4;

              // Create multiple wave bands
              float wave1 = smoothstep(rippleRadius - rippleWidth, rippleRadius, dist) *
                           (1.0 - smoothstep(rippleRadius, rippleRadius + rippleWidth * 0.5, dist));
              float wave2 = smoothstep(rippleRadius - rippleWidth * 2.0, rippleRadius - rippleWidth, dist) *
                           (1.0 - smoothstep(rippleRadius - rippleWidth, rippleRadius - rippleWidth * 0.5, dist));
              float wave3 = smoothstep(rippleRadius - rippleWidth * 3.0, rippleRadius - rippleWidth * 2.0, dist) *
                           (1.0 - smoothstep(rippleRadius - rippleWidth * 2.0, rippleRadius - rippleWidth * 1.5, dist));

              // Add randomness for blocky/chaotic feel
              float blockRand = random(blockUv + floor(rippleTime * 10.0) * 0.1);
              float chaos = step(0.3, blockRand);

              // Fade out over time
              float fadeOut = 1.0 - smoothstep(0.0, 1.5, rippleTime);

              // Mix in ripple colors
              vec3 rippleColor = baseColor;
              rippleColor = mix(rippleColor, rippleColor1, wave1 * chaos * fadeOut);
              rippleColor = mix(rippleColor, rippleColor2, wave2 * chaos * fadeOut);
              rippleColor = mix(rippleColor, rippleColor3, wave3 * chaos * fadeOut);

              finalColor = rippleColor;
            }

            gl_FragColor = vec4(finalColor, 1.0);
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

  // Ripple effect state
  let rippleActive = false
  let rippleStartTime = 0
  let rippleOriginX = 0.5
  let rippleOriginY = 0.5

  // Bright color palette for ripple (matching background effect)
  const rippleColors = [
    new THREE.Color(0xff0055), // hot pink
    new THREE.Color(0x00ff88), // neon green
    new THREE.Color(0xff3300), // orange-red
    new THREE.Color(0x00ffff), // cyan
    new THREE.Color(0xff00ff), // magenta
    new THREE.Color(0xffff00), // yellow
    new THREE.Color(0x0088ff), // electric blue
  ]

  // Function to trigger ripple effect
  const triggerRipple = (originX: number, originY: number) => {
    rippleActive = true
    rippleStartTime = elapsedTime
    rippleOriginX = originX
    rippleOriginY = originY

    // Randomize colors for each ripple
    const frontMesh = textMeshes[0]
    if (frontMesh) {
      const material = frontMesh.material as THREE.ShaderMaterial
      if (material.uniforms) {
        const c1 = rippleColors[Math.floor(Math.random() * rippleColors.length)]
        const c2 = rippleColors[Math.floor(Math.random() * rippleColors.length)]
        const c3 = rippleColors[Math.floor(Math.random() * rippleColors.length)]
        material.uniforms.rippleColor1.value.copy(c1)
        material.uniforms.rippleColor2.value.copy(c2)
        material.uniforms.rippleColor3.value.copy(c3)
        material.uniforms.rippleOrigin.value.set(originX, originY)
      }
    }
  }

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
      const dragMagnitude = Math.sqrt(dragOffsetX * dragOffsetX + dragOffsetY * dragOffsetY)

      // Transfer drag momentum to velocity for wobble
      velocityX += dragOffsetX * 15
      velocityY += dragOffsetY * 15

      // Trigger ripple effect if there was significant movement
      if (dragMagnitude > 0.02) {
        // Origin from center, offset by drag direction
        triggerRipple(0.5 + dragOffsetX * 0.5, 0.5 + dragOffsetY * 0.5)
      }

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
      const dragMagnitude = Math.sqrt(dragOffsetX * dragOffsetX + dragOffsetY * dragOffsetY)

      velocityX += dragOffsetX * 15
      velocityY += dragOffsetY * 15

      // Trigger ripple effect if there was significant movement
      if (dragMagnitude > 0.02) {
        triggerRipple(0.5 + dragOffsetX * 0.5, 0.5 + dragOffsetY * 0.5)
      }

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

      // Update ripple effect
      if (rippleActive) {
        const rippleAge = elapsedTime - rippleStartTime
        if (rippleAge > 2.0) {
          // Ripple finished
          rippleActive = false
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
          // Update ripple time (-1 when inactive)
          material.uniforms.rippleTime.value = rippleActive
            ? elapsedTime - rippleStartTime
            : -1.0
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
