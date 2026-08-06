'use client'

import React, { useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import type { Header as HeaderType } from '@/payload-types'

import Link from 'next/link'
import { GlitchHover } from '@/components/GlitchHover'

interface NavLinkProps {
  href: string
  label: string
  newTab?: boolean
  onAnchorClick?: () => void
}

const NavLink: React.FC<NavLinkProps> = ({ href, label, newTab, onAnchorClick }) => {
  const pathname = usePathname()
  const router = useRouter()

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Check if this is a hash link
      if (href.startsWith('#')) {
        const targetId = href.slice(1)

        // Special case: #SiteFooter is the "Contact" nav item - open the contact modal
        // instead of navigating to the footer.
        if (targetId === 'SiteFooter') {
          e.preventDefault()
          onAnchorClick?.()
          window.dispatchEvent(new CustomEvent('open-contact-modal'))
          return
        }

        // For other hash links: if on homepage, scroll; otherwise navigate to homepage with hash
        if (pathname === '/') {
          e.preventDefault()
          const targetElement = document.getElementById(targetId)
          if (targetElement) {
            onAnchorClick?.()
            targetElement.scrollIntoView({ behavior: 'smooth' })
          }
        } else {
          // Navigate to homepage with the hash
          e.preventDefault()
          router.push(`/${href}`)
        }
      }
    },
    [href, onAnchorClick, pathname, router],
  )

  const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' as const } : {}

  return (
    <GlitchHover intensity={0.4}>
      <Link
        href={href}
        onClick={handleClick}
        className="text-primary hover:text-primary/80 transition-colors px-2 md:px-3 h-10 flex items-center pointer-events-auto"
        {...newTabProps}
      >
        {label}
      </Link>
    </GlitchHover>
  )
}

export const HeaderNav: React.FC<{ data: HeaderType; onAnchorClick?: () => void }> = ({
  data,
  onAnchorClick,
}) => {
  const navItems = data?.navItems || []

  return (
    <nav className="relative bg-noise-gradient border-2 border-white border-t-0 rounded-sm h-10 flex gap-1 items-center">
      {navItems.map(({ link }, i) => {
        // Construct href from link data
        const href =
          link.type === 'reference' &&
          typeof link.reference?.value === 'object' &&
          link.reference.value.slug
            ? `${link.reference?.relationTo !== 'pages' ? `/${link.reference?.relationTo}` : ''}/${link.reference.value.slug}`
            : link.url || '#'

        return (
          <NavLink
            key={i}
            href={href}
            label={link.label || ''}
            newTab={link.newTab || false}
            onAnchorClick={onAnchorClick}
          />
        )
      })}
    </nav>
  )
}
