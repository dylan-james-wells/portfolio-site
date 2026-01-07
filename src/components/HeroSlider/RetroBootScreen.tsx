'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { PyramidCubes } from './PyramidCubes'

interface RetroBootScreenProps {
  onComplete?: () => void
}

// Boot sequence messages - MS-DOS / early Windows style
const BOOT_MESSAGES = [
  { text: 'BIOS POST... OK', delay: 10 },
  { text: 'Memory Test: 640K OK', delay: 10 },
  { text: 'Extended Memory: 31457280K OK', delay: 20 },
  { text: '', delay: 100 },
  { text: 'Detecting IDE drives...', delay: 30 },
  { text: '  Primary Master: CREATIVE_WORKS_500GB', delay: 20 },
  { text: '  Primary Slave: None', delay: 10 },
  { text: '', delay: 50 },
  { text: 'Loading PORTFOLIO.SYS...', delay: 40 },
  { text: 'Initializing graphics subsystem...', delay: 30 },
  { text: 'Loading texture assets...', delay: 50 },
  { text: 'Compiling shaders... [##########] 100%', delay: 50 },
  { text: '', delay: 100 },
  { text: 'C:\\PORTFOLIO> MAKE_FUN.EXE', delay: 20 },
  { text: '', delay: 100 },
  { text: 'Starting 3D renderer...', delay: 30 },
]

// How many characters to type per frame (higher = faster)
const CHARS_PER_TICK = 3
// Milliseconds between ticks
const TICK_INTERVAL_MS = 16 // ~60fps

export const RetroBootScreen: React.FC<RetroBootScreenProps> = ({ onComplete }) => {
  // Initialize with the first character already typed to avoid blank screen
  const [displayedLines, setDisplayedLines] = useState<string[]>([
    BOOT_MESSAGES[0].text.substring(0, CHARS_PER_TICK),
  ])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(CHARS_PER_TICK)
  const [showCursor, setShowCursor] = useState(true)
  const [delayRemaining, setDelayRemaining] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cursor blink effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 530)
    return () => clearInterval(cursorInterval)
  }, [])

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [])

  // Typing animation using interval for consistent speed
  useEffect(() => {
    const interval = setInterval(() => {
      // Handle delay between lines
      if (delayRemaining > 0) {
        setDelayRemaining((prev) => Math.max(0, prev - TICK_INTERVAL_MS))
        return
      }

      // Check if we're done
      if (currentLineIndex >= BOOT_MESSAGES.length) {
        clearInterval(interval)
        setTimeout(() => onComplete?.(), 100)
        return
      }

      const currentMessage = BOOT_MESSAGES[currentLineIndex]
      const fullText = currentMessage.text

      // Handle empty lines
      if (fullText === '') {
        setDisplayedLines((prev) => [...prev, ''])
        setCurrentLineIndex((prev) => prev + 1)
        setCurrentCharIndex(0)
        setDelayRemaining(currentMessage.delay)
        scrollToBottom()
        return
      }

      // Type multiple characters per tick
      const newCharIndex = Math.min(currentCharIndex + CHARS_PER_TICK, fullText.length)

      setDisplayedLines((prev) => {
        const newLines = [...prev]
        if (newLines.length === currentLineIndex) {
          newLines.push(fullText.substring(0, newCharIndex))
        } else {
          newLines[currentLineIndex] = fullText.substring(0, newCharIndex)
        }
        return newLines
      })

      if (newCharIndex >= fullText.length) {
        // Line complete, set delay and move to next
        setCurrentLineIndex((prev) => prev + 1)
        setCurrentCharIndex(0)
        setDelayRemaining(currentMessage.delay)
      } else {
        setCurrentCharIndex(newCharIndex)
      }

      scrollToBottom()
    }, TICK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [currentLineIndex, currentCharIndex, delayRemaining, onComplete, scrollToBottom])

  // Gradient text style (red to teal like the main theme)
  const gradientTextStyle = {
    background: 'linear-gradient(90deg, #ff6b6b 0%, #4ecdc4 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter:
      'drop-shadow(0 0 8px rgba(255, 107, 107, 0.4)) drop-shadow(0 0 8px rgba(78, 205, 196, 0.4))',
  } as React.CSSProperties

  // Cursor gradient colors
  const cursorStyle = showCursor
    ? {
        background: 'linear-gradient(90deg, #ff6b6b 0%, #4ecdc4 100%)',
        boxShadow: '0 0 8px rgba(255, 107, 107, 0.6), 0 0 8px rgba(78, 205, 196, 0.6)',
      }
    : {
        background: 'transparent',
        boxShadow: 'none',
      }

  return (
    <div
      className="absolute inset-0 bg-card font-mono text-sm md:text-base overflow-hidden"
      style={{
        fontFamily: '"Perfect DOS VGA 437", "Consolas", "Courier New", monospace',
      }}
    >
      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15) 0px, rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 2px)',
          backgroundSize: '100% 2px',
        }}
      />

      {/* CRT glow effect - gradient tinted */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          boxShadow:
            'inset 0 0 100px rgba(255, 107, 107, 0.02), inset 0 0 100px rgba(78, 205, 196, 0.02)',
        }}
      />

      {/* 3D Animation - always centered */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="opacity-50 md:opacity-100 scale-75 md:scale-100">
          <PyramidCubes />
        </div>
      </div>

      {/* Main content container */}
      <div className="absolute inset-0 flex items-center">
        <div className="container w-full">
          {/* Terminal content */}
          <div
            ref={containerRef}
            className="overflow-y-auto max-h-[80vh] py-4 md:py-8 md:max-w-[50%]"
            style={gradientTextStyle}
          >
            {/* Boot messages */}
            {displayedLines.map((line, index) => (
              <div key={index} className="whitespace-pre-wrap min-h-[1.5em]">
                {line}
                {index === displayedLines.length - 1 &&
                  currentLineIndex < BOOT_MESSAGES.length && (
                    <span
                      className="inline-block w-[0.6em] h-[1.1em] ml-[1px] align-middle"
                      style={cursorStyle}
                    />
                  )}
              </div>
            ))}

            {/* Show cursor on empty line when between messages */}
            {displayedLines.length === currentLineIndex &&
              currentLineIndex < BOOT_MESSAGES.length && (
                <div>
                  <span
                    className="inline-block w-[0.6em] h-[1.1em] align-middle"
                    style={cursorStyle}
                  />
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Slight vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  )
}
