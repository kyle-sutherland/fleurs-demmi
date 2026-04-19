import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/app/components/SiteHeader";
import { getDictionary } from "@/lib/i18n";

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="services" />

      <main className="mx-12 md:mx-32 mt-10 md:mt-16">
        <h1 className="font-display font-black text-[10.4vw] md:text-[6vw] leading-none">
          {t.services.heading}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          <Link href={`/${locale}/services/weddings`} className="group flex flex-col overflow-hidden border-2 border-foreground/10 hover:border-foreground/30 transition-colors">
            <div className="relative aspect-[4/3] bg-purple/20 overflow-hidden">
              <Image src="/Flower Photos/Wedding Flowers 3.jpg" alt={t.services.weddings.label.replace("\n", " ")} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-top" />
            </div>
            <div className="p-6">
              <p className="font-display font-black text-2xl md:text-3xl leading-tight group-hover:underline">
                {t.services.weddings.label.split("\n").map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </p>
              <p className="font-sans text-sm mt-3 text-foreground/70 leading-relaxed">{t.services.weddings.body}</p>
              <span className="inline-block mt-4 font-sans text-xs uppercase tracking-widest font-semibold underline underline-offset-4">
                {t.services.learnMore}
              </span>
            </div>
          </Link>

          <Link href={`/${locale}/services/funerals`} className="group flex flex-col overflow-hidden border-2 border-foreground/10 hover:border-foreground/30 transition-colors">
            <div className="relative aspect-[4/3] bg-foreground/5 overflow-hidden">
              <Image src="/Flower Photos/sympathy.jpeg" alt={t.services.sympathy.label.replace("\n", " ")} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-center scale-[1.5625] [filter:brightness(1.0)_contrast(1.04)_saturate(1.15)_sepia(0.18)]" />
            </div>
            <div className="p-6">
              <p className="font-display font-black text-2xl md:text-3xl leading-tight group-hover:underline">
                {t.services.sympathy.label.split("\n").map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </p>
              <p className="font-sans text-sm mt-3 text-foreground/70 leading-relaxed">{t.services.sympathy.body}</p>
              <span className="inline-block mt-4 font-sans text-xs uppercase tracking-widest font-semibold underline underline-offset-4">
                {t.services.learnMore}
              </span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
