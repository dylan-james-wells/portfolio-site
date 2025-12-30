import * as THREE from 'three'
import { Text } from 'troika-three-text'
import type { Scene3D } from './types'

export interface PixelTextOptions {
  text?: string
  colorStart?: number
  colorEnd?: number
  backgroundColor?: number
  fontSize?: number
}

export function create(options: PixelTextOptions = {}): Scene3D {
  const {
    text = 'HELLO\nWORLD',
    colorStart = 0xff6b6b,
    colorEnd = 0x4ecdc4,
    backgroundColor = 0x1a1a2e,
    fontSize = 0.5,
  } = options

  const scene = new THREE.Scene()
  // Transparent background for overlay mode
  scene.background = null

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 0, 5)
  camera.lookAt(0, 0, 0)

  // Create the 3D text
  const textMesh = new Text()
  textMesh.text = text
  textMesh.font = 'https://raw.githubusercontent.com/google/fonts/main/ofl/pressstart2p/PressStart2P-Regular.ttf'
  textMesh.fontSize = fontSize
  textMesh.anchorX = 'center'
  textMesh.anchorY = 'middle'
  textMesh.textAlign = 'center'

  // Create gradient material
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

  scene.add(textMesh)

  // Sync the text (required for troika)
  textMesh.sync()

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

      // Rotate text based on mouse
      textMesh.rotation.y = mouseX * 0.3
      textMesh.rotation.x = mouseY * 0.2

      // Update shader time uniform
      const material = textMesh.material as THREE.ShaderMaterial
      if (material.uniforms) {
        material.uniforms.time.value = elapsedTime
      }

      // Subtle floating animation
      textMesh.position.y = Math.sin(elapsedTime * 0.5) * 0.1
    },
    dispose: () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      textMesh.dispose()
    },
  }
}
