import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/app/components/SiteHeader";
import { getDictionary } from "@/lib/i18n";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} />

      <main className="flex flex-col">
        {/* Hero */}
        <div className="relative mt-4 md:mt-16">
          <h1 className="relative z-10 font-display font-black text-foreground text-[13vw] md:text-[11vw] leading-none text-center pb-0 px-[3.75rem] md:px-2 mb-12 md:mb-0">
            fleurs d&apos;emmi
          </h1>
          <div className="clip-bowtie relative mx-12 md:mx-32 aspect-square -mt-[12vw] md:-mt-[6vw]">
            <Image
              src="/Flower Photos/HOME.jpg"
              alt="Fleurs d'Emmi hero"
              fill
              sizes="100vw"
              className="object-cover object-center scale-[1.08]"
              priority
            />
          </div>
        </div>

        {/* Shop CTA */}
        <div className="flex justify-center mt-0 md:-mt-4">
          <Link
            href={`/${locale}/shop`}
            className="font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-foreground hover:text-background transition-colors"
          >
            {t.home.shopNow}
          </Link>
        </div>

        {/* Flowers & things */}
        <h2 className="font-display font-black text-[10vw] md:text-[5vw] leading-none text-center mt-16 md:mt-24 md:mx-32">
          {t.home.flowersAndThings}
        </h2>

        <div className="grid grid-cols-1 gap-6 mt-8 mx-12 md:mx-32 md:grid-cols-2">
          <ProductCard
            href={`/${locale}/shop/bouquet-subscription`}
            label={t.home.products.bouquetSubscription.label}
            sublabel={t.home.products.bouquetSubscription.sublabel}
            bg="bg-purple/20"
            image="/Flower Photos/SubscriptionEdit.jpg"
          />
          <ProductCard
            href={`/${locale}/shop/mothers-day`}
            label={t.home.products.mothersDay.label}
            sublabel={t.home.products.mothersDay.sublabel}
            bg="bg-purple/10"
            image="/Flower Photos/MothersDayEdit.jpg"
          />
          <ProductCard
            href={`/${locale}/shop/vases`}
            label={t.home.products.vases.label}
            sublabel={t.home.products.vases.sublabel}
            bg="bg-foreground/5"
            image="/Vases/1.jpg"
          />
          <ProductCard
            href={`/${locale}/shop/cards`}
            label={t.home.products.cards.label}
            sublabel={t.home.products.cards.sublabel}
            bg="bg-purple/15"
          />
        </div>

        {/* Services teaser */}
        <div className="mt-16 md:mt-24 mx-12 md:mx-32 border-t-2 border-foreground/20 pt-12">
          <h2 className="font-display font-black text-[10vw] md:text-[5vw] leading-none">
            {t.home.servicesHeading}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <ServiceCard
              href={`/${locale}/services/weddings`}
              label={t.home.serviceCards.weddings.label}
              body={t.home.serviceCards.weddings.body}
              image="/Flower Photos/Wedding Flowers 3.jpg"
              imagePosition="object-top"
            />
            <ServiceCard
              href={`/${locale}/services/funerals`}
              label={t.home.serviceCards.sympathy.label}
              body={t.home.serviceCards.sympathy.body}
              image="/Flower Photos/sympathy.jpeg"
              imageClass="scale-[1.5625] [filter:brightness(1.0)_contrast(1.04)_saturate(1.15)_sepia(0.18)]"
            />
          </div>
        </div>

        {/* About blurb */}
        <div className="mx-12 md:mx-32 mt-12 md:mt-16">
          <div className="flex flex-col md:flex-row md:items-start md:gap-12">
            <div className="flex-1">
              <h2 className="font-display font-black text-[8vw] md:text-[4vw] leading-none">
                {t.home.aboutHeading}
              </h2>
              <p className="font-sans text-base leading-relaxed mt-4 text-foreground/80">
                {(() => {
                  const body = t.home.aboutBody.replace(/^fleurs d[\u2019\u0027]emmi/, "");
                  const [before, after] = body.split("Emily Gray");
                  return <><em>fleurs d&apos;emmi</em>{before}<strong>Emily Gray</strong>{after}</>;
                })()}
              </p>
              <Link
                href={`/${locale}/about`}
                className="inline-block mt-6 font-sans font-semibold text-sm uppercase tracking-widest underline underline-offset-4 hover:opacity-60 transition-opacity"
              >
                {t.home.readMore}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProductCard({
  href, label, sublabel, bg, image, imageStyle,
}: {
  href: string; label: string; sublabel: string; bg: string; image?: string; imageStyle?: React.CSSProperties;
}) {
  return (
    <Link href={href} className="group flex flex-col overflow-hidden border-2 border-foreground/10 hover:border-foreground/30 transition-colors">
      <div className={`${bg} aspect-[4/3] w-full relative`}>
        {image && <Image src={image} alt={label} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" style={imageStyle} />}
      </div>
      <div className="p-5">
        <p className="font-display font-black text-xl md:text-2xl leading-tight group-hover:underline">{label}</p>
        <p className="font-sans text-sm mt-2 text-foreground/60">{sublabel}</p>
      </div>
    </Link>
  );
}

function ServiceCard({
  href, label, body, image, imagePosition, imageClass,
}: {
  href: string; label: string; body: string; image?: string; imagePosition?: string; imageClass?: string;
}) {
  return (
    <Link href={href} className="group flex flex-col overflow-hidden border-2 border-foreground/10 hover:border-foreground/30 transition-colors">
      {image && (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image src={image} alt={label} fill sizes="(max-width: 768px) 100vw, 50vw" className={`object-cover ${imagePosition ?? "object-center"} ${imageClass ?? ""}`} />
        </div>
      )}
      <div className="flex flex-col gap-3 p-6">
        <p className="font-display font-black text-xl md:text-2xl leading-tight group-hover:underline">{label}</p>
        <p className="font-sans text-sm text-foreground/70 leading-relaxed">{body}</p>
        <span className="font-sans text-xs uppercase tracking-widest font-semibold mt-auto pt-2 underline underline-offset-4">
          Learn more →
        </span>
      </div>
    </Link>
  );
}
