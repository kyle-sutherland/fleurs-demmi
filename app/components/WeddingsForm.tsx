"use client";

import { useCallback, useState } from "react";
import { TurnstileWidget } from "@/app/components/TurnstileWidget";

type Props = {
  t: {
    name: string;
    email: string;
    phone: string;
    eventDate: string;
    eventDateHint: string;
    fulfillment: string;
    pickUp: string;
    delivery: string;
    eventLocation: string;
    eventLocationHint: string;
    guestCount: string;
    selectedItems: string;
    items: string[];
    styleNotes: string;
    additionalInfo: string;
    images: string;
    imagesNote: string;
    subscribeLabel: string;
    submit: string;
    submitSuccess: string;
  };
};

export function WeddingsForm({ t }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery" | "">(
    "",
  );
  const [subscribeToNews, setSubscribeToNews] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const onTurnstileToken = useCallback((t: string) => setTurnstileToken(t), []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    const body = {
      name: data.get("name") as string,
      email: data.get("email") as string,
      phone: data.get("phone") as string,
      event_date: data.get("event_date") as string,
      fulfillment,
      event_location: data.get("event_location") as string,
      guest_count: data.get("guest_count") as string,
      items: data.getAll("items"),
      style_notes: data.get("style_notes") as string,
      additional: data.get("additional") as string,
      subscribe_to_news: subscribeToNews,
      turnstile: turnstileToken,
    };

    try {
      const res = await fetch("/api/inquire/weddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Something went wrong. Please try again.");

        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-8 p-8 border-2 border-foreground/20 flex flex-col gap-3 max-w-lg">
        <p className="font-display font-black text-2xl">Request received!</p>
        <p className="font-sans text-sm text-foreground/70 leading-relaxed">
          {t.submitSuccess}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
      {/* Honeypot */}
      <input
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        style={{ display: "none" }}
        aria-hidden="true"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label={t.name} name="name" type="text" required />
        <Field label={t.email} name="email" type="email" required />
      </div>
      <Field label={t.phone} name="phone" type="tel" required />
      <Field
        label={t.eventDate}
        name="event_date"
        type="date"
        hint={t.eventDateHint}
        required
      />

      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">
          {t.fulfillment} *
        </label>
        <div className="flex flex-col gap-2 font-sans text-sm">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="fulfillment"
              value="pickup"
              checked={fulfillment === "pickup"}
              onChange={() => setFulfillment("pickup")}
              className="accent-purple"
            />
            {t.pickUp}
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="fulfillment"
              value="delivery"
              checked={fulfillment === "delivery"}
              onChange={() => setFulfillment("delivery")}
              className="accent-purple"
            />
            {t.delivery}
          </label>
        </div>
      </div>

      {fulfillment !== "pickup" && (
        <Field
          label={t.eventLocation}
          name="event_location"
          type="text"
          hint={t.eventLocationHint}
        />
      )}
      <Field label={t.guestCount} name="guest_count" type="text" />

      <div className="flex flex-col gap-1">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">
          {t.selectedItems}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          {t.items.map((item) => (
            <label
              key={item}
              className="flex items-center gap-2 font-sans text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                name="items"
                value={item}
                className="accent-purple"
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      <Textarea label={t.styleNotes} name="style_notes" rows={3} />
      <Textarea label={t.additionalInfo} name="additional" rows={3} />

      <div className="flex flex-col gap-1">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">
          {t.images}
        </label>
        <input
          type="file"
          name="images"
          multiple
          accept="image/*"
          className="font-sans text-sm file:mr-4 file:py-2 file:px-4 file:border-2 file:border-foreground file:bg-transparent file:font-sans file:font-semibold file:text-xs file:uppercase file:tracking-widest cursor-pointer"
        />
        <p className="font-sans text-xs text-foreground/40 mt-1">
          {t.imagesNote}
        </p>
      </div>

      {error && (
        <p className="font-sans text-sm text-red-600 border-2 border-red-200 bg-red-50 px-4 py-3">
          {error}
        </p>
      )}

      <label className="flex items-center gap-3 font-sans text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={subscribeToNews}
          onChange={(e) => setSubscribeToNews(e.target.checked)}
          className="accent-purple"
        />
        {t.subscribeLabel}
      </label>

      <TurnstileWidget onToken={onTurnstileToken} />

      <button
        type="submit"
        disabled={submitting}
        className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-orange-500 hover:border-[#E6E6FA] hover:text-[#E6E6FA] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Sending…" : t.submit}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  hint,
  required,
}: {
  label: string;
  name: string;
  type: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={name}
        className="font-sans text-xs uppercase tracking-widest font-semibold"
      >
        {label}
        {required && " *"}
      </label>
      {hint && (
        <p className="font-sans text-xs text-foreground/50 -mt-0.5">{hint}</p>
      )}
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple"
      />
    </div>
  );
}

function Textarea({
  label,
  name,
  rows,
}: {
  label: string;
  name: string;
  rows: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-sans text-xs uppercase tracking-widest font-semibold">
        {label}
      </label>
      <textarea
        name={name}
        rows={rows}
        className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple resize-none"
      />
    </div>
  );
}
