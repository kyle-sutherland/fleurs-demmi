"use client";

import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import SiteHeader from "@/app/components/SiteHeader";
import { AddToCartButton } from "@/app/components/AddToCartButton";

const cardItems: Record<string, { title: Record<string, string>; description: Record<string, string>; price: number; src: string }> = {
  "1": {
    title: { en: "Candy Flowers Gift Card", fr: "Carte cadeau Candy Flowers" },
    description: { en: "Blank inside", fr: "Intérieur vierge" },
    price: 4,
    src: "/card.jpg",
  },
};

export default function CardDetailPage({
  params,
}: {
  params: Promise<{ locale: string; cardId: string }>;
}) {
  const { locale, cardId } = use(params);
  const card = cardItems[cardId];

  if (!card) {
    return (
      <div className="flex flex-col flex-1">
        <SiteHeader locale={locale} active="shop" />
        <main className="mx-12 md:mx-32 mt-10 md:mt-16">
          <p className="font-sans text-base text-foreground/60">Item not found.</p>
          <Link href={`/${locale}/shop/cards`} className="font-sans text-sm underline mt-4 inline-block">
            ← Back to Cards &amp; Goodies
          </Link>
        </main>
      </div>
    );
  }

  const title = card.title[locale] ?? card.title.en;
  const description = card.description[locale] ?? card.description.en;
  const addLabel = locale === "fr" ? "Ajouter au panier" : "Add to Cart";
  const backLabel = locale === "fr" ? "← Retour" : "← Back";
  const paymentSoon = locale === "fr" ? "Intégration de paiement à venir" : "Payment integration coming soon";

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="shop" />

      <main className="mx-12 md:mx-32 mt-10 md:mt-16">
        <Link
          href={`/${locale}/shop/cards`}
          className="font-sans text-xs uppercase tracking-widest font-semibold hover:opacity-60 transition-opacity"
        >
          {backLabel}
        </Link>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
          {/* Image */}
          <div className="relative aspect-square w-full overflow-hidden bg-purple/10">
            <Image
              src={card.src}
              alt={title}
              fill
              className="object-cover object-center"
              priority
            />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4">
            <h1 className="font-display font-black text-[8.8vw] md:text-[3vw] leading-none">
              {title}
            </h1>
            <p className="font-sans text-sm text-foreground/60 uppercase tracking-widest">
              {description}
            </p>
            <p className="font-display font-black text-2xl">${card.price}.00</p>
            <AddToCartButton
              item={{ productId: `card-${cardId}`, name: title, price: card.price, quantity: 1 }}
              label={addLabel}
            />
            <div className="mt-2 p-4 border-2 border-dashed border-foreground/30 font-sans text-sm text-foreground/50 text-center">
              {paymentSoon}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
