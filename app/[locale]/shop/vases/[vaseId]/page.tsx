import Link from "next/link";
import SiteHeader from "@/app/components/SiteHeader";
import { VaseSlideshow } from "./VaseSlideshow";
import { AddToCartButton } from "@/app/components/AddToCartButton";
import { getCatalogItem } from "@/app/lib/catalog";
import { getInventoryByVariationId } from "@/app/lib/inventory";
import { getDictionary } from "@/lib/i18n";

export default async function VaseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; vaseId: string }>;
}) {
  const { locale, vaseId } = await params;
  const t = getDictionary(locale);
  const v = t.vases;

  const vase = await getCatalogItem(vaseId, locale)
  const variation = vase?.variations[0]

  const inventory = variation ? await getInventoryByVariationId([variation.variationId]) : {}
  const stockCount = variation ? (inventory[variation.variationId] ?? null) : null

  const price = variation ? Number(variation.priceMoney) / 100 : 0
  const slides = vase && vase.imageUrls.length > 0
    ? vase.imageUrls.map((src) => ({ src }))
    : []

  if (!vase || !variation) {
    return (
      <div className="flex flex-col flex-1">
        <SiteHeader locale={locale} active="shop" />
        <main className="mx-12 md:mx-32 mt-10 md:mt-16">
          <p className="font-sans text-base text-foreground/60">{v.notFound}</p>
          <Link href={`/${locale}/shop/vases`} className="font-sans text-sm underline mt-4 inline-block">
            {v.backToVases}
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
          href={`/${locale}/shop/vases`}
          className="font-sans text-xs uppercase tracking-widest font-semibold hover:opacity-60 transition-opacity"
        >
          {v.back}
        </Link>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
          <VaseSlideshow slides={slides} title={vase.name} />

          <div className="flex flex-col gap-4">
            <h1 className="font-display font-black text-[8.8vw] md:text-[3vw] leading-none">
              {vase.name}
            </h1>
            <p className="font-sans text-sm text-foreground/60 uppercase tracking-widest">
              {v.oneOfAKind}
            </p>
            <p className="font-display font-black text-2xl">${price}.00</p>
            <AddToCartButton
              item={{ productId: variation.variationId, name: vase.name, price, quantity: 1 }}
              labels={t.addToCart}
              stockCount={stockCount}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
