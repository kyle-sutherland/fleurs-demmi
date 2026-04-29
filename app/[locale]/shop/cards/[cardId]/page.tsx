import Link from "next/link";
import SiteHeader from "@/app/components/SiteHeader";
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
    imageUrls: v.imageUrls,
  }));

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

        <div className="mt-8">
          <CardVariationSelector
            variations={variationProps}
            itemImageUrls={card.imageUrls}
            inventory={inventory}
            itemName={card.name}
            description={card.description}
            pickupText={pickupLocation ? c.pickupAt : null}
            labels={t.addToCart}
            selectColourLabel={c.selectColour}
          />
        </div>
      </main>
    </div>
  );
}
