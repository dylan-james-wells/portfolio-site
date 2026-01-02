'use client'

import React, { useRef, useState, useEffect, ReactNode } from 'react'

interface WindowRevealProps {
  children: ReactNode
  className?: string
  threshold?: number // 0-1, how far into viewport before activation (default 0)
}

interface Dimensions {
  width: number
  height: number
}

// Easing function for smooth animation
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export const WindowReveal: React.FC<WindowRevealProps> = ({ children, className, threshold = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 })
  const [isInViewport, setIsInViewport] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)
  const animationRef = useRef<number | null>(null)

  // Track viewport intersection
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInViewport(true)
        }
      },
      { threshold },
    )

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [threshold])

  // Track dimensions
  useEffect(() => {
    if (!contentRef.current) return

    const updateDimensions = () => {
      if (contentRef.current) {
        setDimensions({
          width: contentRef.current.offsetWidth,
          height: contentRef.current.offsetHeight,
        })
      }
    }

    // Initial measurement
    updateDimensions()

    // Set up ResizeObserver to track size changes
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(contentRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Border expansion animation
  useEffect(() => {
    if (!isInViewport || !windowRef.current || dimensions.width === 0) return

    // Hide content when dimensions change (resize) and animation needs to replay
    setAnimationComplete(false)

    const WIDTH_DURATION = 400 // ms
    const HEIGHT_DURATION = 300 // ms
    const BORDER_WIDTH = 2
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime

      if (windowRef.current) {
        // Phase 1: Expand width
        const widthProgress = Math.min(elapsed / WIDTH_DURATION, 1)
        const easedWidthProgress = easeOutCubic(widthProgress)
        const currentWidth = easedWidthProgress * dimensions.width

        // Phase 2: Expand height (starts after width is done)
        const heightElapsed = Math.max(0, elapsed - WIDTH_DURATION)
        const heightProgress = Math.min(heightElapsed / HEIGHT_DURATION, 1)
        const easedHeightProgress = easeOutCubic(heightProgress)
        const currentHeight = easedHeightProgress * dimensions.height

        windowRef.current.style.width = `${currentWidth}px`
        windowRef.current.style.height = `${currentHeight}px`
        windowRef.current.style.borderWidth = `${BORDER_WIDTH}px`
      }

      const totalProgress = elapsed / (WIDTH_DURATION + HEIGHT_DURATION)
      if (totalProgress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setAnimationComplete(true)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isInViewport, dimensions])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
      }}
    >
      <div
        ref={windowRef}
        className="z-10 pointer-events-none"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderColor: 'currentColor',
          borderWidth: 0,
          boxSizing: 'border-box',
        }}
      />
      <div
        ref={contentRef}
        style={{
          opacity: animationComplete ? 1 : 0,
          transition: 'opacity 200ms ease-in',
        }}
      >
        {children}
      </div>
    </div>
  )
}
