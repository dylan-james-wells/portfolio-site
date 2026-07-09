/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  if (cacheTag && cacheTag !== '') {
    cacheTag = encodeURIComponent(cacheTag)
  }

  // Check if URL already has http/https protocol
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return cacheTag ? `${url}?${cacheTag}` : url
  }

  // Keep same-origin media URLs relative. Prefixing an origin made the server
  // render (NEXT_PUBLIC_SERVER_URL) differ from the client render
  // (window.location) whenever the site is viewed from any other host - a
  // hydration mismatch on every image on the page.
  return cacheTag ? `${url}?${cacheTag}` : url
}
