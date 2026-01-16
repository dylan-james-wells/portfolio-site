'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect if the user is on an Android device.
 * Used to conditionally disable CSS features that have poor Android support
 * (clip-path, mix-blend-mode, etc.)
 *
 * Returns `null` during SSR/initial render to avoid hydration mismatch,
 * then resolves to `true` or `false` after mount.
 */
export function useIsAndroid(): boolean | null {
  const [isAndroid, setIsAndroid] = useState<boolean | null>(null)

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    setIsAndroid(/android/i.test(userAgent))
  }, [])

  return isAndroid
}
