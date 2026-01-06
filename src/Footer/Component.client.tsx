'use client'

import React, { useEffect, useState, useRef } from 'react'
import { FileText, Mail, Linkedin, Github } from 'lucide-react'

import type { Footer, Media } from '@/payload-types'
import { GlitchHover } from '@/components/GlitchHover'
import { cn } from '@/utilities/ui'

interface FooterClientProps {
  data: Footer
}

export const FooterClient: React.FC<FooterClientProps> = ({ data }) => {
  const [glitchActive, setGlitchActive] = useState(false)
  const [bounceActive, setBounceActive] = useState(false)
  const [pendingAnimation, setPendingAnimation] = useState(false)
  const footerRef = useRef<HTMLElement>(null)
  const glitchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const bounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { resumeLinkText, resumeFile, contactEmail, linkedinUrl, githubUrl } = data || {}
  const resumeUrl = resumeFile && typeof resumeFile !== 'string' ? (resumeFile as Media).url : null

  // Listen for custom event to trigger glitch and bounce effects
  useEffect(() => {
    const handleFooterGlitch = () => {
      // Clear existing timeouts to reset animation duration
      if (glitchTimeoutRef.current) {
        clearTimeout(glitchTimeoutRef.current)
      }
      if (bounceTimeoutRef.current) {
        clearTimeout(bounceTimeoutRef.current)
      }

      // Set pending animation - will trigger when footer is in view
      setPendingAnimation(true)
      setGlitchActive(true)
      glitchTimeoutRef.current = setTimeout(() => {
        setGlitchActive(false)
      }, 3000)
    }

    window.addEventListener('footer-glitch', handleFooterGlitch)
    return () => {
      window.removeEventListener('footer-glitch', handleFooterGlitch)
      // Clean up timeouts on unmount
      if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current)
      if (bounceTimeoutRef.current) clearTimeout(bounceTimeoutRef.current)
    }
  }, [])

  // Watch for footer visibility to trigger bounce animation
  useEffect(() => {
    if (!pendingAnimation || !footerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && pendingAnimation) {
          // Clear existing bounce timeout to reset duration on repeated clicks
          if (bounceTimeoutRef.current) {
            clearTimeout(bounceTimeoutRef.current)
          }

          setBounceActive(true)
          setPendingAnimation(false)
          bounceTimeoutRef.current = setTimeout(() => {
            setBounceActive(false)
          }, 3000)
        }
      },
      { threshold: 0.5 },
    )

    observer.observe(footerRef.current)

    return () => observer.disconnect()
  }, [pendingAnimation])

  return (
    <footer
      ref={footerRef}
      id="SiteFooter"
      className={cn(
        'absolute bottom-0 left-0 right-0 border-t-2 border-white text-foreground z-10 bg-noise-gradient-dark origin-bottom transition-transform duration-300 ease-out',
        bounceActive && 'animate-bounce-scale',
      )}
    >
      <div className="container py-8 flex flex-row justify-between items-center">
        {resumeUrl && (
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <GlitchHover className="flex items-center gap-2" active={glitchActive}>
              <FileText className="w-5 h-5" />
              <span>{resumeLinkText || 'Download Resume'}</span>
            </GlitchHover>
          </a>
        )}

        <div className="flex flex-row gap-4 items-center">
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} aria-label="Email">
              <GlitchHover active={glitchActive}>
                <Mail className="w-5 h-5" />
              </GlitchHover>
            </a>
          )}
          {linkedinUrl && (
            <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <GlitchHover active={glitchActive}>
                <Linkedin className="w-5 h-5" />
              </GlitchHover>
            </a>
          )}
          {githubUrl && (
            <a href={githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <GlitchHover active={glitchActive}>
                <Github className="w-5 h-5" />
              </GlitchHover>
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
