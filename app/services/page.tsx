import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/app/components/SiteHeader";

export const metadata = {
  title: "Services — Fleurs d'Emmi",
};

export default function ServicesPage() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader active="services" />

      <main className="mx-8 md:mx-32 mt-10 md:mt-16 pb-24">
        <h1 className="font-display font-black text-[14vw] md:text-[6vw] leading-none">
          Services
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          <Link
            href="/services/weddings"
            className="group flex flex-col overflow-hidden rounded-2xl border-2 border-foreground/10 hover:border-foreground/30 transition-colors"
          >
            <div className="relative aspect-[4/3] bg-purple/20 overflow-hidden">
              <Image src="/Flower Photos/Wedding Flowers 3.jpg" alt="Weddings & Special Events" fill className="object-cover object-top" />
            </div>
            <div className="p-6">
              <p className="font-display font-black text-2xl md:text-3xl leading-tight group-hover:underline">
                Weddings &<br />Special Events
              </p>
              <p className="font-sans text-sm mt-3 text-foreground/70 leading-relaxed">
                DIY floral buckets, à la carte arrangements, and full installations.
                Request a custom quote.
              </p>
              <span className="inline-block mt-4 font-sans text-xs uppercase tracking-widest font-semibold underline underline-offset-4">
                Learn more →
              </span>
            </div>
          </Link>

          <Link
            href="/services/funerals"
            className="group flex flex-col overflow-hidden rounded-2xl border-2 border-foreground/10 hover:border-foreground/30 transition-colors"
          >
            <div className="relative aspect-[4/3] bg-foreground/8 overflow-hidden">
              <Image src="/Flower Photos/sympathy.jpeg" alt="Sympathy & Support" fill className="object-cover object-center scale-[1.5625] [filter:brightness(1.0)_contrast(1.04)_saturate(1.15)_sepia(0.18)]" />
            </div>
            <div className="p-6">
              <p className="font-display font-black text-2xl md:text-3xl leading-tight group-hover:underline">
                Sympathy &<br />Support
              </p>
              <p className="font-sans text-sm mt-3 text-foreground/70 leading-relaxed">
                Vase arrangements as a gesture of comfort and remembrance, for honouring
                a loved one or symbolising support.
              </p>
              <span className="inline-block mt-4 font-sans text-xs uppercase tracking-widest font-semibold underline underline-offset-4">
                Learn more →
              </span>
            </div>
          </Link>
        </div>
      </main>

      <footer className="border-t-2 border-foreground/10 py-8 text-center text-xs font-sans text-foreground/50">
        &copy; {new Date().getFullYear()} Fleurs d&apos;Emmi · Montréal, QC
      </footer>
    </div>
  );
}

