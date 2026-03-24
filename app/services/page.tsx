import Link from "next/link";
import Image from "next/image";
import DaisyLogo from "@/app/components/DaisyLogo";

export const metadata = {
  title: "Services — Fleurs d'Emmi",
};

export default function ServicesPage() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader active="services" />

      <main className="mx-8 md:mx-32 mt-10 md:mt-16 pb-24">
        <h1 className="font-display font-black text-[14vw] md:text-[6vw] leading-none">
          Services
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          <Link
            href="/services/weddings"
            className="group flex flex-col overflow-hidden rounded-2xl border-2 border-foreground/10 hover:border-foreground/30 transition-colors"
          >
            <div className="relative aspect-[4/3] bg-purple/20 overflow-hidden">
              <Image src="/Flower Photos/Wedding Flowers 3.jpg" alt="Weddings & Special Events" fill className="object-cover object-top" />
            </div>
            <div className="p-6">
              <p className="font-display font-black text-2xl md:text-3xl leading-tight group-hover:underline">
                Weddings &<br />Special Events
              </p>
              <p className="font-sans text-sm mt-3 text-foreground/70 leading-relaxed">
                DIY floral buckets, à la carte arrangements, and full installations.
                Request a custom quote.
              </p>
              <span className="inline-block mt-4 font-sans text-xs uppercase tracking-widest font-semibold underline underline-offset-4">
                Learn more →
              </span>
            </div>
          </Link>

          <Link
            href="/services/funerals"
            className="group flex flex-col overflow-hidden rounded-2xl border-2 border-foreground/10 hover:border-foreground/30 transition-colors"
          >
            <div className="relative aspect-[4/3] bg-foreground/8 overflow-hidden">
              <Image src="/Flower Photos/sympathy.jpeg" alt="Sympathy & Support" fill className="object-cover object-center scale-[1.5625] [filter:brightness(1.0)_contrast(1.04)_saturate(1.15)_sepia(0.18)]" />
            </div>
            <div className="p-6">
              <p className="font-display font-black text-2xl md:text-3xl leading-tight group-hover:underline">
                Sympathy &<br />Support
              </p>
              <p className="font-sans text-sm mt-3 text-foreground/70 leading-relaxed">
                Vase arrangements as a gesture of comfort and remembrance, for honouring
                a loved one or symbolising support.
              </p>
              <span className="inline-block mt-4 font-sans text-xs uppercase tracking-widest font-semibold underline underline-offset-4">
                Learn more →
              </span>
            </div>
          </Link>
        </div>
      </main>

      <footer className="border-t-2 border-foreground/10 py-8 text-center text-xs font-sans text-foreground/50">
        &copy; {new Date().getFullYear()} Fleurs d&apos;Emmi · Montréal, QC
      </footer>
    </div>
  );
}

function SiteHeader({ active }: { active?: string }) {
  const links = [
    { href: "/shop", label: "Shop" },
    { href: "/services", label: "Services" },
    { href: "/about", label: "About" },
    { href: "/#contact", label: "Contact" },
  ];
  return (
    <header className="relative flex items-center justify-between px-8 py-6 md:flex-col md:items-center md:pt-12 md:pb-0">
      <div className="md:hidden"><Link href="/"><DaisyLogo size={81} /></Link></div>
      <div className="hidden md:flex md:flex-col md:items-center md:gap-5">
        <Link href="/"><DaisyLogo size={175} /></Link>
        <nav className="flex gap-10 text-[0.992rem] font-sans tracking-widest uppercase text-foreground">
          {links.map(({ href, label }) => (
            <Link key={label} href={href} className={`hover:opacity-60 transition-opacity ${active === label.toLowerCase() ? "underline underline-offset-4" : ""}`}>{label}</Link>
          ))}
        </nav>
      </div>
      <div className="hidden md:flex items-center gap-5 absolute top-10 right-12 font-sans text-foreground">
        <Link href="/cart" className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-60 transition-opacity"><CartIcon /><span>0</span></Link>
      </div>
      <div className="flex items-center gap-4 md:hidden">
        <Link href="/cart" className="flex items-center gap-1"><CartIcon /><span className="text-xs font-sans font-semibold">0</span></Link>
        <button className="flex flex-col gap-1.5 p-1" aria-label="Open menu">
          <span className="block w-6 h-0.5 bg-foreground" /><span className="block w-6 h-0.5 bg-foreground" />
        </button>
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
