import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />

      <main className="flex flex-col">
        {/* Hero — title overlaps the chevron image */}
        <div className="relative">
          <h1 className="relative z-10 font-display font-black text-foreground text-[18vw] md:text-[11vw] leading-none text-center pt-10 pb-0 px-2">
            fleurs d&apos;emmi
          </h1>
          {/* Chevron image block — pulled up so title overlaps it */}
          <div className="clip-bowtie relative mx-4 md:w-[78.75%] md:mx-auto aspect-square -mt-[10vw] md:-mt-[6vw]">
            <Image
              src="/Flower Photos/HOME.jpg"
              alt="Fleurs d'Emmi hero"
              fill
              className="object-cover object-center scale-[1.08]"
              priority
            />
          </div>
        </div>

        {/* Shop CTA */}
        <div className="flex justify-center mt-0 md:-mt-4">
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
        <div className="grid grid-cols-1 gap-6 mt-8 mx-8 md:mx-32 md:grid-cols-2">
          {/* Bouquet Subscriptions */}
          <ProductCard
            href="/shop/bouquet-subscription"
            label="Bouquet Subscription"
            sublabel="Bi-weekly seasonal bouquets · Pick up or delivery"
            bg="bg-purple/20"
            image="/Flower Photos/bouquet1.jpg"
          />
          {/* Mother's Day */}
          <ProductCard
            href="/shop/mothers-day"
            label="Mother's Day Bouquets"
            sublabel="Order now · Pick up May 9th or delivery May 10th"
            bg="bg-purple/10"
            image="/Flower Photos/mama.jpg"
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
        <div className="mt-16 md:mt-24 mx-8 md:mx-32 border-t-2 border-foreground/20 pt-12">
          <h2 className="font-display font-black text-[10vw] md:text-[5vw] leading-none">
            Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <ServiceCard
              href="/services/weddings"
              label="Weddings & Special Events"
              body="DIY floral buckets, à la carte arrangements, and full installations. Request a custom quote."
              image="/Flower Photos/Wedding Flowers 3.jpg"
              imagePosition="object-top"
            />
            <ServiceCard
              href="/services/funerals"
              label="Sympathy & Support"
              body="Vase arrangements as a gesture of comfort and remembrance, for honouring a loved one."
              image="/Flower Photos/sympathy.jpeg"
              imageClass="scale-[1.5625] [filter:brightness(1.0)_contrast(1.04)_saturate(1.15)_sepia(0.18)]"
            />
          </div>
        </div>

        {/* About blurb */}
        <div className="mx-8 md:mx-32 mt-12 md:mt-16">
          <div className="flex flex-col md:flex-row md:items-start md:gap-12">
            <div className="flex-1">
              <h2 className="font-display font-black text-[8vw] md:text-[4vw] leading-none">
                About
              </h2>
              <p className="font-sans text-base leading-relaxed mt-4 text-foreground/80">
                fleurs d&apos;emmi is the floral project of Emily Gray, based in Montréal, Québec — using
                primarily local blooms grown by local farmers and from her own garden.<br className="hidden md:block" />An artist by nature,
                her multimedia practice informs an attention to detail and care, bridging the elegant and rustic.
              </p>
              <Link
                href="/about"
                className="inline-block mt-6 font-sans font-semibold text-sm uppercase tracking-widest underline underline-offset-4 hover:opacity-60 transition-opacity"
              >
                Read more
              </Link>
              {/* Image — below Read more on left side */}
              <div className="mt-14 aspect-square relative overflow-hidden rounded-2xl md:w-80">
                <Image src="/Flower Photos/contact.jpg" alt="Flowers" fill className="object-cover object-center" />
              </div>
            </div>
          </div>
        </div>

        {/* Email subscription */}
        <div id="contact" className="mx-8 md:mx-32 mt-10 md:mt-[72px] mb-16 max-w-2xl md:max-w-none">
          <h2 className="font-display font-black text-[8vw] md:text-[4vw] leading-none">
            Stay in the loop
          </h2>
          <p className="font-sans text-sm mt-3 text-foreground/70">
            Sign up to receive occasional updates from the farm and discover our new arrivals.
          </p>
          <form className="mt-8 flex flex-col gap-5 md:flex-row md:items-end">
            <div className="flex flex-col gap-1 flex-1">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold text-foreground">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple w-full"
              />
            </div>
            <button
              type="submit"
              className="font-sans text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-foreground hover:text-background transition-colors whitespace-nowrap"
            >
              Subscribe
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
  image,
}: {
  href: string;
  label: string;
  sublabel: string;
  bg: string;
  image?: string;
}) {
  return (
    <Link href={href} className="group flex flex-col overflow-hidden rounded-2xl border-2 border-foreground/10 hover:border-foreground/30 transition-colors">
      <div className={`${bg} aspect-[4/3] w-full relative`}>
        {image && <Image src={image} alt={label} fill className="object-cover" />}
      </div>
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
  image,
  imagePosition,
  imageClass,
}: {
  href: string;
  label: string;
  body: string;
  image?: string;
  imagePosition?: string;
  imageClass?: string;
}) {
  return (
    <Link href={href} className="group flex flex-col overflow-hidden rounded-2xl border-2 border-foreground/10 hover:border-foreground/30 transition-colors">
      {image && (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image src={image} alt={label} fill className={`object-cover ${imagePosition ?? 'object-center'} ${imageClass ?? ''}`} />
        </div>
      )}
      <div className="flex flex-col gap-3 p-6">
      <p className="font-display font-black text-xl md:text-2xl leading-tight group-hover:underline">
        {label}
      </p>
      <p className="font-sans text-sm text-foreground/70 leading-relaxed">{body}</p>
      <span className="font-sans text-xs uppercase tracking-widest font-semibold mt-auto pt-2 underline underline-offset-4">
        Learn more →
      </span>
      </div>
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

