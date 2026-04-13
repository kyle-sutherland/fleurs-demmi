import { SiteHeader } from "@/app/components/SiteHeader";
import { MothersDayForm } from "./MothersDayForm";

export const metadata = {
  title: "Mother's Day Bouquets — Fleurs d'Emmi",
};

export default function MothersDayPage() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader active="shop" />

      <main className="mx-8 md:mx-32 mt-10 md:mt-16 pb-24">
        <h1 className="font-display font-black text-[11vw] md:text-[5.5vw] leading-none">
          Mother&apos;s Day<br />Bouquets
        </h1>

        <p className="font-sans text-base mt-6 max-w-xl text-foreground/80 leading-relaxed">
          It&apos;s that special time of year to show love to all the wonderful mothers in our lives.
        </p>

        <section className="mt-12 max-w-2xl">
          <MothersDayForm />
        </section>
      </main>

      <footer className="border-t-2 border-foreground/10 py-8 text-center text-xs font-sans text-foreground/50">
        &copy; {new Date().getFullYear()} Fleurs d&apos;Emmi · Montréal, QC
      </footer>
    </div>
  );
}
