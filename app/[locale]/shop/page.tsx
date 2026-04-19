import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/app/components/SiteHeader";
import { getDictionary } from "@/lib/i18n";

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);

  const products = [
    {
      id: "bouquet-subscription",
      name: t.shop.products.bouquetSubscription.label,
      desc: t.shop.products.bouquetSubscription.sublabel,
      href: `/${locale}/shop/bouquet-subscription`,
      image: "/Flower Photos/SubscriptionEdit.jpg",
    },
    {
      id: "mothers-day",
      name: t.shop.products.mothersDay.label,
      desc: t.shop.products.mothersDay.sublabel,
      href: `/${locale}/shop/mothers-day`,
      image: "/Flower Photos/MothersDayEdit.jpg",
    },
    {
      id: "vases",
      name: t.shop.products.vases.label,
      desc: t.shop.products.vases.sublabel,
      href: `/${locale}/shop/vases`,
      image: "/Vases/1.jpg",
    },
    {
      id: "cards",
      name: t.shop.products.cards.label,
      desc: t.shop.products.cards.sublabel,
      href: `/${locale}/shop/cards`,
      image: "/card.jpg",
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="shop" />

      <main className="flex flex-col mx-12 md:mx-32 mt-10 md:mt-16">
        <h1 className="font-display font-black text-[10.4vw] md:text-[6vw] leading-none">
          {t.shop.heading}
        </h1>

        <div className="grid grid-cols-2 gap-6 mt-8 md:grid-cols-2">
          {products.map((p) => (
            <Link key={p.id} href={p.href} className="group flex flex-col overflow-hidden border-2 border-foreground/10 hover:border-foreground/30 transition-colors">
              <div className="relative aspect-[4/3] w-full bg-purple/20">
                {p.image && (
                  <Image src={p.image} alt={p.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover object-center" />
                )}
              </div>
              <div className="p-5">
                <p className="font-display font-black text-xl md:text-2xl leading-tight group-hover:underline">{p.name}</p>
                <p className="font-sans text-sm mt-2 text-foreground/60">{p.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
