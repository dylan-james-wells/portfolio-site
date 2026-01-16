'use client'

import React, { useRef, useState, useEffect, ReactNode } from 'react'
import { useIsAndroid } from '@/utilities/useIsAndroid'

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
  const isAndroid = useIsAndroid()

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

    // On Android, use a simple fade-in instead of complex text-shadow animation
    if (isAndroid) {
      const FADE_DURATION = 800 // ms
      const startTime = performance.now()

      const animateFade = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / FADE_DURATION, 1)
        const easedProgress = easeOutCubic(progress)

        if (containerRef.current) {
          containerRef.current.style.opacity = String(easedProgress)
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateFade)
        } else {
          setAnimationComplete(true)
          if (containerRef.current) {
            containerRef.current.style.opacity = '1'
          }
        }
      }

      animationRef.current = requestAnimationFrame(animateFade)

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }

    // Full glitch animation for non-Android devices
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
          const redX = (Math.sin(time * 7) * 6 + jitter * 3) * glitchIntensity * scale
          const redY = Math.cos(time * 5) * 3 * glitchIntensity * scale
          shadows.push(`${hslColor(0, 100, 55)} ${redX}px ${redY}px ${8 * glitchIntensity}px`)

          // Cyan offset (complementary to red for chromatic aberration look)
          const cyanX = -redX * 0.8
          const cyanY = -redY * 0.8
          shadows.push(`${hslColor(180, 100, 50)} ${cyanX}px ${cyanY}px ${8 * glitchIntensity}px`)

          // Blue offset
          const blueX = (Math.cos(time * 8 + 4) * -5 + jitter) * glitchIntensity * scale
          const blueY = Math.sin(time * 12 + 3) * 3 * glitchIntensity * scale
          shadows.push(`${hslColor(220, 100, 55)} ${blueX}px ${blueY}px ${10 * glitchIntensity}px`)
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
  }, [isInViewport, isAndroid])

  return (
    <span
      ref={containerRef}
      className={className}
      style={{
        opacity: animationComplete ? 1 : 0,
        color: 'inherit',
        WebkitTextFillColor: 'inherit',
      }}
    >
      {children}
    </span>
  )
}
