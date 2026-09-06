"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";

export default function ShopCta({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 top-6 md:top-8 z-30 flex overflow-hidden pointer-events-none transition-opacity duration-300 ${
        scrolled ? "opacity-100" : "opacity-0"
      } md:opacity-100`}
    >
      <Link
        href={href}
        aria-label={label}
        className="pointer-events-auto inline-flex shrink-0 items-center will-change-transform hover:[animation-play-state:paused] bg-[#ff5129] border-2 border-[#E6E6FA] shadow-lg"
        style={{ animation: "marquee-loop 18s linear infinite" }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Fragment key={i}>
            <span
              aria-hidden={i >= 3}
              className="inline-flex shrink-0 items-center whitespace-nowrap font-sans font-semibold text-md uppercase tracking-widest text-[#E6E6FA] px-8 py-3 will-change-transform"
              style={{
                animation: "flag-sway 0.9s ease-in-out infinite",
              }}
            >
              {label.split("").map((ch, i) => (
                <span
                  key={i}
                  className="inline-block will-change-transform"
                  style={{
                    animation: "flag-wave 0.8s ease-in-out infinite",
                    animationDelay: `${i * 0.07}s`,
                  }}
                >
                  {ch === " " ? "  " : `${ch} `}
                </span>
              ))}
            </span>
            <span
              aria-hidden
              className="inline-flex w-[30vw] shrink-0 items-center justify-between"
            >
              {Array.from({ length: 200 }).map((d, i) => (
                <span
                  key={i}
                  style={{
                    animation: "flag-wave .7s ease-in-out infinite",
                    animationDelay: `-${i * 0.09}s`,
                  }}
                  className={`h-0.5 w-[.1vw] shrink-0  ${i % 2 === 0 ? "bg-[#ff5129]" : "bg-foreground"}`}
                />
              ))}
            </span>
          </Fragment>
        ))}
      </Link>
    </div>
  );
}
