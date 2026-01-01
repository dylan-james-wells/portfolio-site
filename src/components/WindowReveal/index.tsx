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
  const [isInViewport, setIsInViewport] = useState(false)

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

  return (
    <div ref={containerRef} className={className}>
      <div className="window"></div>
      <div ref={contentRef} style={{ opacity: 0 }}>
        {children}
      </div>
    </div>
  )
}
