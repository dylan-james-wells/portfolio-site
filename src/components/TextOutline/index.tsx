'use client'

import React, { useEffect, useRef, useState, ReactNode } from 'react'
import { cn } from '@/utilities/ui'

interface TextOutlineProps {
  children: ReactNode
  className?: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  threshold?: number // 0-1, how far into viewport before activation (default 0)
  useNoiseGradient?: boolean // Use animated noise gradient background instead of flat color
}

interface LineRect {
  left: number
  right: number
  top: number
  bottom: number
}

export const TextOutline: React.FC<TextOutlineProps> = ({
  children,
  className = '',
  backgroundColor = 'hsl(var(--card))',
  borderColor = 'white',
  borderWidth = 2,
  threshold = 0,
  useNoiseGradient = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gradientRef = useRef<HTMLDivElement>(null)
  const [animationState, setAnimationState] = useState<'hidden' | 'ready' | 'animating'>('hidden')
  const [clipPath, setClipPath] = useState<string>('')

  // Track viewport intersection
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && animationState === 'hidden') {
          // Set to ready state (scale 0, opacity 1), then trigger animation
          setAnimationState('ready')
          // Use requestAnimationFrame to ensure the ready state is painted before animating
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setAnimationState('animating')
            })
          })
        }
      },
      { threshold },
    )

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [threshold, animationState])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Cache computed values
    let cachedPoints: { x: number; y: number }[] = []
    let cachedWidth = 0
    let cachedHeight = 0
    let resolvedBorderColor = ''

    // Track if we need to redraw when becoming visible again
    // (Android aggressively releases GPU resources when scrolling)
    let needsRedraw = false

    const computeOutlinePath = () => {
      const containerRect = container.getBoundingClientRect()

      // Set canvas size to match container
      canvas.width = containerRect.width
      canvas.height = containerRect.height
      cachedWidth = containerRect.width
      cachedHeight = containerRect.height

      // Resolve CSS custom properties for canvas
      const computedStyle = getComputedStyle(container)
      resolvedBorderColor = borderColor.includes('var(')
        ? `hsl(${computedStyle.getPropertyValue(borderColor.match(/var\((--[^)]+)\)/)?.[1] || '')})`
        : borderColor

      // Automatically find all text nodes in the container
      const allRects: LineRect[] = []

      // Use TreeWalker to find all text nodes
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          // Skip empty text nodes (whitespace only)
          if (!node.textContent?.trim()) {
            return NodeFilter.FILTER_REJECT
          }
          // Skip text in canvas element
          if (node.parentElement === canvas) {
            return NodeFilter.FILTER_REJECT
          }
          return NodeFilter.FILTER_ACCEPT
        },
      })

      // Collect rectangles from each text node
      let node: Node | null
      while ((node = walker.nextNode())) {
        const range = document.createRange()
        range.selectNodeContents(node)
        const rects = Array.from(range.getClientRects())

        // Convert to coordinates relative to container
        rects.forEach((rect) => {
          if (rect.width > 0 && rect.height > 0) {
            allRects.push({
              left: rect.left - containerRect.left,
              right: rect.right - containerRect.left,
              top: rect.top - containerRect.top,
              bottom: rect.bottom - containerRect.top,
            })
          }
        })
      }

      if (allRects.length === 0) {
        cachedPoints = []
        setClipPath('')
        return
      }

      // Sort rectangles by vertical position
      allRects.sort((a, b) => a.top - b.top)

      // Group rectangles by approximate vertical position (same line)
      const lineGroups: LineRect[][] = []
      let currentGroup: LineRect[] = [allRects[0]]

      for (let i = 1; i < allRects.length; i++) {
        const rect = allRects[i]
        const prevRect = allRects[i - 1]

        // If rects are on approximately the same line (within half of line height)
        const lineHeight = prevRect.bottom - prevRect.top
        if (Math.abs(rect.top - prevRect.top) < lineHeight * 0.5) {
          currentGroup.push(rect)
        } else {
          lineGroups.push(currentGroup)
          currentGroup = [rect]
        }
      }
      lineGroups.push(currentGroup)

      // Merge rects on the same line into single line bounds
      const mergedLines: LineRect[] = lineGroups.map((group) => {
        return {
          left: Math.min(...group.map((r) => r.left)),
          right: Math.max(...group.map((r) => r.right)),
          top: Math.min(...group.map((r) => r.top)),
          bottom: Math.max(...group.map((r) => r.bottom)),
        }
      })

      if (mergedLines.length === 0) {
        cachedPoints = []
        setClipPath('')
        return
      }

      // Calculate padding from the left edge of the first text line
      const leftPadding = Math.min(...mergedLines.map((l) => l.left))
      const topPadding = mergedLines[0].top

      // Build the outline path - container edges for left/top, jagged right edge with padding
      const points: { x: number; y: number }[] = []

      // Inset for border to be fully visible (half border width)
      const inset = borderWidth / 2

      // Container bounds for left, top edges (inset for border visibility)
      const leftEdge = inset
      const topEdge = inset

      // Start at top-left corner, go clockwise
      points.push({ x: leftEdge, y: topEdge })

      // Go right along top to first line's right edge + padding (minus inset)
      points.push({ x: mergedLines[0].right + leftPadding - inset, y: topEdge })

      // Trace down the jagged right edge
      for (let i = 0; i < mergedLines.length; i++) {
        const line = mergedLines[i]
        const nextLine = mergedLines[i + 1]

        if (nextLine) {
          if (nextLine.right > line.right) {
            // Next line is wider - step outward, so step happens above the next line (with padding)
            const stepY = nextLine.top - topPadding
            points.push({ x: line.right + leftPadding - inset, y: stepY })
            points.push({ x: nextLine.right + leftPadding - inset, y: stepY })
          } else {
            // Next line is narrower - step inward, so step happens below current line (with padding)
            const stepY = line.bottom + topPadding
            points.push({ x: line.right + leftPadding - inset, y: stepY })
            points.push({ x: nextLine.right + leftPadding - inset, y: stepY })
          }
        } else {
          // Last line - extend down with padding (minus inset)
          points.push({ x: line.right + leftPadding - inset, y: line.bottom + topPadding - inset })
        }
      }

      // Go left along bottom (with padding below last line, minus inset)
      const lastLine = mergedLines[mergedLines.length - 1]
      points.push({ x: leftEdge, y: lastLine.bottom + topPadding - inset })

      // Close path back to start
      points.push({ x: leftEdge, y: topEdge })

      cachedPoints = points

      // Generate CSS clip-path polygon for the gradient div
      if (useNoiseGradient && cachedWidth > 0 && cachedHeight > 0) {
        const polygonPoints = points
          .map((p) => `${(p.x / cachedWidth) * 100}% ${(p.y / cachedHeight) * 100}%`)
          .join(', ')
        setClipPath(`polygon(${polygonPoints})`)
      }
    }

    const drawOutline = () => {
      if (!ctx || cachedPoints.length < 3) return

      // Clear canvas
      ctx.clearRect(0, 0, cachedWidth, cachedHeight)

      // For noise gradient mode, only draw the border on canvas
      // The gradient background is handled by the CSS div with clip-path
      if (!useNoiseGradient) {
        // Build the clipping path and fill
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(cachedPoints[0].x, cachedPoints[0].y)
        for (let i = 1; i < cachedPoints.length; i++) {
          ctx.lineTo(cachedPoints[i].x, cachedPoints[i].y)
        }
        ctx.closePath()

        // Resolve CSS custom properties for canvas
        const computedStyle = getComputedStyle(container)
        const resolvedBackgroundColor = backgroundColor.includes('var(')
          ? `hsl(${computedStyle.getPropertyValue(backgroundColor.match(/var\((--[^)]+)\)/)?.[1] || '')})`
          : backgroundColor

        // Fill with background color
        ctx.fillStyle = resolvedBackgroundColor
        ctx.fill()
        ctx.restore()
      }

      // Draw the border
      ctx.beginPath()
      ctx.moveTo(cachedPoints[0].x, cachedPoints[0].y)
      for (let i = 1; i < cachedPoints.length; i++) {
        ctx.lineTo(cachedPoints[i].x, cachedPoints[i].y)
      }
      ctx.closePath()

      ctx.strokeStyle = resolvedBorderColor
      ctx.lineWidth = borderWidth
      ctx.lineJoin = 'miter'
      ctx.lineCap = 'square'
      ctx.stroke()
    }

    // Initial compute and draw with a small delay to ensure text is rendered
    const timeoutId = setTimeout(() => {
      computeOutlinePath()
      drawOutline()
    }, 50)

    // Redraw on window resize
    const handleResize = () => {
      computeOutlinePath()
      drawOutline()
    }
    window.addEventListener('resize', handleResize)

    // Observe size changes in container
    const resizeObserver = new ResizeObserver(() => {
      computeOutlinePath()
      drawOutline()
    })
    resizeObserver.observe(container)

    // Redraw when element becomes visible again
    // Android aggressively releases GPU/canvas resources when elements scroll out of view
    // This causes the canvas to go blank when scrolling back
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && needsRedraw) {
          // Force canvas redraw by getting a fresh context
          const freshCtx = canvas.getContext('2d')
          if (freshCtx) {
            computeOutlinePath()
            drawOutline()
          }
          needsRedraw = false
        } else if (!entry.isIntersecting) {
          // Mark that we'll need to redraw when visible again
          needsRedraw = true
        }
      },
      { threshold: 0 },
    )
    visibilityObserver.observe(container)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
    }
  }, [backgroundColor, borderColor, borderWidth, children, useNoiseGradient])

  // Compute canvas styles based on animation state
  const getCanvasStyle = (): React.CSSProperties => {
    switch (animationState) {
      case 'hidden':
        return {
          zIndex: 0,
          opacity: 0,
          transform: 'scale3d(1, 1, 1)',
        }
      case 'ready':
        return {
          zIndex: 0,
          opacity: 1,
          transform: 'scale3d(0, 0, 1)',
        }
      case 'animating':
        return {
          zIndex: 0,
          opacity: 1,
          transform: 'scale3d(1, 1, 1)',
          transition: 'transform 500ms ease-out',
        }
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* CSS gradient div with clip-path - contains overflow:hidden wrapper for noise */}
      {useNoiseGradient && clipPath && (
        <div
          ref={gradientRef}
          className="absolute inset-0 bg-noise-gradient-clipped pointer-events-none overflow-hidden"
          style={{
            ...getCanvasStyle(),
            transformOrigin: 'center',
            clipPath,
          }}
        >
          {/* Noise overlay - inside the clipped container with overflow:hidden */}
          <div className="noise-overlay-clipped" />
        </div>
      )}
      {/* Canvas for border (and solid fill when not using noise gradient) */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          ...getCanvasStyle(),
          transformOrigin: 'center',
        }}
      />
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
