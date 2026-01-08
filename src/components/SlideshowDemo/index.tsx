'use client'

import React, { useState, useRef } from 'react'
import { Slideshow, SlideshowHandle, SlideData, TransitionStyle } from '@dylanwells/react-3d-slideshow'
import { cn } from '@/utilities/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const demoSlides: SlideData[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1200&h=800&fit=crop',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&h=800&fit=crop',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&h=800&fit=crop',
  },
]

const transitionStyles: TransitionStyle[] = ['glitch', 'cascade', 'cube']

const aspectRatioOptions = [
  { value: '16:9', label: '16:9' },
  { value: '4:3', label: '4:3' },
  { value: '3:2', label: '3:2' },
  { value: '1:1', label: '1:1' },
  { value: '2:3', label: '2:3 (Portrait)' },
]

interface SlideshowDemoProps {
  className?: string
}

export const SlideshowDemo: React.FC<SlideshowDemoProps> = ({ className }) => {
  const [selectedStyle, setSelectedStyle] = useState<TransitionStyle>('glitch')
  const [autoPlay, setAutoPlay] = useState(false)
  const [loop, setLoop] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [aspectRatio, setAspectRatio] = useState('3:2')
  const [cubeTransitionDuration, setCubeTransitionDuration] = useState(800)
  const [glitchAberration, setGlitchAberration] = useState(0.5)
  const [glitchScanlines, setGlitchScanlines] = useState(0.5)
  const [glitchGrain, setGlitchGrain] = useState(0.5)
  const [fullscreen, setFullscreen] = useState(false)
  const [cascadeMinTiles, setCascadeMinTiles] = useState(15)
  const [autoPlayInterval, setAutoPlayInterval] = useState(3000)
  const slideshowRef = useRef<SlideshowHandle>(null)

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index)
  }

  const parseAspectRatio = (ratio: string): number => {
    const [w, h] = ratio.split(':').map(Number)
    return w && h ? w / h : 3 / 2
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        {/* Transition Style */}
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground">Transition</Label>
          <Select value={selectedStyle} onValueChange={(v) => setSelectedStyle(v as TransitionStyle)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {transitionStyles.map((style) => (
                <SelectItem key={style} value={style}>
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Aspect Ratio - for cascade and glitch */}
        {(selectedStyle === 'cascade' || selectedStyle === 'glitch') && (
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {aspectRatioOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Cascade-specific: Min Tiles */}
        {selectedStyle === 'cascade' && (
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">Min Tiles: {cascadeMinTiles}</Label>
            <input
              type="range"
              className="w-[120px] h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
              value={cascadeMinTiles}
              min={3}
              max={30}
              step={1}
              onChange={(e) => setCascadeMinTiles(Number(e.target.value))}
            />
          </div>
        )}

        {/* Cube-specific: Duration */}
        {selectedStyle === 'cube' && (
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">Duration: {cubeTransitionDuration}ms</Label>
            <input
              type="range"
              className="w-[120px] h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
              value={cubeTransitionDuration}
              min={200}
              max={2000}
              step={100}
              onChange={(e) => setCubeTransitionDuration(Number(e.target.value))}
            />
          </div>
        )}

        {/* Glitch-specific controls */}
        {selectedStyle === 'glitch' && (
          <>
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground">Aberration: {Math.round(glitchAberration * 100)}%</Label>
              <input
                type="range"
                className="w-[100px] h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                value={glitchAberration}
                min={0}
                max={1}
                step={0.1}
                onChange={(e) => setGlitchAberration(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground">Scanlines: {Math.round(glitchScanlines * 100)}%</Label>
              <input
                type="range"
                className="w-[100px] h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                value={glitchScanlines}
                min={0}
                max={1}
                step={0.1}
                onChange={(e) => setGlitchScanlines(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground">Grain: {Math.round(glitchGrain * 100)}%</Label>
              <input
                type="range"
                className="w-[100px] h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                value={glitchGrain}
                min={0}
                max={1}
                step={0.1}
                onChange={(e) => setGlitchGrain(Number(e.target.value))}
              />
            </div>
          </>
        )}

        {/* Fullscreen toggle - for cascade and glitch */}
        {(selectedStyle === 'cascade' || selectedStyle === 'glitch') && (
          <div className="flex items-center gap-2 h-10">
            <Checkbox
              id="fullscreen"
              checked={fullscreen}
              onCheckedChange={(checked) => setFullscreen(checked === true)}
            />
            <Label htmlFor="fullscreen" className="text-muted-foreground cursor-pointer">
              Fullscreen
            </Label>
          </div>
        )}

        {/* Auto Play */}
        <div className="flex items-center gap-2 h-10">
          <Checkbox
            id="autoplay"
            checked={autoPlay}
            onCheckedChange={(checked) => setAutoPlay(checked === true)}
          />
          <Label htmlFor="autoplay" className="text-muted-foreground cursor-pointer">
            Auto Play
          </Label>
        </div>

        {/* Auto Play Interval */}
        {autoPlay && (
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">Interval: {(autoPlayInterval / 1000).toFixed(1)}s</Label>
            <input
              type="range"
              className="w-[100px] h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
              value={autoPlayInterval}
              min={1000}
              max={10000}
              step={500}
              onChange={(e) => setAutoPlayInterval(Number(e.target.value))}
            />
          </div>
        )}

        {/* Loop */}
        <div className="flex items-center gap-2 h-10">
          <Checkbox
            id="loop"
            checked={loop}
            onCheckedChange={(checked) => setLoop(checked === true)}
          />
          <Label htmlFor="loop" className="text-muted-foreground cursor-pointer">
            Loop
          </Label>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => slideshowRef.current?.prev()}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => slideshowRef.current?.next()}
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Slideshow */}
      <div className="rounded-lg overflow-hidden border border-border">
        <Slideshow
          ref={slideshowRef}
          slides={demoSlides}
          style={selectedStyle}
          autoPlay={autoPlay}
          autoPlayInterval={autoPlayInterval}
          loop={loop}
          transitionDuration={selectedStyle === 'cube' ? cubeTransitionDuration : 800}
          height={500}
          onSlideChange={handleSlideChange}
          showControls
          showIndicators
          enableSwipe
          enableKeyboard
          cascadeMinTiles={cascadeMinTiles}
          aspectRatio={parseAspectRatio(aspectRatio)}
          glitchAberration={glitchAberration}
          glitchScanlines={glitchScanlines}
          glitchGrain={glitchGrain}
          fullscreen={fullscreen}
        />
      </div>

      {/* Info Bar */}
      <div className="mt-4 px-4 py-3 bg-card rounded-lg border border-border text-sm text-muted-foreground">
        <span>Slide {currentSlide + 1} / {demoSlides.length}</span>
        <span className="mx-2">|</span>
        <span>Style: <code className="bg-background px-1.5 py-0.5 rounded text-foreground">{selectedStyle}</code></span>
        {(selectedStyle === 'cascade' || selectedStyle === 'glitch') && (
          <>
            <span className="mx-2">|</span>
            <span>Aspect: <code className="bg-background px-1.5 py-0.5 rounded text-foreground">{aspectRatio}</code></span>
          </>
        )}
        {selectedStyle === 'cascade' && (
          <>
            <span className="mx-2">|</span>
            <span>Tiles: <code className="bg-background px-1.5 py-0.5 rounded text-foreground">{cascadeMinTiles}</code></span>
          </>
        )}
        {selectedStyle === 'cube' && (
          <>
            <span className="mx-2">|</span>
            <span>Duration: <code className="bg-background px-1.5 py-0.5 rounded text-foreground">{cubeTransitionDuration}ms</code></span>
          </>
        )}
        {selectedStyle === 'glitch' && (
          <>
            <span className="mx-2">|</span>
            <span>Aberration: <code className="bg-background px-1.5 py-0.5 rounded text-foreground">{Math.round(glitchAberration * 100)}%</code></span>
          </>
        )}
        <span className="mx-2">|</span>
        <span className="hidden sm:inline">Use arrow keys or swipe to navigate</span>
      </div>
    </div>
  )
}

export default SlideshowDemo
