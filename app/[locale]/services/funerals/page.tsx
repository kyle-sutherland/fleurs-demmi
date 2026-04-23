import SiteHeader from "@/app/components/SiteHeader";
import {
  FuneralsForm,
  type SympathyArrangement,
} from "@/app/components/FuneralsForm";
import { getDictionary } from "@/lib/i18n";
import { getCatalogItemsByCategory } from "@/app/lib/catalog";
import { getInventoryByVariationId } from "@/app/lib/inventory";

export const revalidate = 3600;

const SYMPATHY_CATEGORY = "Sympathy";

export default async function FuneralsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const f = t.funerals;

  const items = await getCatalogItemsByCategory(SYMPATHY_CATEGORY, locale);
  const variationIds = items.flatMap((item) =>
    item.variations.map((v) => v.variationId),
  );
  const inventory =
    variationIds.length > 0
      ? await getInventoryByVariationId(variationIds)
      : {};

  const arrangements: SympathyArrangement[] = items.flatMap((item) =>
    item.variations.map((v) => ({
      variationId: v.variationId,
      name: v.name,
      price: Number(v.priceMoney) / 100,
      soldOut: inventory[v.variationId] === 0,
    })),
  );

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="services" />

      <main className="mx-12 md:mx-32 mt-10 md:mt-16">
        <h1 className="font-display font-black text-[10.4vw] md:text-[6vw] leading-none">
          {f.heading.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i === 0 && <br />}
            </span>
          ))}
        </h1>
        <p className="font-sans text-base mt-6 max-w-xl text-foreground/80 leading-relaxed">
          {f.intro}
        </p>

        <div className="mt-8 max-w-2xl md:max-w-[58.8rem] w-full border-[24px] border-[#E6E6FA]">
          <div className="overflow-hidden">
            {/* eslin -disable-next-line @next/next/no-img-element */}
            <img
              src="/Flower Photos/sympathy.jpeg"
              alt="Sympathy & Support"
              className="w-full h-auto scale-[1.15] block"
            />
          </div>
        </div>

        <section className="mt-12 max-w-2xl md:max-w-7xl">
          <h2 className="font-display font-black text-2xl md:text-3xl">
            {f.form.heading}
          </h2>
          <p className="font-sans text-base mt-2 text-foreground/50">
            {f.form.hint}
          </p>

          <FuneralsForm arrangements={arrangements} t={f.form} />
        </section>
      </main>
    </div>
  );
}
