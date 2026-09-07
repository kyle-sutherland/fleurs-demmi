import SiteHeader from "@/app/components/SiteHeader";
import BouquetSlideshow from "@/app/components/BouquetSlideshow";
import { BouquetSubscribeButton } from "@/app/components/BouquetSubscribeButton";
import { getDictionary } from "@/lib/i18n";
import { getCatalogItemsByCategory } from "@/app/lib/catalog";
import { getInventoryByVariationId } from "@/app/lib/inventory";

export const revalidate = 3600;

const SUB_CATEGORY = "Bouquet Subscriptions";

// Variation that lets the customer pick their own delivery Saturdays.
const SATURDAY_PICK_VARIATION_ID = "RGV4OAM2625ZOKVZYYLOYZTF";

/** Format a date label for display (e.g. "Jun 20" / "20 juin"). */
function formatDate(d: Date, locale: string): string {
  d.setHours(0, 0, 0, 0);
  return d.toLocaleDateString(locale === "fr" ? "fr-CA" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function BouquetSubscriptionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const b = t.bouquetSubscription;

  const items = await getCatalogItemsByCategory(SUB_CATEGORY, locale);
  const subItem = items[0];

  const variationIds = subItem?.variations.map((v) => v.variationId) ?? [];
  const inventory =
    variationIds.length > 0 ?
      await getInventoryByVariationId(variationIds)
    : {};

  const saturdays = [
    new Date(2026, 5, 20),
    new Date(2026, 6, 4),
    new Date(2026, 6, 18),
    new Date(2026, 7, 1),
    new Date(2026, 7, 15),
    new Date(2026, 7, 29),
    new Date(2026, 8, 12),
    new Date(2026, 8, 26),
    new Date(2026, 9, 10),
    new Date(2026, 9, 24),
  ].map((d) => formatDate(d, locale));

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="shop" />

      <main className="mx-12 md:mx-32 mt-10 md:mt-16">
        <h1 className="font-display font-black text-[10.4vw] md:text-[6vw] leading-none">
          {b.heading.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i === 0 && <br />}
            </span>
          ))}
        </h1>

        <p className="mt-6 font-sans text-base max-w-xl text-foreground/80 leading-relaxed">
          {b.intro.includes("$10.00") ?
            <>
              {b.intro.split(/(\$10\.00[^.]*)/)[0]}
              <strong>{b.intro.match(/\$10\.00[^.]*/)?.[0]}</strong>
              {b.intro.split(/\$10\.00[^.]*/)[1]}
            </>
          : b.intro}
        </p>

        <div className="mt-8 md:hidden">
          <BouquetSlideshow />
        </div>

        <div className="mt-12 flex flex-col md:flex-row md:gap-12 md:items-stretch">
          <section className="flex-1 max-w-[960px] flex flex-col gap-6">
            {(subItem?.variations ?? [])
              .filter((v) => v.bouquets !== 12)
              .map((variation) => {
                const price = Number(variation.priceMoney) / 100;
                const stockCount = inventory[variation.variationId] ?? null;
                const bouquets = variation.bouquets ?? 1;
                const pricePerBouquet = (price / bouquets).toFixed(2);
                const picksSaturdays =
                  variation.variationId === SATURDAY_PICK_VARIATION_ID;
                const tier = b.tiers[bouquets as keyof typeof b.tiers];

                return (
                  <div
                    key={variation.variationId}
                    className="border-2 border-foreground/20 p-6 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-display font-black text-xl leading-tight">
                          {tier ? tier.label : variation.name}
                        </p>
                        {tier && (
                          <p className="font-sans text-sm text-foreground/60 mt-0.5">
                            ({tier.dates})
                          </p>
                        )}
                        <p className="font-sans text-sm text-foreground/70 mt-1">
                          {locale === "fr" ?
                            `${bouquets} Bouquets @ ${pricePerBouquet} chacun`
                          : `${bouquets} Bouquets @ $${pricePerBouquet} each`}
                        </p>
                      </div>
                      <p className="font-display font-black text-2xl whitespace-nowrap">
                        ${price}.00
                      </p>
                    </div>

                    <BouquetSubscribeButton
                      variationId={variation.variationId}
                      tierLabel={variation.name}
                      tierPrice={price}
                      tierBouquets={variation.bouquets ?? 1}
                      stockCount={stockCount}
                      subscribeBtn={b.subscribeBtn}
                      deliveryLabel={b.deliveryLabel}
                      pickUpOption={b.pickUpOption}
                      pickUpOption2={b.pickUpOption2}
                      deliveryOption={b.deliveryOption}
                      saturdayOptions={picksSaturdays ? saturdays : undefined}
                      saturdayLabel={
                        locale === "fr" ?
                          "Choisissez vos samedis"
                        : "Select your Saturdays"
                      }
                      labels={t.addToCart}
                      locale={locale}
                    />
                  </div>
                );
              })}
          </section>

          <div className="hidden md:flex flex-shrink-0 w-[420px] ml-12">
            <BouquetSlideshow className="w-full h-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
