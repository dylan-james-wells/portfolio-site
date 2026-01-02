'use client'

import React, { useRef, useState, useEffect, ReactNode } from 'react'

interface GlitchTextRevealProps {
  children: ReactNode
  className?: string
  threshold?: number // 0-1, how far into viewport before activation (default 0)
}

// Easing function for smooth animation
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Generate HSL color that cycles through the spectrum
function hslColor(hue: number, saturation = 80, lightness = 60): string {
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

export const GlitchTextReveal: React.FC<GlitchTextRevealProps> = ({
  children,
  className,
  threshold = 0,
}) => {
  const containerRef = useRef<HTMLSpanElement>(null)
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

  // Glitch text shadow animation
  useEffect(() => {
    if (!isInViewport || !containerRef.current) return

    const ANIMATION_DURATION = 3000 // ms
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1)
      const easedProgress = easeOutCubic(progress)

      if (containerRef.current) {
        // Glitch intensity decreases as animation progresses
        const glitchIntensity = 1 - easedProgress

        // Generate multiple chromatic aberration shadows
        // Each shadow has a different hue offset and position
        const shadows: string[] = []

        if (glitchIntensity > 0.01) {
          // Time-based variation for glitchy movement
          const time = currentTime * 0.015
          const jitter = Math.sin(time * 3) * glitchIntensity

          // Multiplier for more pronounced effect
          const scale = 2.5

          // Red channel offset
          const redX = (Math.sin(time * 7) * 8 + jitter * 4) * glitchIntensity * scale
          const redY = Math.cos(time * 5) * 4 * glitchIntensity * scale
          shadows.push(`${hslColor(0, 100, 55)} ${redX}px ${redY}px ${12 * glitchIntensity}px`)

          // Yellow/orange offset
          const yellowX = (Math.sin(time * 11 + 1) * 6 - jitter * 2) * glitchIntensity * scale
          const yellowY = Math.cos(time * 8 + 2) * 5 * glitchIntensity * scale
          shadows.push(
            `${hslColor(45, 100, 50)} ${yellowX}px ${yellowY}px ${14 * glitchIntensity}px`,
          )

          // Green offset
          const greenX = Math.cos(time * 9 + 2) * -6 * glitchIntensity * scale
          const greenY = (Math.sin(time * 6 + 1) * -4 + jitter * 2) * glitchIntensity * scale
          shadows.push(`${hslColor(120, 90, 45)} ${greenX}px ${greenY}px ${10 * glitchIntensity}px`)

          // Cyan offset
          const cyanX = Math.sin(time * 13 + 3) * 5 * glitchIntensity * scale
          const cyanY = (Math.cos(time * 10) * -6 - jitter * 3) * glitchIntensity * scale
          shadows.push(`${hslColor(180, 100, 50)} ${cyanX}px ${cyanY}px ${12 * glitchIntensity}px`)

          // Blue offset
          const blueX = (Math.cos(time * 8 + 4) * -8 + jitter * 2) * glitchIntensity * scale
          const blueY = Math.sin(time * 12 + 3) * 4 * glitchIntensity * scale
          shadows.push(`${hslColor(220, 100, 55)} ${blueX}px ${blueY}px ${16 * glitchIntensity}px`)

          // Magenta offset
          const magentaX = Math.sin(time * 6 + 5) * 6 * glitchIntensity * scale
          const magentaY = (Math.cos(time * 9 + 4) * 5 + jitter) * glitchIntensity * scale
          shadows.push(
            `${hslColor(300, 100, 50)} ${magentaX}px ${magentaY}px ${11 * glitchIntensity}px`,
          )
        }

        containerRef.current.style.textShadow = shadows.length > 0 ? shadows.join(', ') : 'none'
        containerRef.current.style.opacity = String(easedProgress)
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setAnimationComplete(true)
        if (containerRef.current) {
          containerRef.current.style.textShadow = 'none'
          containerRef.current.style.opacity = '1'
        }
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isInViewport])

  return (
    <span
      ref={containerRef}
      className={className}
      style={{
        opacity: animationComplete ? 1 : 0,
        display: 'inline',
      }}
    >
      {children}
    </span>
  )
}
