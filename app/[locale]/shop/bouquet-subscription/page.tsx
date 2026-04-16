import SiteHeader from "@/app/components/SiteHeader";
import BouquetSlideshow from "@/app/components/BouquetSlideshow";
import { getDictionary } from "@/lib/i18n";

export default async function BouquetSubscriptionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const b = t.bouquetSubscription;

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="shop" />

      <main className="mx-12 md:mx-32 mt-10 md:mt-16">
        <h1 className="font-display font-black text-[10.4vw] md:text-[6vw] leading-none">
          {b.heading.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
        </h1>

        <p className="mt-6 font-sans text-base max-w-xl text-foreground/80 leading-relaxed">
          {b.intro.includes("$10.00") ? (
            <>
              {b.intro.split(/(\$10\.00[^.]*)/)[0]}
              <strong>{b.intro.match(/\$10\.00[^.]*/)?.[0]}</strong>
              {b.intro.split(/\$10\.00[^.]*/)[1]}
            </>
          ) : b.intro}
        </p>

        <div className="mt-8 md:hidden">
          <BouquetSlideshow />
        </div>

        <div className="mt-12 flex flex-col md:flex-row md:gap-12 md:items-stretch">
          <section className="flex-1 max-w-[960px] flex flex-col gap-6">
            {b.tiers.map((tier) => (
              <div key={tier.id} className="border-2 border-foreground/20 p-6 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display font-black text-xl leading-tight">{tier.label}</p>
                    <p className="font-sans text-sm text-foreground/60 mt-1">{b.from} {tier.dates}</p>
                    <p className="font-sans text-xs text-foreground/50 mt-0.5">{tier.available} {b.available}</p>
                  </div>
                  <p className="font-display font-black text-2xl whitespace-nowrap">${tier.price}.00</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-sans text-xs uppercase tracking-widest font-semibold">{b.deliveryLabel}</label>
                  <div className="relative">
                    <select className="w-full border-2 border-foreground bg-background font-sans text-sm px-4 py-3 pr-10 focus:outline-none focus:border-orange-500 appearance-none text-foreground">
                      <option>{b.pickUpOption}</option>
                      <option>{b.pickUpOption2}</option>
                      <option>{b.deliveryOption}</option>
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-foreground">&#8964;</span>
                  </div>
                </div>

                <div className="p-3 border-2 border-dashed border-foreground/30 font-sans text-sm text-foreground/50 text-center">
                  {b.paymentSoon}
                </div>

                <button type="button" className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors">
                  {b.subscribeBtn}{tier.price}.00
                </button>
              </div>
            ))}
          </section>

          <div className="hidden md:flex flex-shrink-0 w-[420px] ml-12">
            <BouquetSlideshow className="w-full h-full" />
          </div>
        </div>

      </main>
    </div>
  );
}
