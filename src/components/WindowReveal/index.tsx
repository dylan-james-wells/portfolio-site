'use client'

import React, { useRef, useState, useEffect, ReactNode } from 'react'

interface WindowRevealProps {
  children: ReactNode
  className?: string
}

interface Dimensions {
  width: number
  height: number
}

// Easing function for smooth animation
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export const WindowReveal: React.FC<WindowRevealProps> = ({ children, className }) => {
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
      { threshold: 0 },
    )

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

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

    const ANIMATION_DURATION = 600 // ms
    const BORDER_WIDTH = 2
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1)
      const easedProgress = easeOutCubic(progress)

      if (windowRef.current) {
        // Animate from center point to full size
        const currentWidth = easedProgress * dimensions.width
        const currentHeight = easedProgress * dimensions.height

        windowRef.current.style.width = `${currentWidth}px`
        windowRef.current.style.height = `${currentHeight}px`
        windowRef.current.style.borderWidth = `${BORDER_WIDTH}px`
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
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
        width: dimensions.width || 'auto',
        height: dimensions.height || 'auto',
      }}
    >
      <div
        ref={windowRef}
        className="window"
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
