import Image from "next/image";
import Link from "next/link";
import DaisyLogo from "@/app/components/DaisyLogo";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <header className="relative flex items-center justify-between px-4 py-4 md:flex-col md:items-center md:pt-8 md:pb-0">
        <div className="md:hidden">
          <DaisyLogo size={56} />
        </div>
        <div className="hidden md:flex md:flex-col md:items-center md:gap-5">
          <DaisyLogo size={120} />
          <nav className="flex gap-10 text-xs font-sans font-semibold tracking-widest uppercase text-foreground">
            <Link href="/shop" className="hover:opacity-60 transition-opacity">Shop</Link>
            <Link href="/services" className="hover:opacity-60 transition-opacity">Services</Link>
            <Link href="/about" className="hover:opacity-60 transition-opacity">About</Link>
            <Link href="#contact" className="hover:opacity-60 transition-opacity">Contact</Link>
          </nav>
        </div>
        <div className="hidden md:flex items-center gap-5 absolute top-6 right-8 font-sans text-foreground">
          <Link href="/cart" className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-60 transition-opacity">
            <CartIcon />
            <span>0</span>
          </Link>
        </div>
        <div className="flex items-center gap-4 md:hidden">
          <Link href="/cart" className="flex items-center gap-1 hover:opacity-60 transition-opacity">
            <CartIcon />
            <span className="text-xs font-sans font-semibold">0</span>
          </Link>
          <button className="flex flex-col gap-1.5 p-1" aria-label="Open menu">
            <span className="block w-6 h-0.5 bg-foreground" />
            <span className="block w-6 h-0.5 bg-foreground" />
          </button>
        </div>
      </header>

      <main className="flex flex-col">
        {/* Hero — title overlaps the chevron image */}
        <div className="relative">
          <h1 className="relative z-10 font-display font-black text-foreground text-[18vw] md:text-[11vw] leading-none text-center pt-4 pb-0 px-2">
            fleurs d&apos;emmi
          </h1>
          {/* Chevron image block — pulled up so title overlaps it */}
          <div className="clip-chevron-top relative mx-4 md:mx-16 aspect-[4/3] md:aspect-[16/7] bg-purple -mt-[6vw] md:-mt-[4vw]">
            {/* Swap for <Image> when hero photo is available */}
          </div>
        </div>

        {/* Shop CTA */}
        <div className="flex justify-center mt-12 md:mt-16">
          <Link
            href="/shop"
            className="font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-foreground hover:text-background transition-colors"
          >
            Shop Now
          </Link>
        </div>

        {/* Flowers & things */}
        <h2 className="font-display font-black text-[12vw] md:text-[7vw] leading-none text-center mt-16 md:mt-24">
          flowers &amp; things
        </h2>

        {/* Product & service grid */}
        <div className="grid grid-cols-1 gap-0 mt-8 mx-4 md:mx-16 md:grid-cols-2">
          {/* Bouquet Subscriptions */}
          <ProductCard
            href="/shop/bouquet-subscription"
            label="Bouquet Subscription"
            sublabel="Bi-weekly seasonal bouquets · Mile End pickup"
            bg="bg-purple/20"
          />
          {/* Mother's Day */}
          <ProductCard
            href="/shop/mothers-day"
            label="Mother's Day Bouquets"
            sublabel="Order now · Pickup May 2nd or Delivery May 3rd"
            bg="bg-purple/10"
          />
          {/* Vases */}
          <ProductCard
            href="/shop/vases"
            label="Handmade & Vintage Vases"
            sublabel="Unique vessels for every arrangement"
            bg="bg-foreground/5"
          />
          {/* Cards & Goodies */}
          <ProductCard
            href="/shop/cards"
            label="Cards & Goodies"
            sublabel="Little extras to complete your gift"
            bg="bg-purple/15"
          />
        </div>

        {/* Services teaser */}
        <div className="mt-16 md:mt-24 mx-4 md:mx-16 border-t-2 border-foreground/20 pt-12">
          <h2 className="font-display font-black text-[10vw] md:text-[5vw] leading-none">
            Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <ServiceCard
              href="/services/weddings"
              label="Weddings & Special Events"
              body="DIY floral buckets, à la carte arrangements, and full installations. Request a custom quote."
            />
            <ServiceCard
              href="/services/funerals"
              label="Sympathy & Support"
              body="Vase arrangements as a gesture of comfort and remembrance, for honouring a loved one."
            />
          </div>
        </div>

        {/* Emily's bio photos */}
        <div className="grid grid-cols-2 gap-4 mt-16 mx-4 md:mx-16">
          <div className="relative aspect-[3/4]">
            <Image
              src="/60c13257-cae1-486f-b37a-683c0594416b.jpeg"
              alt="Emily with flower cart"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative aspect-[3/4]">
            <Image
              src="/ee457bb0-6711-4bd4-a478-09e127b505a6.jpeg"
              alt="Emily watering flowers"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* About blurb */}
        <div className="mx-4 md:mx-16 mt-12 md:mt-16 max-w-2xl">
          <h2 className="font-display font-black text-[8vw] md:text-[4vw] leading-none">
            About
          </h2>
          <p className="font-sans text-base leading-relaxed mt-4 text-foreground/80">
            fleurs d&apos;emmi is the floral project of Emily Gray, based in Montréal, Québec — using
            primarily local blooms grown by local farmers and from her own garden. An artist by nature,
            her multimedia practice informs an attention to detail and care, bridging the elegant and rustic.
          </p>
          <Link
            href="/about"
            className="inline-block mt-6 font-sans font-semibold text-sm uppercase tracking-widest underline underline-offset-4 hover:opacity-60 transition-opacity"
          >
            Read more
          </Link>
        </div>

        {/* Contact form */}
        <div id="contact" className="mx-4 md:mx-16 mt-16 md:mt-24 mb-16 max-w-2xl">
          <h2 className="font-display font-black text-[8vw] md:text-[4vw] leading-none">
            Contact
          </h2>
          <p className="font-sans text-sm mt-3 text-foreground/70">
            Questions, custom requests, or just want to say hello?
          </p>
          <form className="mt-8 flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Name" name="name" type="text" />
              <FormField label="Email" name="email" type="email" />
            </div>
            <FormField label="Phone" name="phone" type="tel" />
            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold text-foreground">
                Message
              </label>
              <textarea
                name="message"
                rows={5}
                className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple resize-none"
              />
            </div>
            <button
              type="submit"
              className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-foreground hover:text-background transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </main>

      <footer className="border-t-2 border-foreground/10 py-8 text-center text-xs font-sans text-foreground/50">
        &copy; {new Date().getFullYear()} Fleurs d&apos;Emmi · Montréal, QC
      </footer>
    </div>
  );
}

