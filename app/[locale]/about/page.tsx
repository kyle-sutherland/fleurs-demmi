import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/app/components/SiteHeader";
import { getDictionary } from "@/lib/i18n";

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="about" />

      <main className="flex flex-col">
        <div className="mx-12 md:mx-32 mt-10 md:mt-16">
          <h1 className="font-display font-black text-[10.4vw] md:text-[7vw] leading-none">
            {t.about.heading}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 mx-12 md:mx-32">
          <div className="relative aspect-[3/4]">
            <Image src="/60c13257-cae1-486f-b37a-683c0594416b.jpeg" alt="Emily Gray with flower cart" fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" priority />
          </div>
          <div className="relative aspect-[3/4]">
            <Image src="/ee457bb0-6711-4bd4-a478-09e127b505a6.jpeg" alt="Emily Gray watering plants" fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
          </div>
        </div>

        <div className="mx-12 md:mx-32 mt-12 md:mt-16 max-w-2xl md:max-w-none">
          {t.about.paragraphs.map((para, i) => (
            <p key={i} className="font-sans text-base leading-relaxed text-foreground/80 mt-6 first:mt-0">
              {para}
            </p>
          ))}
          <div className="flex gap-4 mt-10">
            <Link
              href={`/${locale}/shop`}
              className="font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-8 py-3 hover:bg-foreground hover:text-background transition-colors"
            >
              {t.about.shopBtn}
            </Link>
            <Link
              href={`/${locale}/services`}
              className="font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground/30 text-foreground px-8 py-3 hover:border-foreground transition-colors"
            >
              {t.about.servicesBtn}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
