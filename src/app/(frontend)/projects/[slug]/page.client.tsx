'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { BlockNav } from '@/components/BlockNav'
import React, { useEffect } from 'react'

const PageClient: React.FC = () => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])
  return <BlockNav />
}

export default PageClient
