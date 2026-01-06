'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState, useRef, useCallback } from 'react'

import type { Header } from '@/payload-types'

import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  // Scroll hide/show state
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)
  const isAnchorScrolling = useRef(false)

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  // Called when an anchor link is clicked to temporarily disable scroll hiding
  const onAnchorClick = useCallback(() => {
    isAnchorScrolling.current = true
    // Re-enable scroll hiding after the smooth scroll animation completes
    setTimeout(() => {
      isAnchorScrolling.current = false
      lastScrollY.current = window.scrollY
    }, 1000)
  }, [])

  // Handle scroll to hide/show header
  const handleScroll = useCallback(() => {
    // Skip scroll handling during anchor navigation
    if (isAnchorScrolling.current) return

    if (!ticking.current) {
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY

        if (currentScrollY < 50) {
          // Always show header near top of page
          setIsVisible(true)
        } else if (currentScrollY < lastScrollY.current) {
          // Scrolling up - show header
          setIsVisible(true)
        } else if (currentScrollY > lastScrollY.current) {
          // Scrolling down - hide header
          setIsVisible(false)
        }

        lastScrollY.current = currentScrollY
        ticking.current = false
      })
      ticking.current = true
    }
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <header
      className="fixed top-0 left-0 w-full z-20 pt-[env(safe-area-inset-top)] transition-transform duration-300 ease-out"
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
      }}
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div className="container flex justify-center md:justify-end">
        <HeaderNav data={data} onAnchorClick={onAnchorClick} />
      </div>
    </header>
  )
}
