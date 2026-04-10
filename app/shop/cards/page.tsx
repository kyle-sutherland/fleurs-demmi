import { SiteHeader } from "@/app/components/SiteHeader";
import { AddToCartButton } from "@/app/components/AddToCartButton";

export const metadata = {
  title: "Cards & Goodies — Fleurs d'Emmi",
};

const items = [
  { id: "card-blank", name: "Blank Greeting Card", price: 6 },
  { id: "card-birthday", name: "Birthday Card", price: 6 },
  { id: "card-love", name: "Love & Thanks Card", price: 6 },
  { id: "goodie-ribbon", name: "Satin Ribbon Wrap", price: 4 },
];

export default function CardsPage() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader active="shop" />

      <main className="mx-8 md:mx-32 mt-10 md:mt-16 pb-24">
        <h1 className="font-display font-black text-[11vw] md:text-[5.5vw] leading-none">
          Cards &<br />Goodies
        </h1>
        <p className="font-sans text-base mt-6 max-w-xl text-foreground/80 leading-relaxed">
          Little extras to complete your gift. Cards, small gifts, and seasonal surprises.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col">
              <div className="aspect-square bg-purple/15" />
              <p className="font-display font-bold text-center mt-3 text-lg leading-tight">
                {item.name}
              </p>
              <p className="text-center mt-1 text-sm font-sans text-foreground/60">
                ${item.price}
              </p>
              <AddToCartButton
                item={{ productId: item.id, name: item.name, price: item.price, quantity: 1 }}
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
