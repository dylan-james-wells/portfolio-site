import * as THREE from 'three'

export interface BlackHoleVortexOptions {
  colorStart?: number // teal
  colorEnd?: number // red
}

export interface BlackHoleVortex {
  scene: THREE.Scene
  camera: THREE.Camera
  update: (deltaTime: number) => void
  dispose: () => void
  resize: (width: number, height: number, aspect: number) => void
}

export function create(options: BlackHoleVortexOptions = {}): BlackHoleVortex {
  const { colorStart = 0x4ecdc4, colorEnd = 0xff6b6b } = options

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0f0d14)

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  camera.position.set(0, 0, 5)
  camera.lookAt(0, 0, 0)

  // Create spiral particle system for vortex effect
  const particleCount = 2000
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)

  // Store particle data for animation
  const particleData: { angle: number; radius: number; speed: number; zOffset: number }[] = []

  const colorStartVec = new THREE.Color(colorStart)
  const colorEndVec = new THREE.Color(colorEnd)

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * 4 + 0.5
    const z = (Math.random() - 0.5) * 2

    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 1] = Math.sin(angle) * radius
    positions[i * 3 + 2] = z

    particleData.push({
      angle,
      radius,
      speed: 0.2 + Math.random() * 0.4,
      zOffset: z,
    })

    // Color gradient based on distance from center
    const t = radius / 4.5
    const color = new THREE.Color().lerpColors(colorStartVec, colorEndVec, t)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b

    sizes[i] = (1 - t * 0.5) * 4 + Math.random() * 2
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.ShaderMaterial({
    uniforms: {
      pixelRatio: { value: window.devicePixelRatio },
    },
    vertexShader: `
      attribute float size;
      varying vec3 vColor;
      uniform float pixelRatio;

      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * pixelRatio * (200.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;

      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;

        float alpha = 1.0 - smoothstep(0.1, 0.5, dist);
        gl_FragColor = vec4(vColor, alpha * 0.7);
      }
    `,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const particles = new THREE.Points(geometry, material)
  scene.add(particles)

  // Create glowing core
  const coreGeometry = new THREE.CircleGeometry(0.6, 32)
  const coreMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      colorStart: { value: colorStartVec },
      colorEnd: { value: colorEndVec },
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
      uniform vec3 colorStart;
      uniform vec3 colorEnd;
      varying vec2 vUv;

      void main() {
        vec2 center = vUv - vec2(0.5);
        float dist = length(center) * 2.0;

        float pulse = sin(time * 2.0) * 0.1 + 0.9;
        float coreSize = 0.2 * pulse;

        float coreDark = smoothstep(coreSize, coreSize + 0.15, dist);
        float glow = 1.0 - smoothstep(0.0, 1.0, dist);

        float angle = atan(center.y, center.x);
        float swirl = sin(angle * 4.0 + time * 3.0) * 0.5 + 0.5;
        vec3 color = mix(colorStart, colorEnd, swirl);

        float alpha = glow * coreDark * 0.8;
        gl_FragColor = vec4(color * glow * 1.5, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const core = new THREE.Mesh(coreGeometry, coreMaterial)
  core.position.z = 0.1
  scene.add(core)

  let elapsedTime = 0

  return {
    scene,
    camera,
    update: (deltaTime: number) => {
      elapsedTime += deltaTime

      coreMaterial.uniforms.time.value = elapsedTime

      // Animate particles in spiral
      const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute
      const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute

      for (let i = 0; i < particleCount; i++) {
        const p = particleData[i]

        // Rotate around center
        p.angle += deltaTime * p.speed

        // Slowly pull inward
        p.radius -= deltaTime * 0.15

        // Reset when too close to center
        if (p.radius < 0.3) {
          p.radius = 4 + Math.random() * 1
          p.angle = Math.random() * Math.PI * 2
          p.speed = 0.2 + Math.random() * 0.4
        }

        const wave = Math.sin(p.angle * 3 + elapsedTime) * 0.05
        const x = Math.cos(p.angle) * (p.radius + wave)
        const y = Math.sin(p.angle) * (p.radius + wave)
        const z = p.zOffset + Math.sin(elapsedTime * 0.5 + i * 0.01) * 0.2

        positionAttr.setXYZ(i, x, y, z)

        // Update color based on new radius
        const t = p.radius / 4.5
        const color = new THREE.Color().lerpColors(colorStartVec, colorEndVec, t)
        colorAttr.setXYZ(i, color.r, color.g, color.b)
      }

      positionAttr.needsUpdate = true
      colorAttr.needsUpdate = true

      // Subtle camera sway
      camera.position.x = Math.sin(elapsedTime * 0.15) * 0.2
      camera.position.y = Math.cos(elapsedTime * 0.1) * 0.15
      camera.lookAt(0, 0, 0)
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
      coreGeometry.dispose()
      coreMaterial.dispose()
    },
    resize: (_width: number, _height: number, aspect: number) => {
      ;(camera as THREE.PerspectiveCamera).aspect = aspect
      ;(camera as THREE.PerspectiveCamera).updateProjectionMatrix()
      material.uniforms.pixelRatio.value = window.devicePixelRatio
    },
  }
}
