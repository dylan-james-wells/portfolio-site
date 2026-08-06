'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Github, Linkedin, Mail, X } from 'lucide-react'

import type { Footer, Media } from '@/payload-types'
import { GlitchHover } from '@/components/GlitchHover'

interface ContactModalProps {
  footer: Footer
}

// "https://www.linkedin.com/in/dylan-wells-542133104/" -> "/in/dylan-wells-542133104"
function getPathname(url: string): string | null {
  try {
    const { pathname } = new URL(url)
    const trimmed = pathname.replace(/\/+$/, '')
    return trimmed || null
  } catch {
    return null
  }
}

// "https://github.com/dylan-james-wells" -> "@dylan-james-wells"
function getHandle(url: string): string | null {
  const pathname = getPathname(url)
  if (!pathname) return null
  const segments = pathname.split('/').filter(Boolean)
  const last = segments[segments.length - 1]
  return last ? `@${last}` : null
}

const ROW_CLASS =
  'flex flex-row items-center gap-[14px] px-[18px] py-[14px] border-2 border-white bg-[hsl(249_23%_9%)] hover:bg-[hsl(249_23%_13%)] transition-colors'

const DETAIL_CLASS = 'ml-auto text-[13px] text-muted-foreground truncate'

export const ContactModal: React.FC<ContactModalProps> = ({ footer }) => {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const openRef = useRef(false)

  useEffect(() => {
    openRef.current = open
  }, [open])

  const { resumeLinkText, resumeFile, contactEmail, linkedinUrl, githubUrl } = footer || {}
  const resumeUrl =
    resumeFile && typeof resumeFile === 'object' ? (resumeFile as Media).url || null : null

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Open on the nav's custom event
  useEffect(() => {
    const handleOpen = () => {
      // Only capture the trigger element on a fresh open, so a repeat dispatch
      // doesn't overwrite it with the modal's own close button.
      if (!openRef.current) {
        previouslyFocusedRef.current = document.activeElement as HTMLElement | null
      }
      setOpen(true)
    }

    window.addEventListener('open-contact-modal', handleOpen)
    return () => window.removeEventListener('open-contact-modal', handleOpen)
  }, [])

  // Scroll lock, body flag for BlockNav, Escape + focus trap
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        return
      }

      if (e.key !== 'Tab' || !dialogRef.current) return

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return

      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      const active = document.activeElement

      if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.body.style.overflow = 'hidden'
    document.body.dataset.modalOpen = 'true'
    window.addEventListener('keydown', handleKeyDown)

    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = ''
      delete document.body.dataset.modalOpen
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, close])

  // Restore focus to whatever opened the modal
  useEffect(() => {
    if (open) return
    previouslyFocusedRef.current?.focus()
    previouslyFocusedRef.current = null
  }, [open])

  if (!mounted || !open) return null

  const linkedinDetail = linkedinUrl ? getPathname(linkedinUrl) : null
  const githubDetail = githubUrl ? getHandle(githubUrl) : null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,8,20,0.78)] backdrop-blur-[3px] animate-contact-overlay-in"
      onClick={close}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Contact"
        className="relative w-[620px] max-w-[calc(100vw-48px)] animate-contact-dialog-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Echo frame */}
        <div
          aria-hidden="true"
          className="absolute top-[10px] left-[10px] right-[-10px] bottom-[-10px] border-2 border-white/55 pointer-events-none"
        />

        {/* Panel */}
        <div className="relative border-2 border-white rounded-none bg-noise-gradient overflow-hidden">
          {/* Title bar */}
          <div className="flex flex-row items-center justify-between px-[28px] py-[22px] border-b-2 border-white">
            <h2
              className="font-headline text-[18px] tracking-[1px] text-white"
              style={{
                textShadow: '2px 0 0 rgba(217,38,38,0.6), -2px 0 0 rgba(38,157,217,0.6)',
              }}
            >
              Contact
            </h2>
            <GlitchHover intensity={0.45}>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                aria-label="Close"
                className="w-9 h-9 flex items-center justify-center bg-transparent border-2 border-white text-white hover:bg-white hover:text-[hsl(249_23%_7%)] transition-colors"
              >
                <X className="w-[18px] h-[18px]" strokeWidth={2} />
              </button>
            </GlitchHover>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-[22px] px-[28px] pt-[26px] pb-[30px]">
            <p className="font-mono text-[15px] leading-[1.8] text-[hsl(210_40%_92%)]">
              Have a project in mind, or just want to say hi? My inbox is always{' '}
              <strong className="font-extrabold">open</strong> — I read everything and usually reply
              within a <strong className="font-extrabold">day</strong>.
            </p>

            <div className="flex flex-col gap-3">
              {contactEmail && (
                <GlitchHover intensity={0.45} className="block">
                  <a href={`mailto:${contactEmail}`} className={ROW_CLASS}>
                    <Mail className="w-5 h-5 shrink-0" strokeWidth={2} />
                    <span className="text-[15px] font-bold">Email</span>
                    <span className={DETAIL_CLASS}>{contactEmail}</span>
                  </a>
                </GlitchHover>
              )}

              {linkedinUrl && (
                <GlitchHover intensity={0.45} className="block">
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ROW_CLASS}
                  >
                    <Linkedin className="w-5 h-5 shrink-0" strokeWidth={2} />
                    <span className="text-[15px] font-bold">LinkedIn</span>
                    {linkedinDetail && <span className={DETAIL_CLASS}>{linkedinDetail}</span>}
                  </a>
                </GlitchHover>
              )}

              {githubUrl && (
                <GlitchHover intensity={0.45} className="block">
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ROW_CLASS}
                  >
                    <Github className="w-5 h-5 shrink-0" strokeWidth={2} />
                    <span className="text-[15px] font-bold">GitHub</span>
                    {githubDetail && <span className={DETAIL_CLASS}>{githubDetail}</span>}
                  </a>
                </GlitchHover>
              )}
            </div>

            {resumeUrl && (
              <div className="pt-[18px] border-t-2 border-white/25">
                <GlitchHover intensity={0.45}>
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-row items-center gap-2 text-[14px]"
                  >
                    <FileText className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
                    <span>{resumeLinkText || 'Download Resume'}</span>
                  </a>
                </GlitchHover>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
