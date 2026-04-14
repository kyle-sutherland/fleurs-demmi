import SiteHeader from "@/app/components/SiteHeader";
import WeddingSlideshow from "@/app/components/WeddingSlideshow";
import { getDictionary } from "@/lib/i18n";

export default async function WeddingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const w = t.weddings;

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="services" />

      <main className="mx-12 md:w-[80%] md:mx-auto mt-10 md:mt-16">
        <h1 className="font-display font-black text-[10.4vw] md:text-[6vw] leading-none">
          {w.heading.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
        </h1>

        <div className="md:hidden mt-8">
          <WeddingSlideshow />
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="text-center md:text-left">
            <section>
              <h2 className="font-display font-black text-2xl md:text-3xl">{w.diy.heading}</h2>
              <p className="font-sans text-base mt-3 text-foreground/80 leading-relaxed">
                {w.diy.price.split("$150").map((part, i) =>
                  i === 0 ? part : <span key={i}><strong>$150</strong>{part}</span>
                )}
              </p>
              <p className="font-sans text-sm mt-2 text-foreground/70 leading-relaxed">{w.diy.description}</p>
            </section>

            <section className="mt-10">
              <h2 className="font-display font-black text-2xl md:text-3xl">{w.menu.heading}</h2>
              <ul className="mt-4 font-sans text-sm text-foreground/80 space-y-2 leading-relaxed">
                {w.menu.items.map(([item, price]) => (
                  <li key={item} className="flex justify-between border-b border-foreground/10 pb-2">
                    <span>{item}</span>
                    <span className="font-semibold">{price}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10 p-6 bg-foreground/5 font-sans text-sm text-foreground/80 leading-relaxed">
              <p>{w.note}</p>
            </section>
          </div>

          <div className="hidden md:block md:self-end">
            <WeddingSlideshow />
          </div>
        </div>

        <section className="mt-16 max-w-2xl md:max-w-7xl">
          <h2 className="font-display font-black text-2xl md:text-3xl">{w.form.heading}</h2>
          <p className="font-sans text-sm mt-3 text-foreground/70 leading-relaxed">{w.form.intro}</p>

          <form className="mt-8 flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label={w.form.name} name="name" type="text" required />
              <Field label={w.form.email} name="email" type="email" required />
            </div>
            <Field label={w.form.phone} name="phone" type="tel" required />
            <Field label={w.form.eventDate} name="event_date" type="date" hint={w.form.eventDateHint} required />

            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold">{w.form.fulfillment} *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 font-sans text-sm cursor-pointer">
                  <input type="checkbox" name="fulfillment" value="pickup" className="accent-purple" required /> {w.form.pickUp}
                </label>
                <label className="flex items-center gap-2 font-sans text-sm cursor-pointer">
                  <input type="checkbox" name="fulfillment" value="delivery" className="accent-purple" /> {w.form.delivery}
                </label>
              </div>
            </div>

            <Field label={w.form.eventLocation} name="event_location" type="text" hint={w.form.eventLocationHint} />
            <Field label={w.form.guestCount} name="guest_count" type="text" />

            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold">{w.form.selectedItems}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {w.form.items.map((item) => (
                  <label key={item} className="flex items-center gap-2 font-sans text-sm cursor-pointer">
                    <input type="checkbox" name="items" value={item} className="accent-purple" />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <Textarea label={w.form.styleNotes} name="style_notes" rows={3} />
            <Textarea label={w.form.additionalInfo} name="additional" rows={3} />

            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs uppercase tracking-widest font-semibold">{w.form.images}</label>
              <input type="file" name="images" multiple accept="image/*" className="font-sans text-sm file:mr-4 file:py-2 file:px-4 file:border-2 file:border-foreground file:bg-transparent file:font-sans file:font-semibold file:text-xs file:uppercase file:tracking-widest cursor-pointer" />
            </div>

            <div className="p-4 border-2 border-dashed border-foreground/30 font-sans text-sm text-foreground/50 text-center">
              {w.form.paymentSoon}
            </div>

            <button type="submit" className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-foreground hover:text-background transition-colors">
              {w.form.submit}
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
      <label className="font-sans text-xs uppercase tracking-widest font-semibold">{label}</label>
      <textarea name={name} rows={rows} className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple resize-none" />
    </div>
  );
}
