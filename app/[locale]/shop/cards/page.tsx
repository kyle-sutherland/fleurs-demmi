import Image from "next/image";
import Link from "next/link";
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
                <Link key={item.id} href={`/${locale}/shop/cards/${item.id}`} className="group flex flex-col">
                  <div className="relative aspect-square bg-purple/10 overflow-hidden">
                    {imageUrl ? (
                      <Image src={imageUrl} alt={item.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-foreground/5" />
                    )}
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors duration-300 flex flex-col items-center justify-center gap-1">
                      <span className="font-display font-black text-background text-lg leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center px-4">
                        {item.name}
                      </span>
                      <span className="font-sans text-background text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        ${price}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  );
}
