import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

import type { Footer as FooterType } from '@/payload-types'
import { FooterClient } from './Component.client'

export async function Footer() {
  const footerData: FooterType = await getCachedGlobal('footer', 1)()

  return <FooterClient data={footerData} />
}
