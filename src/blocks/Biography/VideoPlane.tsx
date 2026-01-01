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
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const [isReady, setIsReady] = useState(false)
  const [lowPowerMode, setLowPowerMode] = useState(false)
  const [isAndroid, setIsAndroid] = useState<boolean | null>(null)
  const [useCanvas, setUseCanvas] = useState(false)

  // Detect Android
  useEffect(() => {
    setIsAndroid(/(android)/i.test(navigator.userAgent))
  }, [])

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

  // Attempt to play video once ready and Android detection is complete
  useEffect(() => {
    if (!videoRef.current || isAndroid === null || lowPowerMode) return

    const video = videoRef.current

    const attemptPlay = () => {
      const playPromise = video.play()

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Video playing successfully, we can use canvas
            alert(`Video playing! readyState: ${video.readyState}, paused: ${video.paused}`)
            setUseCanvas(true)
          })
          .catch((error) => {
            alert(`Video play error: ${error.name} - ${error.message}, isAndroid: ${isAndroid}`)
            // Any play error on non-Android = try low power mode fallback
            if (!isAndroid) {
              alert('Setting lowPowerMode to true')
              setLowPowerMode(true)
            } else {
              // Android fallback - show video element directly
              alert('Android detected, not using canvas')
              setUseCanvas(false)
            }
          })
      }
    }

    // Wait for video to be ready before attempting play
    alert(`Video readyState: ${video.readyState}, isAndroid: ${isAndroid}`)
    if (video.readyState >= 2) {
      attemptPlay()
    } else {
      video.addEventListener('loadeddata', attemptPlay, { once: true })
    }

    // Additional check: if video is paused after a short delay, assume autoplay blocked
    const checkPlaying = setTimeout(() => {
      if (video.paused && !lowPowerMode && !useCanvas) {
        alert(`Timeout check - paused: ${video.paused}, readyState: ${video.readyState}`)
        if (!isAndroid) {
          setLowPowerMode(true)
        }
      }
    }, 1000)

    return () => {
      clearTimeout(checkPlaying)
      video.removeEventListener('loadeddata', attemptPlay)
    }
  }, [isAndroid, lowPowerMode, useCanvas])

  // Setup Three.js canvas when video is playing
  useEffect(() => {
    if (!canvasContainerRef.current || !videoRef.current || !isReady || !useCanvas || lowPowerMode) return

    const container = canvasContainerRef.current
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
      if (!canvasContainerRef.current) return
      const newSize = Math.min(canvasContainerRef.current.clientWidth, canvasContainerRef.current.clientHeight) || 400
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
  }, [isReady, useCanvas, lowPowerMode])

  // Debug current state
  useEffect(() => {
    alert(`Render state - lowPowerMode: ${lowPowerMode}, useCanvas: ${useCanvas}, isAndroid: ${isAndroid}`)
  }, [lowPowerMode, useCanvas, isAndroid])

  return (
    <div
      ref={containerRef}
      className={cn('aspect-square w-full relative overflow-hidden', className)}
    >
      {lowPowerMode ? (
        // iOS low power mode fallback - img tag with mp4 works for short loops
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={videoUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <>
          {/* Video element */}
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            autoPlay
            loop
            muted
            playsInline
            className={cn(
              'absolute inset-0 w-full h-full object-cover',
              useCanvas ? 'opacity-0 pointer-events-none' : 'opacity-100'
            )}
          />
          {/* Three.js canvas container - only visible when useCanvas is true */}
          <div
            ref={canvasContainerRef}
            className={cn(
              'absolute inset-0 w-full h-full',
              useCanvas ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          />
        </>
      )}
    </div>
  )
}
