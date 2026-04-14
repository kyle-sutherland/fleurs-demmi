import Image from "next/image";
import { getDictionary } from "@/lib/i18n";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "fr" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale);

  return (
    <>
      {children}
      <div className="mx-12 md:mx-32 mt-16 md:mt-24">
        <div className="w-1/2 md:w-80 aspect-square relative overflow-hidden">
          <Image src="/Flower Photos/contact.jpg" alt="Flowers" fill className="object-cover object-center" />
        </div>
      </div>
      <footer id="contact">
        <div className="mx-12 md:mx-32 pt-10 pb-8 max-w-2xl md:max-w-none">
          <h2 className="font-display font-black text-[7.2vw] md:text-[4vw] leading-none">
            {t.footer.heading}
          </h2>
          <p className="font-sans text-sm mt-3 text-foreground/70">
            {t.footer.body}
          </p>
          <form className="mt-8 flex flex-col gap-5 md:flex-row md:items-end">
            <div className="flex-1">
              <input
                type="email"
                name="email"
                required
                placeholder={t.footer.emailLabel}
                className="border-2 border-orange-500 rounded-full bg-foreground/5 font-sans text-sm px-5 py-3 focus:outline-none focus:border-orange-400 w-full placeholder:text-foreground/40"
              />
            </div>
            <button
              type="submit"
              className="self-start font-sans text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-4 py-2 hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-colors whitespace-nowrap"
            >
              {t.footer.subscribe}
            </button>
          </form>
        </div>
        <div className="border-t-2 border-foreground/10 py-8 mx-12 md:mx-32 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm font-sans text-foreground/50">
          <div className="flex items-center justify-between w-full md:w-auto md:justify-start md:gap-6">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground/70 tracking-widest uppercase">Contact &rarr;</span>
              <a href="https://instagram.com/fleursdemmi" target="_blank" rel="noopener noreferrer" className="text-orange-500 font-semibold hover:opacity-80 transition-opacity">
                @fleursdemmi
              </a>
            </div>
            <a href="mailto:fleursdemmi@gmail.com" className="text-orange-500 font-semibold hover:opacity-80 transition-opacity">
              fleursdemmi@gmail.com
            </a>
          </div>
          <span>&copy; {new Date().getFullYear()} {t.footer.copyright}</span>
        </div>
      </footer>
    </>
  );
}
