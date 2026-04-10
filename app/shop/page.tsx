import Link from "next/link";
import Image from "next/image";
import DaisyLogo from "@/app/components/DaisyLogo";

export const metadata = {
  title: "Shop — Fleurs d'Emmi",
};

const products = [
  {
    id: "bouquet-subscription",
    name: "Bouquet Subscription",
    desc: "Bi-weekly seasonal bouquets · from $250",
    href: "/shop/bouquet-subscription",
    image: "/FlowerPhotos/bouquet1.jpg",
  },
  {
    id: "mothers-day",
    name: "Mother's Day Bouquets",
    desc: "Pick up May 9th or delivery May 10th · from $60",
    href: "/shop/mothers-day",
    image: "/FlowerPhotos/mama.jpg",
    imageClass: "object-cover object-center",
    imageStyle: { filter: "brightness(1.05) saturate(1.15) sepia(0.1)" },
  },
  {
    id: "vases",
    name: "Handmade & Vintage Vases",
    desc: "One-of-a-kind vessels",
    href: "/shop/vases",
  },
  {
    id: "cards",
    name: "Cards & Goodies",
    desc: "Little extras to complete your gift",
    href: "/shop/cards",
  },
];

export default function ShopPage() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader active="shop" />

      <main className="flex flex-col">
        <h1 className="font-display font-black text-[14vw] md:text-[6vw] leading-none px-4 mt-8 md:px-32">
          flowers &amp; things
        </h1>

        <div className="grid grid-cols-2 gap-6 mt-8 mx-8 md:mx-32 md:grid-cols-2">
          {products.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              className="group flex flex-col overflow-hidden rounded-2xl border-2 border-foreground/10 hover:border-foreground/30 transition-colors"
            >
              <div className="relative aspect-[4/3] w-full bg-purple/20">
                {p.image && <Image src={p.image} alt={p.name} fill className={p.imageClass ?? "object-cover object-center"} style={p.imageStyle} />}
              </div>
              <div className="p-5">
                <p className="font-display font-black text-xl md:text-2xl leading-tight group-hover:underline">
                  {p.name}
                </p>
                <p className="font-sans text-sm mt-2 text-foreground/60">{p.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t-2 border-foreground/10 mt-24 py-8 text-center text-xs font-sans text-foreground/50">
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
