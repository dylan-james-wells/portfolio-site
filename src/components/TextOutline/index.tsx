'use client'

import React, { useEffect, useRef, ReactNode } from 'react'
import { cn } from '@/utilities/ui'

interface TextOutlineProps {
  children: ReactNode
  className?: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const drawOutline = () => {
      const container = containerRef.current
      const canvas = canvasRef.current
      if (!container || !canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const containerRect = container.getBoundingClientRect()

      // Set canvas size to match container
      canvas.width = containerRect.width
      canvas.height = containerRect.height

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

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

      if (allRects.length === 0) return

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

      if (mergedLines.length === 0) return

      // Build the outline path - container edges for left/top/bottom, jagged right edge
      const points: { x: number; y: number }[] = []

      // Container bounds for left, top, bottom edges
      const leftEdge = 0
      const topEdge = 0
      const bottomEdge = containerRect.height

      // Start at top-left corner, go clockwise
      points.push({ x: leftEdge, y: topEdge })

      // Go right along top to first line's right edge
      points.push({ x: mergedLines[0].right, y: topEdge })

      // Trace down the jagged right edge
      for (let i = 0; i < mergedLines.length; i++) {
        const line = mergedLines[i]
        const nextLine = mergedLines[i + 1]

        if (nextLine) {
          // Step down to bottom of current line
          points.push({ x: line.right, y: line.bottom })
          // Step horizontally to next line's right edge
          points.push({ x: nextLine.right, y: line.bottom })
        } else {
          // Last line - extend down to container bottom
          points.push({ x: line.right, y: bottomEdge })
        }
      }

      // Go left along bottom
      points.push({ x: leftEdge, y: bottomEdge })

      // Close path back to start
      points.push({ x: leftEdge, y: topEdge })

      // Draw the path
      if (points.length < 3) return

      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.closePath()

      // Fill with background color
      ctx.fillStyle = backgroundColor
      ctx.fill()

      // Draw border
      ctx.strokeStyle = borderColor
      ctx.lineWidth = borderWidth
      ctx.lineJoin = 'miter'
      ctx.lineCap = 'square'
      ctx.stroke()
    }

    // Initial draw with a small delay to ensure text is rendered
    const timeoutId = setTimeout(drawOutline, 50)

    // Redraw on window resize
    const handleResize = () => drawOutline()
    window.addEventListener('resize', handleResize)

    // Observe size changes in container
    const resizeObserver = new ResizeObserver(drawOutline)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
    }
  }, [backgroundColor, borderColor, borderWidth, children])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
