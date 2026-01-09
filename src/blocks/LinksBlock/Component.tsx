import type { LinksBlock as LinksBlockProps } from '@/payload-types'

import { cn } from '@/utilities/ui'
import React from 'react'
import { Laptop, Paperclip, Github, Linkedin } from 'lucide-react'
import { GlitchHover } from '@/components/GlitchHover'

// Steam icon is not in lucide-react, so we create a simple SVG component
const SteamIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8v-2.05c-3.45-.89-6-4.02-6-7.75 0-4.42 3.58-8 8-8s8 3.58 8 8c0 3.73-2.55 6.86-6 7.75v2.05c4.56-.93 8-4.96 8-9.8 0-5.52-4.48-10-10-10zm-1.5 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
  </svg>
)

const iconMap = {
  laptop: Laptop,
  paperclip: Paperclip,
  github: Github,
  linkedin: Linkedin,
  steam: SteamIcon,
}

type Props = {
  className?: string
} & LinksBlockProps

export const LinksBlockComponent: React.FC<Props> = ({ className, links }) => {
  if (!links || links.length === 0) return null

  return (
    <div className={cn('container', className)}>
      <div className="flex flex-wrap justify-center gap-8 py-8">
        {links.map((link, index) => {
          const IconComponent = iconMap[link.icon as keyof typeof iconMap]
          if (!IconComponent) return null

          return (
            <GlitchHover key={index}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center bg-black/50">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm text-white text-center font-mono">{link.label}</span>
              </a>
            </GlitchHover>
          )
        })}
      </div>
    </div>
  )
}
