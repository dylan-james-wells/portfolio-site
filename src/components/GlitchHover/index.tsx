'use client'

import React, { useRef, useState, useEffect, ReactNode } from 'react'
import { cn } from '@/utilities/ui'

interface GlitchHoverProps {
  children: ReactNode
  className?: string
  intensity?: number // 0-1, how intense the glitch effect is (default 0.3)
  active?: boolean // When true, activates the glitch effect (controlled mode)
}

// Generate HSL color that cycles through the spectrum
function hslColor(hue: number, saturation = 80, lightness = 60): string {
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

export const GlitchHover: React.FC<GlitchHoverProps> = ({
  children,
  className,
  intensity = 0.3,
  active,
}) => {
  const containerRef = useRef<HTMLSpanElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const animationRef = useRef<number | null>(null)

  // Use active prop if true, otherwise use internal hover state
  // This allows hover to work even when active is explicitly false
  const isActive = active || isHovered

  // Glitch animation on hover using drop-shadow filter (works with SVGs)
  useEffect(() => {
    if (!isActive || !containerRef.current) {
      // Clean up when not hovered
      if (containerRef.current) {
        containerRef.current.style.filter = 'none'
      }
      return
    }

    const scale = 1.5

    const animateGlitch = (currentTime: number) => {
      if (!containerRef.current) return

      const time = currentTime * 0.015
      const jitter = Math.sin(time * 3) * intensity
      const shadows: string[] = []

      // Red channel offset
      const redX = (Math.sin(time * 7) * 6 + jitter * 3) * intensity * scale
      const redY = Math.cos(time * 5) * 3 * intensity * scale
      shadows.push(`drop-shadow(${redX}px ${redY}px 0 ${hslColor(0, 100, 55)})`)

      // Cyan offset (complementary to red for chromatic aberration look)
      const cyanX = -redX * 0.8
      const cyanY = -redY * 0.8
      shadows.push(`drop-shadow(${cyanX}px ${cyanY}px 0 ${hslColor(180, 100, 50)})`)

      // Blue offset
      const blueX = (Math.cos(time * 8 + 4) * -5 + jitter) * intensity * scale
      const blueY = Math.sin(time * 12 + 3) * 3 * intensity * scale
      shadows.push(`drop-shadow(${blueX}px ${blueY}px 0 ${hslColor(220, 100, 55)})`)

      containerRef.current.style.filter = shadows.join(' ')
      animationRef.current = requestAnimationFrame(animateGlitch)
    }

    animationRef.current = requestAnimationFrame(animateGlitch)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (containerRef.current) {
        containerRef.current.style.filter = 'none'
      }
    }
  }, [isActive, intensity])

  return (
    <span
      ref={containerRef}
      className={cn('inline-block', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </span>
  )
}
