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

export const WindowReveal: React.FC<WindowRevealProps> = ({ children, className }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 })

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

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        visibility: 'hidden',
        position: 'relative',
      }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  )
}
