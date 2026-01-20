import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: 'Dylan Wells - Web Developer',
  images: [
    {
      url: `${getServerSideURL()}/share-image.jpg`,
    },
  ],
  siteName: 'Dylan Wells - Web Developer',
  title: 'Dylan Wells - Web Developer',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
