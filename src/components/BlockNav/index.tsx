'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { GlitchHover } from '@/components/GlitchHover'

export const BlockNav: React.FC = () => {
  const navRef = useRef<HTMLDivElement>(null)
  const [bottomOffset, setBottomOffset] = useState<number | null>(null)
  const [isTopDisabled, setIsTopDisabled] = useState(true)
  const [isBottomDisabled, setIsBottomDisabled] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Watch for modal open/close via data attribute on body
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsModalOpen(document.body.dataset.modalOpen === 'true')
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-modal-open'],
    })

    return () => observer.disconnect()
  }, [])

  // Check if there's a next block to scroll to
  const hasNextBlock = useCallback(() => {
    const blocks = document.querySelectorAll('.block-nav-target')
    const currentScrollY = window.scrollY

    for (const block of blocks) {
      const rect = block.getBoundingClientRect()
      const blockTop = rect.top + currentScrollY

      if (blockTop > currentScrollY + 100) {
        return true
      }
    }
    return false
  }, [])

  // Track scroll to stop buttons 1rem above footer and update disabled states
  const handleScroll = useCallback(() => {
    const footer = document.getElementById('SiteFooter')
    if (!footer || !navRef.current) return

    // Only apply footer overlap prevention on small screens (below md breakpoint = 48rem = 768px)
    // On larger screens, buttons are vertically centered and don't need this logic
    const isSmallScreen = window.innerWidth < 768

    if (isSmallScreen) {
      const footerRect = footer.getBoundingClientRect()
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
    } else {
      setBottomOffset(null)
    }

    // Update disabled states
    // Top button: disabled if above hero fold (40vh)
    const heroFold = window.innerHeight * 0.4
    setIsTopDisabled(window.scrollY < heroFold)

    // Bottom button: disabled if no next block to scroll to
    setIsBottomDisabled(!hasNextBlock())
  }, [hasNextBlock])

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

    // If no next block, scroll to the last block
    if (blocks.length > 0) {
      const lastBlock = blocks[blocks.length - 1]
      const rect = lastBlock.getBoundingClientRect()
      const blockTop = rect.top + currentScrollY
      window.scrollTo({ top: blockTop - 20, behavior: 'smooth' })
    }
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
            --container-right: 1rem;
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
        className={`block-nav fixed z-20 pointer-events-none flex flex-col gap-2 bottom-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 transition-all duration-150 ease-out ${
          isModalOpen ? 'opacity-0 pointer-events-none' : ''
        }`}
        style={{
          right: 'var(--container-right)',
          ...(bottomOffset !== null ? { bottom: bottomOffset, top: 'auto', transform: 'none' } : {}),
        }}
      >
        <button
          onClick={scrollToTop}
          className={`pointer-events-auto w-10 h-10 flex items-center justify-center text-white font-mono text-lg bg-noise-gradient border-2 border-white transition-opacity ${
            isTopDisabled ? 'opacity-30' : ''
          }`}
          aria-label="Scroll to top"
        >
          <GlitchHover>
            <span>↑</span>
          </GlitchHover>
        </button>
        <button
          onClick={scrollToNextBlock}
          disabled={isBottomDisabled}
          className={`w-10 h-10 flex items-center justify-center text-white font-mono text-lg bg-noise-gradient border-2 border-white transition-opacity ${
            isBottomDisabled ? 'opacity-30 pointer-events-none' : 'pointer-events-auto'
          }`}
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
