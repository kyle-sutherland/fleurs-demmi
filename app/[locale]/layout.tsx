import type { Metadata } from "next";
import Image from "next/image";
import { getDictionary } from "@/lib/i18n";
import EmailSignupForm from "@/app/components/EmailSignupForm";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "fr" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fleursdemmi.ca";
  return {
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        en: `${siteUrl}/en`,
        fr: `${siteUrl}/fr`,
      },
    },
  };
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
      <footer id="contact">
        <div className="mx-12 md:mx-32 pt-10 pb-8 max-w-2xl md:max-w-none">
          <h2 className="font-display font-black text-[7.2vw] md:text-[4vw] leading-none">
            {t.footer.heading}
          </h2>
          <p className="font-sans text-sm mt-3 text-foreground/70 md:max-w-[45vw]">
            {t.footer.body}
          </p>
          <EmailSignupForm t={t.footer.form} />
        </div>
        <div className="border-t-2 border-foreground/10 py-8  mx-12 md:mx-32 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm font-sans text-foreground/50">
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
                className="text-[#ff5129] font-semibold hover:opacity-80 transition-opacity"
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
                className="text-[#ff5129] font-semibold hover:opacity-80 transition-opacity"
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
