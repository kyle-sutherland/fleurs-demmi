import Link from "next/link";
import DaisyLogo from "@/app/components/DaisyLogo";
import BouquetSlideshow from "@/app/components/BouquetSlideshow";

export const metadata = {
  title: "Bouquet Subscription — Fleurs d'Emmi",
};

const tiers = [
  {
    id: "8weeks",
    label: "Bi-weekly for 8 weeks",
    dates: "June 27th to Oct 3rd",
    price: 250,
    available: 20,
  },
  {
    id: "12weeks",
    label: "Bi-weekly for 12 weeks",
    dates: "May 30th to Oct 31st",
    price: 350,
    available: 20,
  },
];

export default function BouquetSubscriptionPage() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader active="shop" />

      <main className="mx-8 md:mx-32 mt-10 md:mt-16 pb-24">
        <h1 className="font-display font-black text-[12vw] md:text-[6vw] leading-none">
          Bouquet<br />Subscription
        </h1>

        <p className="mt-6 font-sans text-base max-w-xl text-foreground/80 leading-relaxed">
          Subscribe to regularly receive bi-weekly, seasonal bouquet arrangements made with local
          flowers. Pick up in the Mile End on Saturdays. Home delivery can be scheduled for an
          extra <strong>$10.00 per bouquet</strong>.
        </p>

        <div className="mt-12 flex flex-col md:flex-row md:gap-12 md:items-stretch">
          {/* Tiers */}
          <section className="flex-1 max-w-[960px] flex flex-col gap-6">
            {tiers.map((tier) => (
              <div key={tier.id} className="border-2 border-foreground/20 p-6 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display font-black text-xl leading-tight">{tier.label}</p>
                    <p className="font-sans text-sm text-foreground/60 mt-1">From {tier.dates}</p>
                    <p className="font-sans text-xs text-foreground/50 mt-0.5">{tier.available} available</p>
                  </div>
                  <p className="font-display font-black text-2xl whitespace-nowrap">${tier.price}.00</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-sans text-xs uppercase tracking-widest font-semibold">Delivery option</label>
                  <select className="border-2 border-foreground bg-background font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple appearance-none">
                    <option>Pick up — Mile End, Saturdays</option>
                    <option>Home delivery (+$10/bouquet)</option>
                  </select>
                </div>

                {/* Payment placeholder */}
                <div className="p-3 border-2 border-dashed border-foreground/30 font-sans text-sm text-foreground/50 text-center">
                  Payment integration coming soon
                </div>

                <button
                  type="button"
                  className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors"
                >
                  Subscribe — ${tier.price}.00
                </button>
              </div>
            ))}
          </section>

          {/* Slideshow — desktop only, stretches to match tiers height */}
          <div className="hidden md:flex flex-shrink-0 w-[420px] ml-12">
            <BouquetSlideshow className="w-full h-full" />
          </div>
        </div>

        {/* Slideshow — mobile only, below tier boxes */}
        <div className="mt-8 md:hidden">
          <BouquetSlideshow />
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
