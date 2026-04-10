import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";

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
              <div className="flex gap-4">
                <label className="flex items-center gap-2 font-sans text-sm cursor-pointer">
                  <input type="checkbox" name="fulfillment" value="pickup" className="accent-purple" required /> Pick up
                </label>
                <label className="flex items-center gap-2 font-sans text-sm cursor-pointer">
                  <input type="checkbox" name="fulfillment" value="delivery" className="accent-purple" /> Delivery
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
                <option value="small">Small vase arrangement — $80</option>
                <option value="medium">Medium vase arrangement — $120</option>
                <option value="large">Large vase arrangement — $160</option>
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

