import Link from "next/link";
import SiteHeader from "@/app/components/SiteHeader";
import { VaseSlideshow } from "@/app/[locale]/shop/vases/[vaseId]/VaseSlideshow";
import { CardVariationSelector } from "./CardVariationSelector";
import { getCatalogItem } from "@/app/lib/catalog";
import { getInventoryByVariationId } from "@/app/lib/inventory";
import { getPickupLocation } from "@/app/lib/appointments";
import { formatMoney } from "@/app/lib/money";
import { getDictionary } from "@/lib/i18n";

export const revalidate = 3600;

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ locale: string; cardId: string }>;
}) {
  const { locale, cardId } = await params;
  const t = getDictionary(locale);
  const c = t.cards;

  const card = await getCatalogItem(cardId, locale);
  const variations = card?.variations ?? [];

  const [inventory, pickupLocation, formattedPrices] = await Promise.all([
    variations.length > 0
      ? getInventoryByVariationId(variations.map(v => v.variationId))
      : Promise.resolve({} as Record<string, number | null>),
    getPickupLocation(),
    Promise.all(
      (card?.variations ?? []).map(v => formatMoney(Number(v.priceMoney) / 100, locale))
    ),
  ]);

  const variationProps = variations.map((v, i) => ({
    variationId: v.variationId,
    name: v.name,
    priceInCents: Number(v.priceMoney),
    priceFormatted: formattedPrices[i] ?? '',
  }));

  const slides =
    card && card.imageUrls.length > 0
      ? card.imageUrls.map((src) => ({ src }))
      : [];

  if (!card || variations.length === 0) {
    return (
      <div className="flex flex-col flex-1">
        <SiteHeader locale={locale} active="shop" />
        <main className="mx-12 md:mx-32 mt-10 md:mt-16">
          <p className="font-sans text-base text-foreground/60">{c.notFound}</p>
          <Link
            href={`/${locale}/shop/cards`}
            className="font-sans text-sm underline mt-4 inline-block"
          >
            {c.backToCards}
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="shop" />

      <main className="mx-12 md:mx-32 mt-10 md:mt-16">
        <Link
          href={`/${locale}/shop/cards`}
          className="font-sans text-xs uppercase tracking-widest font-semibold hover:opacity-60 transition-opacity"
        >
          {c.back}
        </Link>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
          <VaseSlideshow slides={slides} title={card.name} />

          <div className="flex flex-col gap-4">
            <h1 className="font-display font-black text-[8.8vw] md:text-[3vw] leading-none">
              {card.name}
            </h1>
            {card.description && (
              <p className="font-sans text-sm text-foreground/60 uppercase tracking-widest">
                {card.description}
              </p>
            )}
            {pickupLocation && (
              <p className="font-sans text-sm text-foreground/60">
                {c.pickupAt}
              </p>
            )}
            <CardVariationSelector
              variations={variationProps}
              inventory={inventory}
              itemName={card.name}
              labels={t.addToCart}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
