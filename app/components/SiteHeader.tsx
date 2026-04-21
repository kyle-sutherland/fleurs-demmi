import Link from "next/link";
import DaisyLogo from "@/app/components/DaisyLogo";
import LangSwitcher from "@/app/components/LangSwitcher";
import MobileMenu from "@/app/components/MobileMenu";
import { CartBadge, CartBadgeMobile } from "@/app/components/CartBadge";
import { getDictionary } from "@/lib/i18n";

export default function SiteHeader({ locale, active }: { locale: string; active?: string }) {
  const t = getDictionary(locale);
  const links = [
    { href: `/${locale}/shop`, label: t.nav.shop, key: "shop" },
    { href: `/${locale}/services`, label: t.nav.services, key: "services" },
    { href: `/${locale}/about`, label: t.nav.about, key: "about" },
  ];

  return (
    <header className="relative flex items-center justify-end px-12 min-h-[160px] md:min-h-0 md:py-0 md:flex-col md:items-center md:justify-between md:pt-6 md:pb-0">
      <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Link href={`/${locale}`}><DaisyLogo size={116} /></Link>
      </div>
      <div className="hidden md:flex md:flex-col md:items-center md:gap-5">
        <Link href={`/${locale}`}><DaisyLogo size={175} /></Link>
        <nav className="flex gap-10 text-[0.992rem] font-sans tracking-widest uppercase text-foreground">
          {links.map(({ href, label, key }) => (
            <Link
              key={key}
              href={href}
              className={`hover:font-bold transition-colors ${active === key ? "underline underline-offset-4" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="hidden md:flex items-center gap-5 absolute top-6 right-12 font-sans text-foreground">
        <LangSwitcher locale={locale} />
        <CartBadge />
      </div>
      <div className="flex items-center gap-4 md:hidden">
        <CartBadgeMobile />
        <MobileMenu links={links} active={active} locale={locale} />
      </div>
    </header>
  );
}
