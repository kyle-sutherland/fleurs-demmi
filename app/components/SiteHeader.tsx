<<<<<<< Updated upstream
import Link from 'next/link'
import { cookies } from 'next/headers'
import DaisyLogo from '@/app/components/DaisyLogo'
import { parseCart, cartCount } from '@/app/lib/cart'

const navLinks = [
  { href: '/shop', label: 'Shop' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
]

export async function SiteHeader({ active }: { active?: string }) {
  const cookieStore = await cookies()
  const count = cartCount(parseCart(cookieStore.get('cart')?.value))

  return (
    <header className="relative flex items-center justify-between px-8 py-6 md:flex-col md:items-center md:pt-12 md:pb-0">
      {/* Mobile logo */}
      <div className="md:hidden">
        <Link href="/"><DaisyLogo size={81} /></Link>
      </div>

      {/* Desktop: logo + nav */}
      <div className="hidden md:flex md:flex-col md:items-center md:gap-5">
        <Link href="/"><DaisyLogo size={175} /></Link>
        <nav className="flex gap-10 text-[0.992rem] font-sans tracking-widest uppercase text-foreground">
          {navLinks.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className={`hover:opacity-60 transition-opacity ${active === label.toLowerCase() ? 'underline underline-offset-4' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Desktop cart */}
      <div className="hidden md:flex items-center gap-5 absolute top-10 right-12 font-sans text-foreground">
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

      {/* Mobile: cart + hamburger */}
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
        <button className="flex flex-col gap-1.5 p-1" aria-label="Open menu">
          <span className="block w-6 h-0.5 bg-foreground" />
          <span className="block w-6 h-0.5 bg-foreground" />
        </button>
      </div>
    </header>
  )
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}
=======
import Link from 'next/link'
import { cookies } from 'next/headers'
import DaisyLogo from '@/app/components/DaisyLogo'
import { parseCart, cartCount } from '@/app/lib/cart'

const navLinks = [
  { href: '/shop', label: 'Shop' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
]

export async function SiteHeader({ active }: { active?: string }) {
  const cookieStore = await cookies()
  const count = cartCount(parseCart(cookieStore.get('cart')?.value))

  return (
    <header className="relative flex items-center justify-between px-8 py-6 md:flex-col md:items-center md:pt-12 md:pb-0">
      {/* Mobile logo */}
      <div className="md:hidden">
        <Link href="/"><DaisyLogo size={81} /></Link>
      </div>

      {/* Desktop: logo + nav */}
      <div className="hidden md:flex md:flex-col md:items-center md:gap-5">
        <Link href="/"><DaisyLogo size={175} /></Link>
        <nav className="flex gap-10 text-[0.992rem] font-sans tracking-widest uppercase text-foreground">
          {navLinks.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className={`hover:opacity-60 transition-opacity ${active === label.toLowerCase() ? 'underline underline-offset-4' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Desktop cart */}
      <div className="hidden md:flex items-center gap-5 absolute top-10 right-12 font-sans text-foreground">
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

      {/* Mobile: cart + hamburger */}
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
        <button className="flex flex-col gap-1.5 p-1" aria-label="Open menu">
          <span className="block w-6 h-0.5 bg-foreground" />
          <span className="block w-6 h-0.5 bg-foreground" />
        </button>
      </div>
    </header>
  )
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}
>>>>>>> Stashed changes
