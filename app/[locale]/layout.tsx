import Image from "next/image";
import { getDictionary } from "@/lib/i18n";
import EmailSignupForm from "@/app/components/EmailSignupForm";

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
          <Image
            src="/Flower Photos/contact.jpg"
            alt="Flowers"
            fill
            sizes="(max-width: 768px) 50vw, 320px"
            className="object-cover object-center"
          />
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
          <EmailSignupForm t={t.footer.form} />
        </div>
        <div className="border-t-2 border-foreground/10 py-8 mx-12 md:mx-32 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm font-sans text-foreground/50">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
            <span className="font-semibold text-foreground/70 tracking-widest uppercase underline md:hidden">
              Contact
            </span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-foreground/70 tracking-widest uppercase">
                &rarr;<span className="md:inline hidden"> Contact</span>
              </span>
              <a
                href="https://instagram.com/fleursdemmi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 font-semibold hover:opacity-80 transition-opacity"
              >
                @fleursdemmi
              </a>
            </div>
            <div className="flex items-center gap-1 md:contents">
              <span className="font-semibold text-foreground/70 tracking-widest uppercase md:hidden">
                &rarr;
              </span>
              <a
                href="mailto:fleursdemmi@gmail.com"
                className="text-orange-500 font-semibold hover:opacity-80 transition-opacity"
              >
                fleursdemmi@gmail.com
              </a>
            </div>
          </div>
          <span>
            &copy; {new Date().getFullYear()} {t.footer.copyright}
          </span>
        </div>
      </footer>
    </>
  );
}
