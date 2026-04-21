import SiteHeader from "@/app/components/SiteHeader";
import WeddingSlideshow from "@/app/components/WeddingSlideshow";
import { WeddingsForm } from "@/app/components/WeddingsForm";
import { getDictionary } from "@/lib/i18n";

export default async function WeddingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const w = t.weddings;

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="services" />

      <main className="mx-12 md:mx-32 mt-10 md:mt-16">
        <h1 className="font-display font-black text-[10.4vw] md:text-[6vw] leading-none">
          {w.heading.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
        </h1>

        <div className="md:hidden mt-8">
          <WeddingSlideshow />
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="text-center md:text-left">
            <section>
              <h2 className="font-display font-black text-2xl md:text-3xl">{w.diy.heading}</h2>
              <p className="font-sans text-base mt-3 text-foreground/80 leading-relaxed">
                {w.diy.price.split("$150").map((part, i) =>
                  i === 0 ? part : <span key={i}><strong>$150</strong>{part}</span>
                )}
              </p>
              <p className="font-sans text-sm mt-2 text-foreground/70 leading-relaxed">{w.diy.description}</p>
            </section>

            <section className="mt-10">
              <h2 className="font-display font-black text-2xl md:text-3xl">{w.menu.heading}</h2>
              <ul className="mt-4 font-sans text-sm text-foreground/80 space-y-2 leading-relaxed">
                {w.menu.items.map(([item, price]) => (
                  <li key={item} className="flex justify-between border-b border-foreground/10 pb-2">
                    <span>{item}</span>
                    <span className="font-semibold">{price}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10 p-6 bg-foreground/5 font-sans text-sm text-foreground/80 leading-relaxed">
              <p>{w.note}</p>
            </section>
          </div>

          <div className="hidden md:block md:self-end">
            <WeddingSlideshow />
          </div>
        </div>

        <section className="mt-16 max-w-2xl md:max-w-7xl">
          <h2 className="font-display font-black text-2xl md:text-3xl">{w.form.heading}</h2>
          <p className="font-sans text-sm mt-3 text-foreground/70 leading-relaxed">{w.form.intro}</p>
          <WeddingsForm t={w.form} />
        </section>
      </main>
    </div>
  );
}
