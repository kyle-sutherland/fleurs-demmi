import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Fleurs d'Emmi",
  description: "The floral project of Emily Gray, based in Montréal, QC.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader active="about" />

      <main className="flex flex-col">
        <div className="mx-8 md:mx-32 mt-10 md:mt-16">
          <h1 className="font-display font-black text-[14vw] md:text-[7vw] leading-none">
            About
          </h1>
        </div>

        {/* Photos */}
        <div className="grid grid-cols-2 gap-4 mt-8 mx-8 md:mx-32">
          <div className="relative aspect-3/4">
            <Image
              src="/60c13257-cae1-486f-b37a-683c0594416b.jpeg"
              alt="Emily Gray with flower cart"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="relative aspect-3/4">
            <Image
              src="/ee457bb0-6711-4bd4-a478-09e127b505a6.jpeg"
              alt="Emily Gray watering plants"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="mx-8 md:mx-32 mt-12 md:mt-16 max-w-2xl md:max-w-none">
          <p className="font-sans text-base leading-relaxed text-foreground/80">
            fleurs d&apos;emmi is the floral project of <strong>Emily Gray</strong>, based in
            Montréal, Québec, using primarily local blooms grown by local farmers and from her own
            garden. With a background in visual arts (BFA c.2017) and over 10 years of experience
            working on various farms across Canada, her passion for local flowers emerged in 2020.
          </p>
          <p className="font-sans text-base leading-relaxed text-foreground/80 mt-5">
            She has completed her permaculture design certificate with P3 Permaculture and has worked
            on the farm team at Ferme Les Petits Victoires, Bee Balm Botanicals and Earth Candy Farm.
            In 2025, she started a garden on a rooftop in the Mile End and a guerilla garden in the
            &lsquo;soul patch&rsquo;. She has since expanded her project to a larger plot of land
            located in Valcourt, QC where she collaborates with willow grower Ingrid Weigel. As a
            self-taught florist, she has created arrangements alongside the team at Fleuriste Sophie
            Dorval, Flori Flora, and Oursin Fleurs.
          </p>
          <p className="font-sans text-base leading-relaxed text-foreground/80 mt-5">
            An artist by nature, she views her surroundings as a part of life&apos;s collage. Her
            multimedia practice — fibres, ceramics, woodworking, painting, performance art, culinary
            arts — informs her sensibility to create with an attention to detail and care. Her
            artistic language when working with flowers bridges between elegant and rustic. She is
            eclectic in her taste, often drawn to non-traditional floral arrangements, bold palettes,
            and vintage or handmade vases.
          </p>
          <p className="font-sans text-base leading-relaxed text-foreground/80 mt-5">
            She is eager to provide floral services catering to all kinds of events including
            weddings, funerals, special events, and everyday living.
          </p>

          <div className="flex gap-6 mt-10">
            <Link
              href="/shop"
              className="font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-8 py-3 hover:bg-foreground hover:text-background transition-colors"
            >
              Shop
            </Link>
            <Link
              href="/services"
              className="font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-8 py-3 hover:bg-foreground hover:text-background transition-colors"
            >
              Services
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t-2 border-foreground/10 mt-24 py-8 text-center text-xs font-sans text-foreground/50">
        &copy; {new Date().getFullYear()} Fleurs d&apos;Emmi · Montréal, QC
      </footer>
    </div>
  );
}

