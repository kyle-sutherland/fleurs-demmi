import { SiteHeader } from "@/app/components/SiteHeader";
import { AddToCartButton } from "@/app/components/AddToCartButton";

export const metadata = {
  title: "Handmade & Vintage Vases — Fleurs d'Emmi",
};

const vases = [
  { id: "vase-1", name: "Ceramic Bud Vase", price: 28 },
  { id: "vase-2", name: "Vintage Glass Bottle", price: 22 },
  { id: "vase-3", name: "Stoneware Pitcher", price: 45 },
  { id: "vase-4", name: "Terracotta Pot", price: 18 },
  { id: "vase-5", name: "Hand-thrown Bowl", price: 55 },
  { id: "vase-6", name: "Milk Glass Vase", price: 32 },
  { id: "vase-7", name: "Amber Bottle", price: 20 },
  { id: "vase-8", name: "Glazed Cylinder", price: 38 },
];

export default function VasesPage() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader active="shop" />

      <main className="mx-8 md:mx-32 mt-10 md:mt-16 pb-24">
        <h1 className="font-display font-black text-[11vw] md:text-[5.5vw] leading-none">
          Handmade &<br />Vintage Vases
        </h1>
        <p className="font-sans text-base mt-6 max-w-xl text-foreground/80 leading-relaxed">
          Unique vessels for every arrangement. Each piece is one-of-a-kind — handmade ceramics,
          vintage finds, and lovingly sourced containers.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
          {vases.map((vase) => (
            <div key={vase.id} className="flex flex-col">
              <div className="aspect-square bg-purple/20" />
              <p className="font-display font-bold text-center mt-3 text-lg leading-tight">
                {vase.name}
              </p>
              <p className="text-center mt-1 text-sm font-sans text-foreground/60">
                ${vase.price}
              </p>
              <AddToCartButton
                item={{ productId: vase.id, name: vase.name, price: vase.price, quantity: 1 }}
                className="mt-3 w-full font-sans font-semibold text-xs uppercase tracking-widest border-2 border-foreground text-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
              />
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t-2 border-foreground/10 py-8 text-center text-xs font-sans text-foreground/50">
        &copy; {new Date().getFullYear()} Fleurs d&apos;Emmi · Montréal, QC
      </footer>
    </div>
  );
}
