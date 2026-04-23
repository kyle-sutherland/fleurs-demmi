import SiteHeader from "@/app/components/SiteHeader";
import { MothersDayCheckoutForm, type MDArrangement } from "@/app/components/MothersDayCheckoutForm";
import ScallopedPhoto from "@/app/components/ScallopedPhoto";
import { getDictionary } from "@/lib/i18n";
import { getCatalogItemsByCategory } from "@/app/lib/catalog";
import { getInventoryByVariationId } from "@/app/lib/inventory";

export const revalidate = 3600

const MD_CATEGORY = "Mother's Day"
const CARD_CATEGORY = 'Cards & Goodies'
const CARD_ITEM_NAME = 'Candy Flowers Card (blank inside)'

export default async function MothersDayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const m = t.mothersDay;

  const sdkUrl =
    process.env.SQUARE_ENVIRONMENT === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js'

  const [items, cardItems] = await Promise.all([
    getCatalogItemsByCategory(MD_CATEGORY, locale),
    getCatalogItemsByCategory(CARD_CATEGORY, 'en'),
  ])
  const mdItem = items[0]
  const cardItem = cardItems.find((i) => i.name === CARD_ITEM_NAME) ?? cardItems[0]
  const cardPrice = cardItem?.variations[0]?.priceMoney
    ? Number(cardItem.variations[0].priceMoney) / 100
    : 4

  const variationIds = mdItem?.variations.map((v) => v.variationId) ?? []
  const inventory = variationIds.length > 0 ? await getInventoryByVariationId(variationIds) : {}

  const arrangements: MDArrangement[] = (mdItem?.variations ?? []).map((v) => ({
    variationId: v.variationId,
    name: v.name,
    price: Number(v.priceMoney) / 100,
    soldOut: inventory[v.variationId] === 0,
  }))

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="shop" />

      <main className="mx-12 md:mx-32 mt-10 md:mt-16">
        <h1 className="font-display font-black text-[10.4vw] md:text-[5.5vw] leading-none">
          {m.heading.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
        </h1>
        <p className="font-sans text-base mt-6 max-w-xl text-foreground/80 leading-relaxed">{m.intro}</p>

        <div className="mt-8 max-w-2xl md:max-w-[58.8rem] w-full">
          <ScallopedPhoto src="/Flower Photos/mother_flower.jpg" alt="Mother's Day flowers" />
        </div>

        <section className="mt-12 max-w-2xl md:max-w-7xl">
          <MothersDayCheckoutForm
            applicationId={process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!}
            locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!}
            sdkUrl={sdkUrl}
            arrangements={arrangements}
            cardPrice={cardPrice}
            t={{ ...m.form, ...t.checkout.form }}
          />
        </section>
      </main>
    </div>
  );
}
