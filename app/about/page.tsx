import Image from "next/image";
import Link from "next/link";
import DaisyLogo from "@/app/components/DaisyLogo";

export const metadata = {
  title: "About — Fleurs d'Emmi",
  description: "The floral project of Emily Gray, based in Montréal, QC.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader active="about" />

      <main className="flex flex-col">
        <div className="mx-8 md:mx-32 mt-10 md:mt-16">
          <h1 className="font-display font-black text-[14vw] md:text-[7vw] leading-none">
            About
          </h1>
        </div>

        {/* Photos */}
        <div className="grid grid-cols-2 gap-4 mt-8 mx-8 md:mx-32">
          <div className="relative aspect-[3/4]">
            <Image
              src="/60c13257-cae1-486f-b37a-683c0594416b.jpeg"
              alt="Emily Gray with flower cart"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="relative aspect-[3/4]">
            <Image
              src="/ee457bb0-6711-4bd4-a478-09e127b505a6.jpeg"
              alt="Emily Gray watering plants"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="mx-8 md:mx-32 mt-12 md:mt-16 max-w-2xl md:max-w-none">
          <p className="font-sans text-base leading-relaxed text-foreground/80">
            fleurs d&apos;emmi is the floral project of <strong>Emily Gray</strong>, based in
            Montréal, Québec, using primarily local blooms grown by local farmers and from her own
            garden. With a background in visual arts (BFA c.2017) and over 10 years of experience
            working on various farms across Canada, her passion for local flowers emerged in 2020.
          </p>
          <p className="font-sans text-base leading-relaxed text-foreground/80 mt-5">
            She has completed her permaculture design certificate with P3 Permaculture and has worked
            on the farm team at Ferme Les Petits Victoires, Bee Balm Botanicals and Earth Candy Farm.
            In 2025, she started a garden on a rooftop in the Mile End and a guerilla garden in the
            &lsquo;soul patch&rsquo;. She has since expanded her project to a larger plot of land
            located in Valcourt, QC where she collaborates with willow grower Ingrid Weigel. As a
            self-taught florist, she has created arrangements alongside the team at Fleuriste Sophie
            Dorval, Flori Flora, and Oursin Fleurs.
          </p>
          <p className="font-sans text-base leading-relaxed text-foreground/80 mt-5">
            An artist by nature, she views her surroundings as a part of life&apos;s collage. Her
            multimedia practice — fibres, ceramics, woodworking, painting, performance art, culinary
            arts — informs her sensibility to create with an attention to detail and care. Her
            artistic language when working with flowers bridges between elegant and rustic. She is
            eclectic in her taste, often drawn to non-traditional floral arrangements, bold palettes,
            and vintage or handmade vases.
          </p>
          <p className="font-sans text-base leading-relaxed text-foreground/80 mt-5">
            She is eager to provide floral services catering to all kinds of events including
            weddings, funerals, special events, and everyday living.
          </p>

          <div className="flex gap-6 mt-10">
            <Link
              href="/shop"
              className="font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-8 py-3 hover:bg-foreground hover:text-background transition-colors"
            >
              Shop
            </Link>
            <Link
              href="/services"
              className="font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-8 py-3 hover:bg-foreground hover:text-background transition-colors"
            >
              Services
            </Link>
          </div>
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
      <div className="md:hidden">
        <Link href="/"><DaisyLogo size={81} /></Link>
      </div>
      <div className="hidden md:flex md:flex-col md:items-center md:gap-5">
        <Link href="/"><DaisyLogo size={175} /></Link>
        <nav className="flex gap-10 text-[0.992rem] font-sans tracking-widest uppercase text-foreground">
          {links.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className={`hover:opacity-60 transition-opacity ${active === label.toLowerCase() ? "underline underline-offset-4" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="hidden md:flex items-center gap-5 absolute top-10 right-12 font-sans text-foreground">
        <Link href="/cart" className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-60 transition-opacity">
          <CartIcon /><span>0</span>
        </Link>
      </div>
      <div className="flex items-center gap-4 md:hidden">
        <Link href="/cart" className="flex items-center gap-1 hover:opacity-60 transition-opacity">
          <CartIcon /><span className="text-xs font-sans font-semibold">0</span>
        </Link>
        <button className="flex flex-col gap-1.5 p-1" aria-label="Open menu">
          <span className="block w-6 h-0.5 bg-foreground" />
          <span className="block w-6 h-0.5 bg-foreground" />
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
