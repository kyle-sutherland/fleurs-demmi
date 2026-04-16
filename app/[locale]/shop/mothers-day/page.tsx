import SiteHeader from "@/app/components/SiteHeader";
import { MothersDayCheckoutForm } from "@/app/components/MothersDayCheckoutForm";
import { getDictionary } from "@/lib/i18n";

export default async function MothersDayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const m = t.mothersDay;

  const sdkUrl =
    process.env.SQUARE_ENVIRONMENT === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js'

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="shop" />

      <main className="mx-12 md:mx-32 mt-10 md:mt-16">
        <h1 className="font-display font-black text-[10.4vw] md:text-[5.5vw] leading-none">
          {m.heading.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
        </h1>

        <p className="font-sans text-base mt-6 max-w-xl text-foreground/80 leading-relaxed">{m.intro}</p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Flower Photos/mother_flower.jpg"
          alt="Mother's Day flowers"
          className="mt-8 max-w-2xl w-full h-auto"
        />

        <section className="mt-12 max-w-2xl">
          <MothersDayCheckoutForm
            applicationId={process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!}
            locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!}
            sdkUrl={sdkUrl}
            t={m.form}
          />
        </section>
      </main>
    </div>
  );
}
