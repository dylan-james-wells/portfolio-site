'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/utilities/ui'

interface VideoPlaneProps {
  videoUrl: string
  posterUrl?: string
  className?: string
}

export const VideoPlane: React.FC<VideoPlaneProps> = ({ videoUrl, posterUrl, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  const [lowPowerMode, setLowPowerMode] = useState(false)
  const [isAndroid, setIsAndroid] = useState<boolean | null>(null)

  // Detect Android
  useEffect(() => {
    setIsAndroid(/(android)/i.test(navigator.userAgent))
  }, [])

  // Attempt to play video once Android detection is complete
  useEffect(() => {
    if (!videoRef.current || isAndroid === null) return

    const video = videoRef.current

    // Android has issues with programmatic play, skip the attempt
    if (!isAndroid) {
      video.play()
        .then(() => {
          // Video playing successfully
        })
        .catch((error) => {
          if (error.name === 'NotAllowedError') {
            setLowPowerMode(true)
          }
        })
    }
  }, [isAndroid])

  return (
    <div className={cn('aspect-square w-full relative overflow-hidden', className)}>
      {lowPowerMode ? (
        // iOS low power mode fallback - img tag with mp4 works for short loops
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={videoUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          controls={false}
          muted
          playsInline
          autoPlay
          poster={posterUrl}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}
    </div>
  )
}
