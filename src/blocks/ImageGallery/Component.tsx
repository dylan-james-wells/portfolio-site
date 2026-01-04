'use client'

import React, { useState, useCallback, useEffect } from 'react'
import NextImage from 'next/image'

import type { ImageGalleryBlock as ImageGalleryBlockProps, Media } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type LayoutType = 'row' | 'grid' | 'list'

type Props = ImageGalleryBlockProps & {
  className?: string
  disableInnerContainer?: boolean
}

export const ImageGalleryBlock: React.FC<Props> = (props) => {
  const { images, layout, className } = props
  const [modalOpen, setModalOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const openModal = useCallback((index: number) => {
    setActiveIndex(index)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
  }, [])

  const goToNext = useCallback(() => {
    if (!images) return
    setActiveIndex((prev) => (prev + 1) % images.length)
  }, [images])

  const goToPrev = useCallback(() => {
    if (!images) return
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images])

  // Handle keyboard navigation
  useEffect(() => {
    if (!modalOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
      if (e.key === 'ArrowRight') goToNext()
      if (e.key === 'ArrowLeft') goToPrev()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [modalOpen, closeModal, goToNext, goToPrev])

  if (!images || images.length === 0) return null

  const smallLayout = (layout?.small || 'list') as LayoutType
  const mediumLayout = (layout?.medium || 'grid') as LayoutType
  const largeLayout = (layout?.large || 'grid') as LayoutType
  const gridColumns = layout?.gridColumns || '3'

  // Build responsive class strings for each layout mode
  const getLayoutClasses = () => {
    const classes: string[] = []

    // Small screen classes (default/mobile)
    if (smallLayout === 'row') {
      classes.push('flex', 'flex-row', 'gap-4', 'pb-4')
    } else if (smallLayout === 'grid') {
      classes.push('grid', 'gap-4')
      if (gridColumns === '2') classes.push('grid-cols-2')
      else if (gridColumns === '3') classes.push('grid-cols-3')
      else if (gridColumns === '4') classes.push('grid-cols-4')
    } else {
      classes.push('flex', 'flex-col', 'gap-4')
    }

    // Medium screen classes
    if (mediumLayout === 'row') {
      classes.push('md:!flex', 'md:flex-row', 'md:gap-6')
      if (smallLayout === 'row') classes.push('md:pb-0')
    } else if (mediumLayout === 'grid') {
      classes.push('md:!grid', 'md:gap-6')
      if (gridColumns === '2') classes.push('md:!grid-cols-2')
      else if (gridColumns === '3') classes.push('md:!grid-cols-3')
      else if (gridColumns === '4') classes.push('md:!grid-cols-4')
      if (smallLayout === 'row') classes.push('md:pb-0')
    } else {
      // List layout
      classes.push('md:!flex', 'md:flex-col', 'md:gap-6')
      if (smallLayout === 'row') classes.push('md:pb-0')
    }

    // Large screen classes
    if (largeLayout === 'row') {
      classes.push('lg:!flex', 'lg:flex-row', 'lg:gap-8')
      if (mediumLayout === 'row' || smallLayout === 'row') classes.push('lg:pb-0')
    } else if (largeLayout === 'grid') {
      classes.push('lg:!grid', 'lg:gap-8')
      if (gridColumns === '2') classes.push('lg:!grid-cols-2')
      else if (gridColumns === '3') classes.push('lg:!grid-cols-3')
      else if (gridColumns === '4') classes.push('lg:!grid-cols-4')
    } else {
      // List layout
      classes.push('lg:!flex', 'lg:flex-col', 'lg:gap-8')
    }

    return classes.join(' ')
  }

  const activeImage = images[activeIndex]
  const activeMedia = activeImage?.image as Media | undefined

  return (
    <div className={cn('my-16', className)}>
      {/* Gallery Container */}
      <div className={cn(getLayoutClasses())}>
        {images.map((item, index) => {
          const media = item.image as Media | undefined
          if (!media?.url) return null

          return (
            <button
              key={item.id || index}
              onClick={() => openModal(index)}
              className={cn(
                'relative rounded-lg cursor-pointer group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 overflow-hidden',
                // Row layout needs overflow-visible for hover effect
                smallLayout === 'row' && 'overflow-visible',
                mediumLayout === 'row' && 'md:overflow-visible',
                largeLayout === 'row' && 'lg:overflow-visible',
              )}
            >
              <NextImage
                src={getMediaUrl(media.url, media.updatedAt)}
                alt={item.caption || media.alt || ''}
                width={media.width || 800}
                height={media.height || 600}
                className={cn(
                  'rounded-lg transition-transform duration-300 md:group-hover:scale-105 w-full h-auto',
                  // Row layout: show image at natural size with max height
                  smallLayout === 'row' && 'w-auto max-h-[50vh]',
                  mediumLayout === 'row' && 'md:w-auto md:max-h-[60vh]',
                  largeLayout === 'row' && 'lg:w-auto lg:max-h-[70vh]',
                )}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {/* Hover overlay - hidden on small screens */}
              <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/20 transition-colors duration-300 rounded-lg pointer-events-none" />
              {/* Caption overlay - hidden on small screens */}
              {item.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 rounded-b-lg pointer-events-none">
                  <p className="text-white text-sm">{item.caption}</p>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Modal */}
      {modalOpen && activeMedia?.url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={closeModal} />

          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Navigation - Previous */}
          {images.length > 1 && (
            <button
              onClick={goToPrev}
              className="absolute left-4 z-10 p-2 text-white/80 hover:text-white transition-colors"
              aria-label="Previous image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Navigation - Next */}
          {images.length > 1 && (
            <button
              onClick={goToNext}
              className="absolute right-4 z-10 p-2 text-white/80 hover:text-white transition-colors"
              aria-label="Next image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          {/* Image container - sized to maximum dimensions while maintaining aspect ratio */}
          <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] flex items-center justify-center p-4">
            <div className="relative w-full h-full">
              <NextImage
                src={getMediaUrl(activeMedia.url, activeMedia.updatedAt)}
                alt={activeImage?.caption || activeMedia.alt || ''}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </div>
          </div>

          {/* Caption */}
          {activeImage?.caption && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-black/60 rounded-lg">
              <p className="text-white text-center">{activeImage.caption}</p>
            </div>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-8 right-8 z-10 px-3 py-1 bg-black/60 rounded-lg">
              <p className="text-white text-sm">
                {activeIndex + 1} / {images.length}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
