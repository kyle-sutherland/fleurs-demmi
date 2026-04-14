import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/app/components/SiteHeader";
import { getDictionary } from "@/lib/i18n";

const vases = [
  { id: 1, src: "/Vases/1c.jpg", title: "Sgraffito Vase", price: 95 },
  { id: 2, src: "/Vases/4c.jpg", title: "Butter Yellow Vase", price: 95 },
  { id: 3, src: "/Vases/6c.jpg", title: "Seafoam Loop Vase", price: 95 },
];

export default async function VasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const v = t.vases;

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="shop" />

      <main className="mx-12 md:mx-32 mt-10 md:mt-16">
        <h1 className="font-display font-black text-[10.4vw] md:text-[5.5vw] leading-none">
          {v.heading.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
        </h1>
        <p className="font-sans text-base mt-6 max-w-xl text-foreground/80 leading-relaxed">{v.intro}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-10">
          {vases.map((vase) => (
            <Link key={vase.id} href={`/${locale}/shop/vases/${vase.id}`} className="group flex flex-col">
              <div className="relative aspect-square bg-purple/10 overflow-hidden">
                <Image
                  src={vase.src}
                  alt={vase.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors duration-300 flex flex-col items-center justify-center gap-1">
                  <span className="font-display font-black text-background text-lg leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center px-4">
                    {vase.title}
                  </span>
                  <span className="font-sans text-background text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    ${vase.price}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
