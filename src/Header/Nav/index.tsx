'use client'

import React, { useCallback } from 'react'

import type { Header as HeaderType } from '@/payload-types'

import Link from 'next/link'
import { SearchIcon } from 'lucide-react'
import { GlitchHover } from '@/components/GlitchHover'

interface NavLinkProps {
  href: string
  label: string
  newTab?: boolean
}

const NavLink: React.FC<NavLinkProps> = ({ href, label, newTab }) => {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Check if this is a hash link for smooth scrolling
      if (href.startsWith('#')) {
        e.preventDefault()
        const targetId = href.slice(1)
        const targetElement = document.getElementById(targetId)
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' })
        }
      }
    },
    [href],
  )

  const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' as const } : {}

  return (
    <GlitchHover intensity={0.4}>
      <Link
        href={href}
        onClick={handleClick}
        className="text-primary hover:text-primary/80 transition-colors px-3 py-2"
        {...newTabProps}
      >
        {label}
      </Link>
    </GlitchHover>
  )
}

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []

  return (
    <nav className="relative bg-noise-gradient border-2 border-white rounded-sm px-2 py-1 flex gap-1 items-center">
      {navItems.map(({ link }, i) => {
        // Construct href from link data
        const href =
          link.type === 'reference' &&
          typeof link.reference?.value === 'object' &&
          link.reference.value.slug
            ? `${link.reference?.relationTo !== 'pages' ? `/${link.reference?.relationTo}` : ''}/${link.reference.value.slug}`
            : link.url || '#'

        return (
          <NavLink key={i} href={href} label={link.label || ''} newTab={link.newTab || false} />
        )
      })}
      <GlitchHover intensity={0.4}>
        <Link href="/search" className="px-3 py-2 flex items-center">
          <span className="sr-only">Search</span>
          <SearchIcon className="w-5 text-primary" />
        </Link>
      </GlitchHover>
    </nav>
  )
}
