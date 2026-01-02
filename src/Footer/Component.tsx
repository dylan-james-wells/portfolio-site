import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'
import { FileText, Mail, Linkedin, Github } from 'lucide-react'

import type { Footer, Media } from '@/payload-types'

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()

  const { resumeLinkText, resumeFile, contactEmail, linkedinUrl, githubUrl } = footerData || {}

  const resumeUrl = resumeFile && typeof resumeFile !== 'string' ? (resumeFile as Media).url : null

  console.log(footerData)
  return (
    <footer className="mt-auto border-t border-border bg-background text-foreground z-10">
      <div className="container py-8 flex flex-row justify-between items-center">
        {resumeUrl && (
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <FileText className="w-5 h-5" />
            <span>{resumeLinkText || 'Download Resume'}</span>
          </a>
        )}

        <div className="flex flex-row gap-4 items-center">
          {contactEmail && (
            <a
              href={`mailto:${contactEmail}`}
              className="hover:opacity-70 transition-opacity"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
          )}
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-70 transition-opacity"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          )}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-70 transition-opacity"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
