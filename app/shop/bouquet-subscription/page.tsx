import { SiteHeader } from "@/app/components/SiteHeader";
import BouquetSlideshow from "@/app/components/BouquetSlideshow";
import { SubscriptionTierCard } from "./SubscriptionTierCard";

export const metadata = {
  title: "Bouquet Subscription — Fleurs d'Emmi",
};

const tiers = [
  {
    id: "8weeks",
    productId: "subscription-8weeks",
    label: "Bi-weekly for 8 weeks",
    dates: "June 27th to Oct 3rd",
    price: 250,
    available: 20,
  },
  {
    id: "12weeks",
    productId: "subscription-12weeks",
    label: "Bi-weekly for 12 weeks",
    dates: "May 30th to Oct 31st",
    price: 350,
    available: 20,
  },
];

export default function BouquetSubscriptionPage() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader active="shop" />

      <main className="mx-8 md:mx-32 mt-10 md:mt-16 pb-24">
        <h1 className="font-display font-black text-[12vw] md:text-[6vw] leading-none">
          Bouquet<br />Subscription
        </h1>

        <p className="mt-6 font-sans text-base max-w-xl text-foreground/80 leading-relaxed">
          Subscribe to regularly receive bi-weekly, seasonal bouquet arrangements made with local
          flowers. Pick up in the Mile End on Saturdays. Home delivery can be scheduled for an
          extra <strong>$10.00 per bouquet</strong>.
        </p>

        <div className="mt-12 flex flex-col md:flex-row md:gap-12 md:items-stretch">
          {/* Tiers */}
          <section className="flex-1 max-w-[960px] flex flex-col gap-6">
            {tiers.map((tier) => (
              <SubscriptionTierCard key={tier.id} tier={tier} />
            ))}
          </section>

          {/* Slideshow — desktop only */}
          <div className="hidden md:flex flex-shrink-0 w-[420px] ml-12">
            <BouquetSlideshow className="w-full h-full" />
          </div>
        </div>

        {/* Slideshow — mobile only */}
        <div className="mt-8 md:hidden">
          <BouquetSlideshow />
        </div>
      </main>

      <footer className="border-t-2 border-foreground/10 py-8 text-center text-xs font-sans text-foreground/50">
        &copy; {new Date().getFullYear()} Fleurs d&apos;Emmi · Montréal, QC
      </footer>
    </div>
  );
}
