import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'
import { FileText, Mail, Linkedin, Github } from 'lucide-react'

import type { Footer, Media } from '@/payload-types'
import { GlitchHover } from '@/components/GlitchHover'

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()

  const { resumeLinkText, resumeFile, contactEmail, linkedinUrl, githubUrl } = footerData || {}

  const resumeUrl = resumeFile && typeof resumeFile !== 'string' ? (resumeFile as Media).url : null

  return (
    <footer className="mt-auto border-t border-white border-border bg-background text-foreground z-10">
      <div className="container py-8 flex flex-row justify-between items-center">
        {resumeUrl && (
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <GlitchHover className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span>{resumeLinkText || 'Download Resume'}</span>
            </GlitchHover>
          </a>
        )}

        <div className="flex flex-row gap-4 items-center">
          {contactEmail && (
            <a
              href={`mailto:${contactEmail}`}
              aria-label="Email"
            >
              <GlitchHover>
                <Mail className="w-5 h-5" />
              </GlitchHover>
            </a>
          )}
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <GlitchHover>
                <Linkedin className="w-5 h-5" />
              </GlitchHover>
            </a>
          )}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <GlitchHover>
                <Github className="w-5 h-5" />
              </GlitchHover>
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
