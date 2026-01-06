'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
// @ts-ignore
import { Text } from 'troika-three-text'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export const NotFoundScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const textMeshesRef = useRef<InstanceType<typeof Text>[]>([])
  const textGroupRef = useRef<THREE.Group | null>(null)
  const animationFrameRef = useRef<number>(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !containerRef.current) return

    const container = containerRef.current
    const width = window.innerWidth
    const height = window.innerHeight

    // Create renderer with transparent background
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setClearColor(0x000000, 0)
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Create scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
    camera.position.set(0, 0, 5)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Create pixel text for "404"
    const textGroup = new THREE.Group()
    textGroupRef.current = textGroup
    scene.add(textGroup)

    const colorStart = 0xff6b6b // red
    const colorEnd = 0x4ecdc4 // teal
    const depthLayers = 8
    const depth = 0.12

    // Calculate visible width at z=0 for responsive scaling
    const getVisibleWidth = (cam: THREE.PerspectiveCamera) => {
      const distance = cam.position.z
      const vFov = (cam.fov * Math.PI) / 180
      const visibleHeight = 2 * Math.tan(vFov / 2) * distance
      return visibleHeight * cam.aspect
    }

    // Scale text to fit screen width minus 40px padding
    const scaleTextToFit = () => {
      const frontMesh = textMeshesRef.current[0]
      if (!frontMesh || !frontMesh.textRenderInfo) return

      const bounds = frontMesh.textRenderInfo.blockBounds
      const textWidth = bounds[2] - bounds[0]
      if (textWidth <= 0) return

      const visibleWidth = getVisibleWidth(camera)
      const padding = 40 // 40px padding total (20px each side)
      const paddingWorld = (padding / window.innerWidth) * visibleWidth
      const targetWidth = visibleWidth - paddingWorld

      const scale = Math.min(1, targetWidth / textWidth)
      textGroup.scale.setScalar(scale)
    }

    for (let i = 0; i < depthLayers; i++) {
      const layerZ = -i * (depth / depthLayers)
      const isfront = i === 0

      const textMesh = new Text()
      textMesh.text = '404'
      textMesh.font =
        'https://raw.githubusercontent.com/google/fonts/main/ofl/pressstart2p/PressStart2P-Regular.ttf'
      textMesh.fontSize = 1.2
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
        // Scale text after it syncs
        textMesh.sync(() => {
          scaleTextToFit()
        })
      } else {
        // Back layers - darker color for depth effect
        const layerProgress = i / (depthLayers - 1)
        const darkColor = new THREE.Color(colorStart).multiplyScalar(0.3 - layerProgress * 0.2)
        textMesh.material = new THREE.MeshBasicMaterial({
          color: darkColor,
        })
        textMesh.sync()
      }

      textGroup.add(textMesh)
      textMeshesRef.current.push(textMesh)
    }

    // Animation loop
    let lastTime = 0
    let elapsedTime = 0

    const animate = (time: number) => {
      const deltaTime = Math.min((time - lastTime) / 1000, 0.1)
      lastTime = time
      elapsedTime += deltaTime

      // Update text shader
      const frontMesh = textMeshesRef.current[0]
      if (frontMesh) {
        const material = frontMesh.material as THREE.ShaderMaterial
        if (material.uniforms) {
          material.uniforms.time.value = elapsedTime
        }
      }

      // Subtle text float animation
      if (textGroupRef.current) {
        textGroupRef.current.position.y = Math.sin(elapsedTime * 0.8) * 0.1
        textGroupRef.current.rotation.y = Math.sin(elapsedTime * 0.3) * 0.05
      }

      renderer.render(scene, camera)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    // Handle resize
    const handleResize = () => {
      if (!renderer || !camera) return
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight
      renderer.setSize(newWidth, newHeight)
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      scaleTextToFit()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameRef.current)
      textMeshesRef.current.forEach((mesh) => mesh.dispose())
      textMeshesRef.current = []
      textGroupRef.current = null
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [isClient])

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: 'hsl(249 23% 6%)' }}
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 0%, hsl(249 23% 12% / 0.6) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, hsl(249 23% 10% / 0.5) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, hsl(249 23% 8% / 0.3) 0%, transparent 70%)
          `,
          zIndex: 1,
        }}
      />

      {/* Three.js canvas container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 2 }} />

      {/* Go Home button - positioned below center */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ zIndex: 3, paddingTop: '20rem' }}
      >
        <Button
          asChild
          variant="outline"
          className="pointer-events-auto border-2 border-white bg-transparent hover:bg-white/10"
        >
          <Link href="/">Go Home</Link>
        </Button>
      </div>

      {/* Animated noise overlay */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-300%',
          left: '-150%',
          height: '600%',
          width: '600%',
          backgroundImage: "url('/noise.png')",
          backgroundSize: '200px',
          backgroundRepeat: 'repeat',
          opacity: 0.12,
          zIndex: 4,
          animation: 'grain 7s steps(10) infinite',
        }}
      />
    </div>
  )
}

export default NotFoundScene
