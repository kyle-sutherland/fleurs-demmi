"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LangSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname();
  const other = locale === "en" ? "fr" : "en";
  const otherLabel = locale === "en" ? "Français" : "English";
  const otherPath = pathname.replace(`/${locale}`, `/${other}`);

  return (
    <Link
      href={otherPath}
      className="font-sans text-xs font-semibold uppercase tracking-widest hover:opacity-60 transition-opacity"
    >
      {otherLabel}
    </Link>
  );
}
