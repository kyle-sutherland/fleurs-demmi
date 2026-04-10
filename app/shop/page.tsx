import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/app/components/SiteHeader";

export const metadata = {
  title: "Shop — Fleurs d'Emmi",
};

const products = [
  {
    id: "bouquet-subscription",
    name: "Bouquet Subscription",
    desc: "Bi-weekly seasonal bouquets · from $250",
    href: "/shop/bouquet-subscription",
    image: "/Flower Photos/bouquet1.jpg",
  },
  {
    id: "mothers-day",
    name: "Mother's Day Bouquets",
    desc: "Pick up May 9th or delivery May 10th · from $60",
    href: "/shop/mothers-day",
    image: "/Flower Photos/mama.jpg",
    imageClass: "object-cover object-center",
    imageStyle: { filter: "brightness(1.05) saturate(1.15) sepia(0.1)" },
  },
  {
    id: "vases",
    name: "Handmade & Vintage Vases",
    desc: "One-of-a-kind vessels",
    href: "/shop/vases",
  },
  {
    id: "cards",
    name: "Cards & Goodies",
    desc: "Little extras to complete your gift",
    href: "/shop/cards",
  },
];

export default function ShopPage() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader active="shop" />

      <main className="flex flex-col">
        <h1 className="font-display font-black text-[14vw] md:text-[6vw] leading-none px-4 mt-8 md:px-32">
          flowers &amp; things
        </h1>

        <div className="grid grid-cols-2 gap-6 mt-8 mx-8 md:mx-32 md:grid-cols-2">
          {products.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              className="group flex flex-col overflow-hidden rounded-2xl border-2 border-foreground/10 hover:border-foreground/30 transition-colors"
            >
              <div className="relative aspect-[4/3] w-full bg-purple/20">
                {p.image && <Image src={p.image} alt={p.name} fill className={p.imageClass ?? "object-cover object-center"} style={p.imageStyle} />}
              </div>
              <div className="p-5">
                <p className="font-display font-black text-xl md:text-2xl leading-tight group-hover:underline">
                  {p.name}
                </p>
                <p className="font-sans text-sm mt-2 text-foreground/60">{p.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t-2 border-foreground/10 mt-24 py-8 text-center text-xs font-sans text-foreground/50">
        &copy; {new Date().getFullYear()} Fleurs d&apos;Emmi · Montréal, QC
      </footer>
    </div>
  );
}

