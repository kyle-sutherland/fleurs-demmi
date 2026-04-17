import Image from "next/image";
import SiteHeader from "@/app/components/SiteHeader";
import { getDictionary } from "@/lib/i18n";
import { getCatalogItemsByCategory } from "@/app/lib/catalog";

export const revalidate = 3600

const CARDS_CATEGORY = "Cards & Goodies"

export default async function CardsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const c = t.cards;

  const items = await getCatalogItemsByCategory(CARDS_CATEGORY, locale)

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="shop" />

      <main className="mx-12 md:mx-32 mt-10 md:mt-16">
        <h1 className="font-display font-black text-[10.4vw] md:text-[5.5vw] leading-none">
          {c.heading.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
        </h1>
        <p className="font-sans text-base mt-6 max-w-xl text-foreground/80 leading-relaxed">{c.intro}</p>

        {items.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="group flex flex-col">
                <div className="relative aspect-square bg-purple/15 overflow-hidden" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-10">
            {items.map((item) => {
              const price = Number(item.variations[0]?.priceMoney ?? 0) / 100
              const imageUrl = item.imageUrls[0]
              return (
                <div key={item.id} className="flex flex-col gap-2">
                  <div className="relative aspect-square bg-purple/10 overflow-hidden">
                    {imageUrl ? (
                      <Image src={imageUrl} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-foreground/5" />
                    )}
                  </div>
                  <p className="font-display font-black text-base leading-tight">{item.name}</p>
                  <p className="font-display font-black text-sm text-foreground/60">${price}.00</p>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  );
}
