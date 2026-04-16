import Link from "next/link";
import { cookies } from "next/headers";
import DaisyLogo from "@/app/components/DaisyLogo";
import LangSwitcher from "@/app/components/LangSwitcher";
import MobileMenu from "@/app/components/MobileMenu";
import { getDictionary } from "@/lib/i18n";
import { parseCart, cartCount } from "@/app/lib/cart";

export default async function SiteHeader({ locale, active }: { locale: string; active?: string }) {
  const t = getDictionary(locale);
  const cookieStore = await cookies();
  const count = cartCount(parseCart(cookieStore.get("cart")?.value));
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
              className={`hover:opacity-60 transition-opacity ${active === key ? "underline underline-offset-4" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="hidden md:flex items-center gap-5 absolute top-6 right-12 font-sans text-foreground">
        <LangSwitcher locale={locale} />
        <Link href="/cart" className="relative flex items-center gap-1.5 text-xs font-semibold hover:opacity-60 transition-opacity">
          <CartIcon />
          {count > 0 && (
            <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] font-bold leading-none w-4 h-4 rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
          {count === 0 && <span>0</span>}
        </Link>
      </div>
      <div className="flex items-center gap-4 md:hidden">
        <Link href="/cart" className="relative flex items-center gap-1 hover:opacity-60 transition-opacity">
          <CartIcon />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-foreground text-background text-[9px] font-bold leading-none w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
          {count === 0 && <span className="text-xs font-sans font-semibold">0</span>}
        </Link>
        <MobileMenu links={links} active={active} locale={locale} />
      </div>
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
