import Link from "next/link";
import DaisyLogo from "@/app/components/DaisyLogo";

export const metadata = {
  title: "Weddings & Special Events — Fleurs d'Emmi",
};

export default function WeddingsPage() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader active="services" />

      <main className="mx-4 md:mx-16 mt-10 md:mt-16 pb-24">
        <h1 className="font-display font-black text-[13vw] md:text-[6vw] leading-none">
          Weddings &<br />Special Events
        </h1>

        {/* DIY Buckets */}
        <section className="mt-12 max-w-2xl">
          <h2 className="font-display font-black text-2xl md:text-3xl">DIY Floral Buckets</h2>
          <p className="font-sans text-base mt-3 text-foreground/80 leading-relaxed">
            1 Bucket of flowers — <strong>$150</strong>
          </p>
          <p className="font-sans text-sm mt-2 text-foreground/70 leading-relaxed">
            Contains 2 bunches of focal flowers (30 stems), 3 bunches of small florals (45 stems),
            and 2 bunches of greenery (30–40 stems). Does not include arrangement.
          </p>
        </section>

        {/* À la carte */}
        <section className="mt-12 max-w-2xl">
          <h2 className="font-display font-black text-2xl md:text-3xl">À la Carte Menu</h2>
          <ul className="mt-4 font-sans text-sm text-foreground/80 space-y-2 leading-relaxed">
            {[
              ["Bridal bouquet", "$150–200"],
              ["Boutonniere", "$20"],
              ["Bridesmaids bouquets", "$50–100"],
              ["Corsages", "$30"],
              ["Centerpieces", "$75+"],
              ["Floral installations & arches", "$400+"],
            ].map(([item, price]) => (
              <li key={item} className="flex justify-between border-b border-foreground/10 pb-2">
                <span>{item}</span>
                <span className="font-semibold">{price}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Pickup note */}
        <section className="mt-10 max-w-2xl p-6 bg-foreground/5 font-sans text-sm text-foreground/80 leading-relaxed">
          <p>
            It is recommended to pick up arrangements as close to your event time as possible to
            maximise freshness. Keep the flowers cool and away from direct sunlight; in water
            wherever possible until your event. We cannot guarantee the condition of flowers after
            pick-up. Orders are available for pick up in the Mile End (unless special delivery is
            arranged and paid for in advance).
          </p>
        </section>

        {/* Quote request form */}
        <section className="mt-16 max-w-2xl">
          <h2 className="font-display font-black text-2xl md:text-3xl">Request Your Quote</h2>
          <p className="font-sans text-sm mt-3 text-foreground/70 leading-relaxed">
            Once this form is completed, we will set up a brief phone consultation to go over things
            in more detail and send you a customised quote. Payment is required within 15 days to
            reserve the date, and can be made in person (cash, debit, credit) or by e-transfer.
          </p>

          <form className="mt-8 flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Name" name="name" type="text" required />
              <Field label="Email" name="email" type="email" required />
            </div>
            <Field label="Phone" name="phone" type="tel" required />
            <Field label="Wedding / Event Date" name="event_date" type="date" hint="Please order a minimum of 1 month prior to your event." required />
            <Field label="Wedding / Event Location" name="event_location" type="text" hint="Required if delivery or installation is needed." />
            <Field label="Number of Tables / Guests" name="guest_count" type="text" />

            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold">
                Your Selected Items
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {[
                  "Bridal bouquet",
                  "Boutonniere",
                  "Bridesmaids bouquets",
                  "Corsages",
                  "Centerpieces",
                  "Floral installations & arches",
                  "DIY floral bucket",
                ].map((item) => (
                  <label key={item} className="flex items-center gap-2 font-sans text-sm cursor-pointer">
                    <input type="checkbox" name="items" value={item} className="accent-purple" />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <Textarea label="Notes on Style / Colour" name="style_notes" rows={3} />
            <Textarea label="Additional Information or Requests" name="additional" rows={3} />

            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold">
                Images (optional)
              </label>
              <input
                type="file"
                name="images"
                multiple
                accept="image/*"
                className="font-sans text-sm file:mr-4 file:py-2 file:px-4 file:border-2 file:border-foreground file:bg-transparent file:font-sans file:font-semibold file:text-xs file:uppercase file:tracking-widest cursor-pointer"
              />
            </div>

            {/* Payment placeholder */}
            <div className="p-4 border-2 border-dashed border-foreground/30 font-sans text-sm text-foreground/50 text-center">
              Payment integration coming soon
            </div>

            <button
              type="submit"
              className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-foreground hover:text-background transition-colors"
            >
              Submit Request
            </button>
          </form>
        </section>
      </main>

      <footer className="border-t-2 border-foreground/10 py-8 text-center text-xs font-sans text-foreground/50">
        &copy; {new Date().getFullYear()} Fleurs d&apos;Emmi · Montréal, QC
      </footer>
    </div>
  );
}

function Field({ label, name, type, hint, required }: { label: string; name: string; type: string; hint?: string; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="font-sans text-xs uppercase tracking-widest font-semibold">
        {label}{required && " *"}
      </label>
      {hint && <p className="font-sans text-xs text-foreground/50 -mt-0.5">{hint}</p>}
      <input id={name} name={name} type={type} required={required} className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple" />
    </div>
  );
}

function Textarea({ label, name, rows }: { label: string; name: string; rows: number }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-sans text-xs uppercase tracking-widest font-semibold">{label}</label>
      <textarea name={name} rows={rows} className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple resize-none" />
    </div>
  );
}

function SiteHeader({ active }: { active?: string }) {
  const links = [
    { href: "/shop", label: "Shop" },
    { href: "/services", label: "Services" },
    { href: "/about", label: "About" },
    { href: "/#contact", label: "Contact" },
  ];
  return (
    <header className="relative flex items-center justify-between px-4 py-4 md:flex-col md:items-center md:pt-8 md:pb-0">
      <div className="md:hidden"><Link href="/"><DaisyLogo size={56} /></Link></div>
      <div className="hidden md:flex md:flex-col md:items-center md:gap-5">
        <Link href="/"><DaisyLogo size={120} /></Link>
        <nav className="flex gap-10 text-xs font-sans font-semibold tracking-widest uppercase text-foreground">
          {links.map(({ href, label }) => (
            <Link key={label} href={href} className={`hover:opacity-60 transition-opacity ${active === label.toLowerCase() ? "underline underline-offset-4" : ""}`}>{label}</Link>
          ))}
        </nav>
      </div>
      <div className="hidden md:flex items-center gap-5 absolute top-6 right-8 font-sans text-foreground">
        <Link href="/cart" className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-60 transition-opacity"><CartIcon /><span>0</span></Link>
      </div>
      <div className="flex items-center gap-4 md:hidden">
        <Link href="/cart" className="flex items-center gap-1"><CartIcon /><span className="text-xs font-sans font-semibold">0</span></Link>
        <button className="flex flex-col gap-1.5 p-1" aria-label="Open menu">
          <span className="block w-6 h-0.5 bg-foreground" /><span className="block w-6 h-0.5 bg-foreground" />
        </button>
      </div>
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
