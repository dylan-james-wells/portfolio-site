import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload, PaginatedDocs } from 'payload'
import React from 'react'
import PageClient from '../../page.client'
import { notFound } from 'next/navigation'
import { CardWorkData } from '@/components/Card'

export const revalidate = 600

type Args = {
  params: Promise<{
    pageNumber: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { pageNumber } = await paramsPromise

  const sanitizedPageNumber = Number(pageNumber)

  if (!Number.isInteger(sanitizedPageNumber)) notFound()

  let works: PaginatedDocs<CardWorkData> | null = null

  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'works',
      depth: 1,
      limit: 12,
      page: sanitizedPageNumber,
      overrideAccess: false,
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
            {works?.page && works?.totalPages > 1 && (
              <Pagination page={works.page} totalPages={works.totalPages} />
            )}
          </div>
        </>
      )}
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber } = await paramsPromise
  return {
    title: `Works Page ${pageNumber || ''}`,
  }
}

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const { totalDocs } = await payload.count({
      collection: 'works',
      overrideAccess: false,
    })

    const totalPages = Math.ceil(totalDocs / 10)

    const pages: { pageNumber: string }[] = []

    for (let i = 1; i <= totalPages; i++) {
      pages.push({ pageNumber: String(i) })
    }

    return pages
  } catch {
    // Return empty array if works table doesn't exist yet (during initial migration)
    return []
  }
}
