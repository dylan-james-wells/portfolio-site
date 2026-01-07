'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { GlitchHover } from '@/components/GlitchHover'

export const BlockNav: React.FC = () => {
  const navRef = useRef<HTMLDivElement>(null)
  const [bottomOffset, setBottomOffset] = useState<number | null>(null)

  // Track scroll to stop buttons 1rem above footer
  const handleScroll = useCallback(() => {
    const footer = document.getElementById('SiteFooter')
    if (!footer || !navRef.current) return

    const footerRect = footer.getBoundingClientRect()
    const navHeight = navRef.current.offsetHeight
    const gapAboveFooter = 16 // 1rem in pixels
    const defaultBottom = 16 // default bottom-4 position

    // Calculate where the bottom of the nav would be with default positioning
    const navBottomWithDefault = window.innerHeight - defaultBottom

    // Calculate where footer top is
    const footerTop = footerRect.top

    // If nav would overlap with footer (within gap), push it up
    if (navBottomWithDefault > footerTop - gapAboveFooter) {
      // Position nav so its bottom is 1rem above footer top
      const newBottom = window.innerHeight - footerTop + gapAboveFooter
      setBottomOffset(newBottom)
    } else {
      setBottomOffset(null)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    handleScroll() // Initial check
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [handleScroll])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToNextBlock = () => {
    const blocks = document.querySelectorAll('.block-nav-target')
    const currentScrollY = window.scrollY

    // Find the next block that's below the current viewport top
    for (const block of blocks) {
      const rect = block.getBoundingClientRect()
      const blockTop = rect.top + currentScrollY

      // If block top is more than 100px below current scroll position, scroll to it
      if (blockTop > currentScrollY + 100) {
        window.scrollTo({ top: blockTop - 20, behavior: 'smooth' })
        return
      }
    }

    // If no next block, scroll to bottom
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  return (
    <>
      <style>{`
        .block-nav {
          --container-right: 1rem;
        }
        @media (min-width: 40rem) {
          .block-nav {
            --container-right: calc((100vw - 40rem) / 2 + 1rem);
          }
        }
        @media (min-width: 48rem) {
          .block-nav {
            --container-right: calc((100vw - 48rem) / 2 + 2rem);
          }
        }
        @media (min-width: 64rem) {
          .block-nav {
            --container-right: calc((100vw - 64rem) / 2 + 2rem);
          }
        }
        @media (min-width: 80rem) {
          .block-nav {
            --container-right: calc((100vw - 80rem) / 2 + 2rem);
          }
        }
        @media (min-width: 86rem) {
          .block-nav {
            --container-right: calc((100vw - 86rem) / 2 + 2rem);
          }
        }
      `}</style>
      <div
        ref={navRef}
        className="block-nav fixed z-20 pointer-events-none flex flex-col gap-2 bottom-4 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 transition-[bottom] duration-150 ease-out"
        style={{
          right: 'var(--container-right)',
          ...(bottomOffset !== null ? { bottom: bottomOffset, top: 'auto', transform: 'none' } : {}),
        }}
      >
        <button
          onClick={scrollToTop}
          className="pointer-events-auto w-10 h-10 flex items-center justify-center text-white font-mono text-lg bg-noise-gradient border-2 border-white"
          aria-label="Scroll to top"
        >
          <GlitchHover>
            <span>↑</span>
          </GlitchHover>
        </button>
        <button
          onClick={scrollToNextBlock}
          className="pointer-events-auto w-10 h-10 flex items-center justify-center text-white font-mono text-lg bg-noise-gradient border-2 border-white"
          aria-label="Scroll to next section"
        >
          <GlitchHover>
            <span>↓</span>
          </GlitchHover>
        </button>
      </div>
    </>
  )
}
