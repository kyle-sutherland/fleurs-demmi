import Link from "next/link";
import DaisyLogo from "@/app/components/DaisyLogo";

export const metadata = {
  title: "Mother's Day Bouquets — Fleurs d'Emmi",
};

export default function MothersDayPage() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader active="shop" />

      <main className="mx-4 md:mx-16 mt-10 md:mt-16 pb-24">
        <h1 className="font-display font-black text-[11vw] md:text-[5.5vw] leading-none">
          Mother&apos;s Day<br />Bouquets
        </h1>

        <p className="font-sans text-base mt-6 max-w-xl text-foreground/80 leading-relaxed">
          It&apos;s that special time of year to show love to all the wonderful mothers in our lives.
        </p>

        <section className="mt-12 max-w-2xl">
          <form className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Name" name="name" type="text" required />
              <Field label="Email" name="email" type="email" required />
            </div>
            <Field label="Phone" name="phone" type="tel" required />

            {/* Pickup / delivery */}
            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold">
                Fulfillment *
              </label>
              <div className="flex flex-col gap-2 font-sans text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="fulfillment" value="pickup" defaultChecked className="accent-purple" />
                  Pick up in Mile End — Fri May 2nd, 10am–5pm
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="fulfillment" value="delivery" className="accent-purple" />
                  Delivery — Sat May 3rd (+$10)
                </label>
              </div>
            </div>

            <Field label="Delivery Address" name="address" type="text" hint="Only required if choosing delivery." />
            <Field label="Preferred Delivery Time" name="delivery_time" type="text" hint="e.g. Morning, Afternoon" />

            {/* Bouquet selection */}
            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold">
                $60 Bouquet Style *
              </label>
              <select name="bouquet_style" required className="border-2 border-foreground bg-background font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple appearance-none">
                <option value="">Select a style…</option>
                <option value="soft_warm">Soft &amp; Warm</option>
                <option value="bold_bright">Bold &amp; Bright</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold">
                Custom Bouquet
              </label>
              <select name="custom_bouquet" className="border-2 border-foreground bg-background font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple appearance-none">
                <option value="">None</option>
                <option value="80">Custom Bouquet — $80</option>
                <option value="100">Custom Bouquet — $100</option>
              </select>
            </div>

            <Textarea label="Notes on Style / Colour" name="style_notes" rows={3} />

            {/* Card */}
            <div className="flex flex-col gap-2 p-5 bg-foreground/5">
              <p className="font-sans text-xs uppercase tracking-widest font-semibold">
                Add a Card — $4 (optional)
              </p>
              <Field label="Name of Mother" name="card_to" type="text" />
              <Textarea label="Message" name="card_message" rows={3} />
            </div>

            {/* Payment placeholder */}
            <div className="p-4 border-2 border-dashed border-foreground/30 font-sans text-sm text-foreground/50 text-center">
              Payment integration coming soon
            </div>

            <button
              type="submit"
              className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-foreground hover:text-background transition-colors"
            >
              Check Out
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
      {label && <label className="font-sans text-xs uppercase tracking-widest font-semibold">{label}</label>}
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
