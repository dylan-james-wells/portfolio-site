import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

import type { Footer, Header } from '@/payload-types'
import { ContactModal } from '@/components/ContactModal'

export async function Header() {
  const headerData: Header = await getCachedGlobal('header', 1)()
  const footerData: Footer = await getCachedGlobal('footer', 1)()

  return (
    <>
      <HeaderClient data={headerData} />
      <ContactModal footer={footerData} />
    </>
  )
}
