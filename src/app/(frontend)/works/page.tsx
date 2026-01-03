import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload, PaginatedDocs } from 'payload'
import React from 'react'
import PageClient from './page.client'
import { CardWorkData } from '@/components/Card'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function Page() {
  let works: PaginatedDocs<CardWorkData> | null = null

  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'works',
      depth: 1,
      limit: 12,
      overrideAccess: false,
      select: {
        title: true,
        slug: true,
        categories: true,
        meta: true,
      },
    })
    works = result as PaginatedDocs<CardWorkData>
  } catch {
    // Works table may not exist yet during initial migration
  }

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Works</h1>
        </div>
      </div>

      {works && (
        <>
          <div className="container mb-8">
            <PageRange
              collection="works"
              currentPage={works.page}
              limit={12}
              totalDocs={works.totalDocs}
            />
          </div>

          <CollectionArchive works={works.docs} relationTo="works" />

          <div className="container">
            {works.totalPages > 1 && works.page && (
              <Pagination page={works.page} totalPages={works.totalPages} />
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Works`,
  }
}
