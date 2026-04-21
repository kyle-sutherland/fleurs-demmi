import Link from "next/link";

const GIFT_CARD_URL = "https://app.squareup.com/gift/MLKRPA4GFPYQD/order";

export default function GiftCardBanner({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <Link
      href={GIFT_CARD_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden border-2 border-foreground/10 transition-colors"
    >
      <div className="p-5 flex flex-col gap-3">
        <p className="font-display font-black text-xl md:text-2xl leading-tight group-hover:underline">{label}</p>
        <p className="font-sans text-sm text-foreground/60">{sublabel}</p>
        <span className="mt-2 self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 group-hover:bg-orange-500 group-hover:border-[#E6E6FA] group-hover:text-[#E6E6FA] transition-colors">
          Buy a Gift Card →
        </span>
      </div>
    </Link>
  );
}
