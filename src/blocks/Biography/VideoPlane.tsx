'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { cn } from '@/utilities/ui'

interface VideoPlaneProps {
  videoUrl: string
  posterUrl?: string
  className?: string
}

export const VideoPlane: React.FC<VideoPlaneProps> = ({ videoUrl, posterUrl, className }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Wait for container to have dimensions
  useEffect(() => {
    if (!containerRef.current) return

    const checkSize = () => {
      if (containerRef.current && containerRef.current.clientWidth > 0 && containerRef.current.clientHeight > 0) {
        setIsReady(true)
      } else {
        requestAnimationFrame(checkSize)
      }
    }
    checkSize()
  }, [])

  // Setup Three.js once video and container are ready
  useEffect(() => {
    if (!containerRef.current || !videoRef.current || !isReady) return

    const container = containerRef.current
    const video = videoRef.current
    const size = Math.min(container.clientWidth, container.clientHeight) || 400

    // Create scene
    const scene = new THREE.Scene()

    // Create camera for 1:1 aspect ratio
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10)
    camera.position.z = 1

    // Create video texture
    const videoTexture = new THREE.VideoTexture(video)
    videoTexture.minFilter = THREE.LinearFilter
    videoTexture.magFilter = THREE.LinearFilter
    videoTexture.colorSpace = THREE.SRGBColorSpace

    // Create plane geometry (1:1 aspect ratio)
    const geometry = new THREE.PlaneGeometry(1, 1)
    const material = new THREE.MeshBasicMaterial({ map: videoTexture })
    const plane = new THREE.Mesh(geometry, material)
    scene.add(plane)

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(size, size)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return
      const newSize = Math.min(containerRef.current.clientWidth, containerRef.current.clientHeight) || 400
      renderer.setSize(newSize, newSize)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      videoTexture.dispose()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [isReady])

  return (
    <div
      ref={containerRef}
      className={cn('aspect-square w-full relative', className)}
    >
      {/* Hidden video element - browsers handle this better than dynamically created */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
      />
    </div>
  )
}
