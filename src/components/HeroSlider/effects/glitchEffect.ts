import * as THREE from 'three'
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js'
import type { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import type { Effect } from './types'

// Custom glitch shader
const GlitchShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    intensity: { value: 0 },
    resolution: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float intensity;
    uniform vec2 resolution;
    varying vec2 vUv;

    // Random function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;

      // Skip if no intensity
      if (intensity < 0.001) {
        gl_FragColor = texture2D(tDiffuse, uv);
        return;
      }

      // Horizontal shift glitch
      float glitchLine = step(0.99 - intensity * 0.15, random(vec2(floor(uv.y * 20.0), time * 10.0)));
      float shift = (random(vec2(time * 5.0, floor(uv.y * 30.0))) - 0.5) * 0.1 * intensity * glitchLine;
      uv.x += shift;

      // Vertical block displacement
      float blockY = floor(uv.y * 8.0) / 8.0;
      float blockGlitch = step(0.97 - intensity * 0.1, random(vec2(blockY, time * 3.0)));
      uv.y += (random(vec2(time, blockY)) - 0.5) * 0.05 * intensity * blockGlitch;

      // RGB split
      float rgbShift = intensity * 0.02;
      float r = texture2D(tDiffuse, uv + vec2(rgbShift, 0.0)).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - vec2(rgbShift, 0.0)).b;

      // Scanlines
      float scanline = sin(uv.y * resolution.y * 2.0) * 0.02 * intensity;

      // Color distortion
      vec3 color = vec3(r, g, b);
      color += scanline;

      // Random color noise
      float noise = (random(uv + time) - 0.5) * 0.1 * intensity;
      color += noise;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
}

class GlitchPass extends Pass {
  uniforms: typeof GlitchShader.uniforms
  material: THREE.ShaderMaterial
  fsQuad: FullScreenQuad

  constructor() {
    super()
    this.uniforms = THREE.UniformsUtils.clone(GlitchShader.uniforms)
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: GlitchShader.vertexShader,
      fragmentShader: GlitchShader.fragmentShader,
    })
    this.fsQuad = new FullScreenQuad(this.material)
  }

  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget,
  ) {
    // @ts-ignore
    this.uniforms.tDiffuse.value = readBuffer.texture

    if (this.renderToScreen) {
      renderer.setRenderTarget(null)
      this.fsQuad.render(renderer)
    } else {
      renderer.setRenderTarget(writeBuffer)
      if (this.clear) renderer.clear()
      this.fsQuad.render(renderer)
    }
  }

  setSize(width: number, height: number) {
    this.uniforms.resolution.value.set(width, height)
  }

  dispose() {
    this.material.dispose()
    this.fsQuad.dispose()
  }
}

export interface GlitchEffectOptions {
  decaySpeed?: number
}

export function createGlitchEffect(
  composer: EffectComposer,
  options: GlitchEffectOptions = {},
): Effect {
  const { decaySpeed = 3 } = options

  const glitchPass = new GlitchPass()
  composer.addPass(glitchPass)

  let currentIntensity = 0
  let targetIntensity = 0
  let isActive = false

  return {
    update: (deltaTime: number) => {
      // Update time uniform
      glitchPass.uniforms.time.value += deltaTime

      // Smoothly interpolate intensity
      if (isActive) {
        currentIntensity += (targetIntensity - currentIntensity) * 0.2
      } else {
        // Decay when not active
        currentIntensity *= Math.max(0, 1 - deltaTime * decaySpeed)
        if (currentIntensity < 0.001) {
          currentIntensity = 0
        }
      }

      glitchPass.uniforms.intensity.value = currentIntensity
    },

    trigger: (intensity = 1) => {
      isActive = true
      targetIntensity = Math.min(intensity, 1.5)
    },

    stop: () => {
      isActive = false
      targetIntensity = 0
    },

    dispose: () => {
      glitchPass.dispose()
    },
  }
}
