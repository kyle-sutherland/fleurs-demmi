"use client";

import { useState } from "react";
import Link from "next/link";
import LangSwitcher from "@/app/components/LangSwitcher";

interface NavLink {
  href: string;
  label: string;
  key: string;
}

export default function MobileMenu({ links, active, locale }: { links: NavLink[]; active?: string; locale: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="flex flex-col gap-1.5 p-1"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <>
            <span className="block w-6 h-0.5 bg-foreground rotate-45 translate-y-[0.5rem]" />
            <span className="block w-6 h-0.5 bg-foreground opacity-0" />
            <span className="block w-6 h-0.5 bg-foreground -rotate-45 -translate-y-[0.5rem]" />
          </>
        ) : (
          <>
            <span className="block w-6 h-0.5 bg-foreground" />
            <span className="block w-6 h-0.5 bg-foreground" />
          </>
        )}
      </button>

      {open && (
        <nav className="absolute top-full left-0 right-0 bg-background/50 backdrop-blur-sm border-t-2 border-foreground/10 z-50 flex flex-col items-end px-12 py-8 gap-6">
          {links.map(({ href, label, key }) => (
            <Link
              key={key}
              href={href}
              onClick={() => setOpen(false)}
              className={`font-sans text-lg uppercase tracking-widest text-foreground hover:opacity-60 transition-opacity ${active === key ? "underline underline-offset-4" : ""}`}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-foreground/10">
            <LangSwitcher locale={locale} />
          </div>
        </nav>
      )}
    </>
  );
}
