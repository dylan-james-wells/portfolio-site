'use client'

import React, { useEffect, useState } from 'react'
import { FileText, Mail, Linkedin, Github } from 'lucide-react'

import type { Footer, Media } from '@/payload-types'
import { GlitchHover } from '@/components/GlitchHover'

interface FooterClientProps {
  data: Footer
}

export const FooterClient: React.FC<FooterClientProps> = ({ data }) => {
  const [glitchActive, setGlitchActive] = useState(false)

  const { resumeLinkText, resumeFile, contactEmail, linkedinUrl, githubUrl } = data || {}
  const resumeUrl = resumeFile && typeof resumeFile !== 'string' ? (resumeFile as Media).url : null

  // Listen for custom event to trigger glitch effect
  useEffect(() => {
    const handleFooterGlitch = () => {
      setGlitchActive(true)
      setTimeout(() => {
        setGlitchActive(false)
      }, 3000)
    }

    window.addEventListener('footer-glitch', handleFooterGlitch)
    return () => window.removeEventListener('footer-glitch', handleFooterGlitch)
  }, [])

  return (
    <footer
      id="SiteFooter"
      className="mt-auto border-t-2 border-white border-border text-foreground z-10 bg-noise-gradient-dark"
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
