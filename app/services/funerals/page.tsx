import Image from "next/image";
import Link from "next/link";
import DaisyLogo from "@/app/components/DaisyLogo";

export const metadata = {
  title: "Sympathy & Support — Fleurs d'Emmi",
};

export default function FuneralsPage() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader active="services" />

      <main className="mx-4 md:w-[80%] md:mx-auto mt-10 md:mt-16 pb-24">
        <h1 className="font-display font-black text-[13vw] md:text-[6vw] leading-none">
          Sympathy &<br />Support
        </h1>
        <p className="font-sans text-base mt-6 max-w-xl text-foreground/80 leading-relaxed">
          Our offerings provide a gesture of comfort and remembrance, for honouring a loved one or
          symbolising support to those experiencing the grief of loss.
        </p>

        <div className="relative mt-8 aspect-[4/3] w-full max-w-2xl overflow-hidden">
          <Image
            src="/Flower%20Photos/sympathy.jpeg"
            alt="Sympathy & Support"
            fill
            className="object-cover object-center scale-[1.5625] [filter:brightness(1.0)_contrast(1.04)_saturate(1.15)_sepia(0.18)]"
          />
        </div>

        <section className="mt-12 max-w-2xl md:max-w-7xl">
          <h2 className="font-display font-black text-2xl md:text-3xl">Order Form</h2>
          <p className="font-sans text-xs mt-2 text-foreground/50">
            Orders must be placed a minimum of 3 days before fulfillment.
          </p>

          <form className="mt-8 flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Name" name="name" type="text" required />
              <Field label="Email" name="email" type="email" required />
            </div>
            <Field label="Phone" name="phone" type="tel" required />
            <Field
              label="Funeral Date"
              name="funeral_date"
              type="date"
              hint="Orders must be placed at least 3 days before fulfillment."
              required
            />
            <Field
              label="Funeral Location"
              name="funeral_location"
              type="text"
              hint="Required if delivery or installation is needed."
            />

            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold">Fulfillment *</label>
              <div className="flex flex-col gap-2 font-sans text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="fulfillment" value="pickup" defaultChecked className="accent-purple" /> Pick up
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="fulfillment" value="delivery" className="accent-purple" /> Delivery (+$15)
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold">
                Arrangement *
              </label>
              <select
                name="arrangement"
                required
                className="border-2 border-foreground bg-background font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple appearance-none"
              >
                <option value="">Select an option…</option>
                <option value="small">Small vase arrangement — $50</option>
                <option value="medium">Medium vase arrangement — $100</option>
                <option value="large">Large vase arrangement — $150</option>
              </select>
            </div>

            <Textarea label="Notes on Style / Colour" name="style_notes" rows={3} />

            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold">
                Card ($4) — optional
              </label>
              <p className="font-sans text-xs text-foreground/50">Indicate name of those receiving.</p>
              <Textarea label="" name="card_name" rows={1} />
              <Textarea label="Message for card" name="card_message" rows={3} />
            </div>

            {/* Payment placeholder */}
            <div className="p-4 border-2 border-dashed border-foreground/30 font-sans text-sm text-foreground/50 text-center">
              Payment integration coming soon
            </div>

            <button
              type="submit"
              className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-foreground hover:text-background transition-colors"
            >
              Place Order
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
    <header className="relative flex items-center justify-between px-8 py-6 md:flex-col md:items-center md:pt-12 md:pb-0">
      <div className="md:hidden"><Link href="/"><DaisyLogo size={81} /></Link></div>
      <div className="hidden md:flex md:flex-col md:items-center md:gap-5">
        <Link href="/"><DaisyLogo size={175} /></Link>
        <nav className="flex gap-10 text-[0.992rem] font-sans tracking-widest uppercase text-foreground">
          {links.map(({ href, label }) => (
            <Link key={label} href={href} className={`hover:opacity-60 transition-opacity ${active === label.toLowerCase() ? "underline underline-offset-4" : ""}`}>{label}</Link>
          ))}
        </nav>
      </div>
      <div className="hidden md:flex items-center gap-5 absolute top-10 right-12 font-sans text-foreground">
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
