'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface RetroBootScreenProps {
  onComplete?: () => void
}

// Boot sequence messages - MS-DOS / early Windows style
const BOOT_MESSAGES = [
  { text: 'BIOS POST... OK', delay: 100 },
  { text: 'Memory Test: 640K OK', delay: 150 },
  { text: 'Extended Memory: 31457280K OK', delay: 200 },
  { text: '', delay: 100 },
  { text: 'Detecting IDE drives...', delay: 300 },
  { text: '  Primary Master: CREATIVE_WORKS_500GB', delay: 200 },
  { text: '  Primary Slave: None', delay: 100 },
  { text: '', delay: 50 },
  { text: 'Loading PORTFOLIO.SYS...', delay: 400 },
  { text: 'Initializing graphics subsystem...', delay: 300 },
  { text: 'Loading texture assets...', delay: 250 },
  { text: 'Compiling shaders... [##########] 100%', delay: 350 },
  { text: '', delay: 100 },
  { text: 'C:\\PORTFOLIO> MAKE_FUN.EXE', delay: 200 },
  { text: '', delay: 100 },
  { text: 'Starting 3D renderer...', delay: 300 },
]

export const RetroBootScreen: React.FC<RetroBootScreenProps> = ({ onComplete }) => {
  const [displayedLines, setDisplayedLines] = useState<string[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [showCursor, setShowCursor] = useState(true)
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

  // Typing animation
  useEffect(() => {
    if (!isTyping || currentLineIndex >= BOOT_MESSAGES.length) {
      if (currentLineIndex >= BOOT_MESSAGES.length) {
        // Boot sequence complete
        const timeout = setTimeout(() => {
          onComplete?.()
        }, 500)
        return () => clearTimeout(timeout)
      }
      return
    }

    const currentMessage = BOOT_MESSAGES[currentLineIndex]
    const fullText = currentMessage.text

    // Handle empty lines (just add them instantly)
    if (fullText === '') {
      setDisplayedLines((prev) => [...prev, ''])
      setCurrentLineIndex((prev) => prev + 1)
      setCurrentCharIndex(0)
      scrollToBottom()
      return
    }

    // Type character by character
    if (currentCharIndex < fullText.length) {
      // Vary typing speed for more realistic effect
      const baseSpeed = 15
      const variance = Math.random() * 20
      const speed = baseSpeed + variance

      const timeout = setTimeout(() => {
        setDisplayedLines((prev) => {
          const newLines = [...prev]
          if (newLines.length === currentLineIndex) {
            newLines.push(fullText.substring(0, currentCharIndex + 1))
          } else {
            newLines[currentLineIndex] = fullText.substring(0, currentCharIndex + 1)
          }
          return newLines
        })
        setCurrentCharIndex((prev) => prev + 1)
        scrollToBottom()
      }, speed)

      return () => clearTimeout(timeout)
    } else {
      // Line complete, wait then move to next
      const timeout = setTimeout(() => {
        setCurrentLineIndex((prev) => prev + 1)
        setCurrentCharIndex(0)
      }, currentMessage.delay)

      return () => clearTimeout(timeout)
    }
  }, [isTyping, currentLineIndex, currentCharIndex, onComplete, scrollToBottom])

  // Gradient text style (red to teal like the main theme)
  const gradientTextStyle = {
    background: 'linear-gradient(90deg, #ff6b6b 0%, #4ecdc4 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(0 0 8px rgba(255, 107, 107, 0.4)) drop-shadow(0 0 8px rgba(78, 205, 196, 0.4))',
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

      {/* Terminal content */}
      <div
        ref={containerRef}
        className="absolute inset-0 p-4 md:p-8 overflow-y-auto"
        style={gradientTextStyle}
      >
        {/* DOS header */}
        <div className="mb-4 opacity-80">
          <div>PORTFOLIO BIOS (C)2024 Creative Works Inc.</div>
          <div>Version 4.20.69</div>
          <div className="mt-2">-------------------------------------------</div>
        </div>

        {/* Boot messages */}
        {displayedLines.map((line, index) => (
          <div key={index} className="whitespace-pre-wrap min-h-[1.5em]">
            {line}
            {index === displayedLines.length - 1 &&
              isTyping &&
              currentLineIndex < BOOT_MESSAGES.length && (
                <span
                  className="inline-block w-[0.6em] h-[1.1em] ml-[1px] align-middle"
                  style={cursorStyle}
                />
              )}
          </div>
        ))}

        {/* Show cursor on empty line when between messages */}
        {displayedLines.length === currentLineIndex && currentLineIndex < BOOT_MESSAGES.length && (
          <div>
            <span className="inline-block w-[0.6em] h-[1.1em] align-middle" style={cursorStyle} />
          </div>
        )}
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
