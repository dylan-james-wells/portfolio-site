'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { cn } from '@/utilities/ui'

interface VideoPlaneProps {
  videoUrl: string
  posterUrl?: string
  className?: string
}

export const VideoPlane: React.FC<VideoPlaneProps> = ({ videoUrl, posterUrl, className }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Create video element
    const video = document.createElement('video')
    video.src = videoUrl
    video.loop = true
    video.muted = true
    video.playsInline = true
    video.autoplay = true
    if (posterUrl) {
      video.poster = posterUrl
    }
    video.play()
    videoRef.current = video

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
    renderer.setSize(width, height)
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
      const newWidth = containerRef.current.clientWidth
      const newHeight = containerRef.current.clientHeight
      renderer.setSize(newWidth, newHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      video.pause()
      video.src = ''
      videoTexture.dispose()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [videoUrl, posterUrl])

  return (
    <div
      ref={containerRef}
      className={cn('aspect-square w-full', className)}
    />
  )
}
