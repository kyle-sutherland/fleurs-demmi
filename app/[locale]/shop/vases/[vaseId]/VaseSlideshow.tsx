'use client'

import Image from 'next/image'
import { useState } from 'react'

type Slide = { src: string; position?: string; fit?: string }

export function VaseSlideshow({ slides, title }: { slides: Slide[]; title: string }) {
  const [index, setIndex] = useState(0)
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length)
  const next = () => setIndex((i) => (i + 1) % slides.length)

  return (
    <div className="relative aspect-square w-full overflow-hidden bg-purple/10">
      {slides.length > 0 ? (
        <Image
          src={slides[index].src}
          alt={`${title} — photo ${index + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={`${slides[index].fit ?? 'object-cover'} transition-opacity duration-300 ${slides[index].position ?? 'object-center'}`}
          priority
        />
      ) : (
        <div className="w-full h-full bg-foreground/5" />
      )}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background transition-colors px-3 py-2 font-sans text-sm font-semibold text-foreground"
          >
            ←
          </button>
          <button
            onClick={next}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background transition-colors px-3 py-2 font-sans text-sm font-semibold text-foreground"
          >
            →
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_slide, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to photo ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-foreground' : 'bg-foreground/30'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
