"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, use } from "react";
import SiteHeader from "@/app/components/SiteHeader";

const vaseData: Record<string, { title: string; price: number; slides: { src: string; position?: string; fit?: string }[] }> = {
  "1": {
    title: "Sgraffito Vase",
    price: 95,
    slides: [
      { src: "/Vases/1c.jpg" },
      { src: "/Vases/2b.jpg" },
      { src: "/Vases/3b.jpg", fit: "object-contain" },
    ],
  },
  "2": {
    title: "Butter Yellow Vase",
    price: 95,
    slides: [
      { src: "/Vases/4c.jpg" },
      { src: "/Vases/5.jpg" },
    ],
  },
  "3": {
    title: "Seafoam Loop Vase",
    price: 95,
    slides: [
      { src: "/Vases/6c.jpg" },
      { src: "/Vases/7.jpg" },
    ],
  },
};

export default function VaseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; vaseId: string }>;
}) {
  const { locale, vaseId } = use(params);
  const vase = vaseData[vaseId];
  const [index, setIndex] = useState(0);

  if (!vase) {
    return (
      <div className="flex flex-col flex-1">
        <SiteHeader locale={locale} active="shop" />
        <main className="mx-12 md:mx-32 mt-10 md:mt-16">
          <p className="font-sans text-base text-foreground/60">Vase not found.</p>
          <Link href={`/${locale}/shop/vases`} className="font-sans text-sm underline mt-4 inline-block">
            ← Back to Vases
          </Link>
        </main>
      </div>
    );
  }

  const prev = () => setIndex((i) => (i - 1 + vase.slides.length) % vase.slides.length);
  const next = () => setIndex((i) => (i + 1) % vase.slides.length);

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="shop" />

      <main className="mx-12 md:mx-32 mt-10 md:mt-16">
        <Link
          href={`/${locale}/shop/vases`}
          className="font-sans text-xs uppercase tracking-widest font-semibold hover:opacity-60 transition-opacity"
        >
          ← Back
        </Link>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
          {/* Slideshow */}
          <div className="relative aspect-square w-full overflow-hidden bg-purple/10">
            <Image
              src={vase.slides[index].src}
              alt={`${vase.title} — photo ${index + 1}`}
              fill
              className={`${vase.slides[index].fit ?? "object-cover"} transition-opacity duration-300 ${vase.slides[index].position ?? "object-center"}`}
              priority
            />
            {vase.slides.length > 1 && (
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
                  {vase.slides.map((_slide, i) => (
                    <button
                      key={i}
                      onClick={() => setIndex(i)}
                      aria-label={`Go to photo ${i + 1}`}
                      className={`w-2 h-2 rounded-full transition-colors ${i === index ? "bg-foreground" : "bg-foreground/30"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4">
            <h1 className="font-display font-black text-[8.8vw] md:text-[3vw] leading-none">
              {vase.title}
            </h1>
            <p className="font-sans text-sm text-foreground/60 uppercase tracking-widest">
              One of a kind
            </p>
            <p className="font-display font-black text-2xl">${vase.price}.00</p>
            <div className="mt-2 p-4 border-2 border-dashed border-foreground/30 font-sans text-sm text-foreground/50 text-center">
              Payment integration coming soon
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
