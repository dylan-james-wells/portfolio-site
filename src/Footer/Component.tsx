import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer, Media } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()

  const { resumeLinkText, resumeFile, contactEmail, linkedinUrl, githubUrl } = footerData || {}

  const resumeUrl =
    resumeFile && typeof resumeFile !== 'string' ? (resumeFile as Media).url : null

  return (
    <footer className="mt-auto border-t border-border bg-black text-white z-10">
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
        <Link className="flex items-center" href="/">
          <Logo />
        </Link>

        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          {resumeUrl && (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline"
            >
              {resumeLinkText || 'Download Resume'}
            </a>
          )}
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} className="text-white hover:underline">
              {contactEmail}
            </a>
          )}
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline"
            >
              LinkedIn
            </a>
          )}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline"
            >
              GitHub
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
