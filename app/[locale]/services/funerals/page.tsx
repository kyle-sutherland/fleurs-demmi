import SiteHeader from "@/app/components/SiteHeader";
import { FuneralsCheckoutForm } from "@/app/components/FuneralsCheckoutForm";
import { getDictionary } from "@/lib/i18n";

export default async function FuneralsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const f = t.funerals;

  const sdkUrl =
    process.env.SQUARE_ENVIRONMENT === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js'

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="services" />

      <main className="mx-12 md:w-[80%] md:mx-auto mt-10 md:mt-16">
        <h1 className="font-display font-black text-[10.4vw] md:text-[6vw] leading-none">
          {f.heading.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
        </h1>
        <p className="font-sans text-base mt-6 max-w-xl text-foreground/80 leading-relaxed">{f.intro}</p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Flower Photos/sympathy.jpeg"
          alt="Sympathy & Support"
          className="mt-8 max-w-2xl w-full h-auto"
        />

        <section className="mt-12 max-w-2xl md:max-w-7xl">
          <h2 className="font-display font-black text-2xl md:text-3xl">{f.form.heading}</h2>
          <p className="font-sans text-xs mt-2 text-foreground/50">{f.form.hint}</p>

          <FuneralsCheckoutForm
            applicationId={process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!}
            locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!}
            sdkUrl={sdkUrl}
            t={f.form}
          />
        </section>
      </main>
    </div>
  );
}
