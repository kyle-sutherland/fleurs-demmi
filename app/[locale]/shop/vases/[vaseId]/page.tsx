import Link from "next/link";
import SiteHeader from "@/app/components/SiteHeader";
import { VaseSlideshow } from "./VaseSlideshow";
import { AddToCartButton } from "@/app/components/AddToCartButton";

const vaseTitles: Record<string, Record<string, string>> = {
  "1": { en: "Sgraffito Vase", fr: "Vase sgraffito" },
  "2": { en: "Butter Yellow Vase", fr: "Vase jaune beurre" },
  "3": { en: "Seafoam Loop Vase", fr: "Vase boucle bleu vert" },
};

const oneOfAKind: Record<string, string> = {
  en: "One of a kind",
  fr: "Pièce unique",
};

const vaseSlides: Record<string, { productId: string; price: number; slides: { src: string; position?: string; fit?: string }[] }> = {
  "1": {
    productId: "vase-sgraffito",
    price: 95,
    slides: [
      { src: "/Vases/1c.jpg" },
      { src: "/Vases/2b.jpg" },
      { src: "/Vases/3b.jpg", fit: "object-contain" },
    ],
  },
  "2": {
    productId: "vase-butter-yellow",
    price: 95,
    slides: [
      { src: "/Vases/4c.jpg" },
      { src: "/Vases/5.jpg" },
    ],
  },
  "3": {
    productId: "vase-seafoam",
    price: 95,
    slides: [
      { src: "/Vases/6c.jpg" },
      { src: "/Vases/7.jpg" },
    ],
  },
};

export default async function VaseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; vaseId: string }>;
}) {
  const { locale, vaseId } = await params;
  const slideData = vaseSlides[vaseId];
  const title = vaseTitles[vaseId]?.[locale] ?? vaseTitles[vaseId]?.en ?? "";
  const vase = slideData ? { ...slideData, title } : null;

  if (!vase) {
    return (
      <div className="flex flex-col flex-1">
        <SiteHeader locale={locale} active="shop" />
        <main className="mx-12 md:mx-32 mt-10 md:mt-16">
          <p className="font-sans text-base text-foreground/60">Vase not found.</p>
          <Link href={`/${locale}/shop/vases`} className="font-sans text-sm underline mt-4 inline-block">
            ← Back to Vases
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
          ← Back
        </Link>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
          <VaseSlideshow slides={vase.slides} title={vase.title} />

          <div className="flex flex-col gap-4">
            <h1 className="font-display font-black text-[8.8vw] md:text-[3vw] leading-none">
              {vase.title}
            </h1>
            <p className="font-sans text-sm text-foreground/60 uppercase tracking-widest">
              {oneOfAKind[locale] ?? oneOfAKind.en}
            </p>
            <p className="font-display font-black text-2xl">${vase.price}.00</p>
            <AddToCartButton
              item={{ productId: vase.productId, name: vase.title, price: vase.price, quantity: 1 }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
