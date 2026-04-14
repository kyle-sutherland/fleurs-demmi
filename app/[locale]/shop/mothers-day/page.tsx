import Image from "next/image";
import SiteHeader from "@/app/components/SiteHeader";
import { getDictionary } from "@/lib/i18n";

export default async function MothersDayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const m = t.mothersDay;

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="shop" />

      <main className="mx-12 md:mx-32 mt-10 md:mt-16">
        <h1 className="font-display font-black text-[10.4vw] md:text-[5.5vw] leading-none">
          {m.heading.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
        </h1>

        <p className="font-sans text-base mt-6 max-w-xl text-foreground/80 leading-relaxed">{m.intro}</p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Flower Photos/mother_flower.jpg"
          alt="Mother's Day flowers"
          className="mt-8 max-w-2xl w-full h-auto"
        />

        <section className="mt-12 max-w-2xl">
          <form className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label={m.form.name} name="name" type="text" required />
              <Field label={m.form.email} name="email" type="email" required />
            </div>
            <Field label={m.form.phone} name="phone" type="tel" required />

            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold">{m.form.fulfillment} *</label>
              <div className="flex flex-col gap-2 font-sans text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="fulfillment" value="pickup" defaultChecked className="accent-purple" />
                  {m.form.pickUp}
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="fulfillment" value="delivery" className="accent-purple" />
                  {m.form.delivery}
                </label>
              </div>
            </div>

            <Field label={m.form.deliveryAddress} name="address" type="text" hint={m.form.deliveryAddressHint} />
            <Field label={m.form.deliveryTime} name="delivery_time" type="text" hint={m.form.deliveryTimeHint} />

            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold">{m.form.arrangement} *</label>
              <div className="flex flex-col gap-2 font-sans text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="arrangement" value="50" defaultChecked className="accent-purple" />
                  {m.form.arrangement50}
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="arrangement" value="75" className="accent-purple" />
                  {m.form.arrangement75}
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-5 bg-foreground/5">
              <p className="font-sans text-xs uppercase tracking-widest font-semibold">{m.form.card}</p>
              <Field label={m.form.cardName} name="card_to" type="text" />
              <Textarea label={m.form.cardMessage} name="card_message" rows={3} />
            </div>

            <div className="p-4 border-2 border-dashed border-foreground/30 font-sans text-sm text-foreground/50 text-center">
              {m.form.paymentSoon}
            </div>

            <button type="submit" className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-foreground hover:text-background transition-colors">
              {m.form.submit}
            </button>
          </form>
        </section>
      </main>
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
