import Image from "next/image";
import SiteHeader from "@/app/components/SiteHeader";
import { getDictionary } from "@/lib/i18n";

export default async function FuneralsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const f = t.funerals;

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="services" />

      <main className="mx-12 md:w-[80%] md:mx-auto mt-10 md:mt-16">
        <h1 className="font-display font-black text-[10.4vw] md:text-[6vw] leading-none">
          {f.heading.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
        </h1>
        <p className="font-sans text-base mt-6 max-w-xl text-foreground/80 leading-relaxed">{f.intro}</p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Flower Photos/sympathy.jpeg"
          alt="Sympathy & Support"
          className="mt-8 max-w-2xl w-full h-auto"
        />

        <section className="mt-12 max-w-2xl md:max-w-7xl">
          <h2 className="font-display font-black text-2xl md:text-3xl">{f.form.heading}</h2>
          <p className="font-sans text-xs mt-2 text-foreground/50">{f.form.hint}</p>

          <form className="mt-8 flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label={f.form.name} name="name" type="text" required />
              <Field label={f.form.email} name="email" type="email" required />
            </div>
            <Field label={f.form.phone} name="phone" type="tel" required />
            <Field label={f.form.funeralDate} name="funeral_date" type="date" hint={f.form.funeralDateHint} required />
            <Field label={f.form.funeralLocation} name="funeral_location" type="text" hint={f.form.funeralLocationHint} />

            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold">{f.form.fulfillment} *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 font-sans text-sm cursor-pointer">
                  <input type="checkbox" name="fulfillment" value="pickup" className="accent-purple" required /> {f.form.pickUp}
                </label>
                <label className="flex items-center gap-2 font-sans text-sm cursor-pointer">
                  <input type="checkbox" name="fulfillment" value="delivery" className="accent-purple" /> {f.form.delivery}
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold">{f.form.arrangement} *</label>
              <select name="arrangement" required className="border-2 border-foreground bg-background font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple appearance-none">
                <option value="">{f.form.arrangementPlaceholder}</option>
                {f.form.arrangements.map(({ label, value }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <Textarea label={f.form.styleNotes} name="style_notes" rows={3} />

            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold">{f.form.card}</label>
              <p className="font-sans text-xs text-foreground/50">{f.form.cardRecipient}</p>
              <Textarea label="" name="card_name" rows={1} />
              <Textarea label={f.form.cardMessage} name="card_message" rows={3} />
            </div>

            <div className="p-4 border-2 border-dashed border-foreground/30 font-sans text-sm text-foreground/50 text-center">
              {f.form.paymentSoon}
            </div>

            <button type="submit" className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-foreground hover:text-background transition-colors">
              {f.form.submit}
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