function ProductCard({
  href,
  label,
  sublabel,
  bg,
}: {
  href: string;
  label: string;
  sublabel: string;
  bg: string;
}) {
  return (
    <Link href={href} className="group flex flex-col border-2 border-foreground/10 hover:border-foreground/30 transition-colors">
      <div className={`${bg} aspect-[4/3] w-full`} />
      <div className="p-5">
        <p className="font-display font-black text-xl md:text-2xl leading-tight group-hover:underline">
          {label}
        </p>
        <p className="font-sans text-sm mt-2 text-foreground/60">{sublabel}</p>
      </div>
    </Link>
  );
}

function ServiceCard({
  href,
  label,
  body,
}: {
  href: string;
  label: string;
  body: string;
}) {
  return (
    <Link href={href} className="group flex flex-col gap-3 p-6 border-2 border-foreground/10 hover:border-foreground/30 transition-colors">
      <p className="font-display font-black text-xl md:text-2xl leading-tight group-hover:underline">
        {label}
      </p>
      <p className="font-sans text-sm text-foreground/70 leading-relaxed">{body}</p>
      <span className="font-sans text-xs uppercase tracking-widest font-semibold mt-auto pt-2 underline underline-offset-4">
        Learn more →
      </span>
    </Link>
  );
}

function FormField({
  label,
  name,
  type,
}: {
  label: string;
  name: string;
  type: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={name}
        className="font-sans text-xs uppercase tracking-widest font-semibold text-foreground"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple"
      />
    </div>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
