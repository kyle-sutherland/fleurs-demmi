'use client';

import Image from 'next/image';
import { useState } from 'react';

const photos = [
  '/FlowerPhotos/1.jpg',
  '/FlowerPhotos/2.jpg',
  '/FlowerPhotos/3.jpg',
  '/FlowerPhotos/4.jpg',
  '/FlowerPhotos/5.jpg',
  '/FlowerPhotos/6.jpg',
  '/FlowerPhotos/7.jpg',
  '/FlowerPhotos/8.jpg',
  '/FlowerPhotos/9.jpg',
  '/FlowerPhotos/10.jpg',
  '/FlowerPhotos/11.jpg',
];

export default function BouquetSlideshow({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIndex((i) => (i + 1) % photos.length);

  return (
    <div className={`relative ${className ?? 'aspect-square w-full'}`}>
      <Image
        src={photos[index]}
        alt={`Bouquet ${index + 1}`}
        fill
        className="object-cover"
      />
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
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to photo ${i + 1}`}
            className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-foreground' : 'bg-foreground/30'}`}
          />
        ))}
      </div>
    </div>
  );
}
