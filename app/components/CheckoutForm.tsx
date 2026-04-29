"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TurnstileWidget } from "@/app/components/TurnstileWidget";
import { PickupScheduler } from "@/app/components/PickupScheduler";
import type { PickupSlotSerialized } from "@/app/lib/appointments";
import { isMontrealAddress } from "@/app/lib/validate";
import type { Dictionary } from "@/lib/translations/en";

interface SquarePaymentMethod {
  attach(selector: string): Promise<void>;
  tokenize(): Promise<{
    status: string;
    token?: string;
    errors?: Array<{ message: string }>;
  }>;
  destroy(): void;
}

declare global {
  interface Window {
    Square?: {
      payments(
        appId: string,
        locationId: string,
      ): Promise<{
        card(): Promise<SquarePaymentMethod>;
        giftCard(): Promise<SquarePaymentMethod>;
      }>;
    };
  }
}

type Props = {
  applicationId: string;
  locationId: string;
  sdkUrl: string;
  total: number;
  subscribeLabel: string;
  locale: string;
  formT: Dictionary["checkout"]["form"];
  schedulerT: Dictionary["checkout"]["scheduler"];
  pickupLocation: string | null;
  needsPickup: boolean;
  hasDelivery: boolean;
};

export function CheckoutForm({
  applicationId,
  locationId,
  sdkUrl,
  total,
  subscribeLabel,
  locale,
  formT,
  schedulerT,
  pickupLocation,
  needsPickup,
  hasDelivery,
}: Props) {
  const router = useRouter();
  const cardRef = useRef<SquarePaymentMethod | null>(null);
  const giftCardRef = useRef<SquarePaymentMethod | null>(null);
  const paymentsRef = useRef<{
    card(): Promise<SquarePaymentMethod>;
    giftCard(): Promise<SquarePaymentMethod>;
  } | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribeToNews, setSubscribeToNews] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<PickupSlotSerialized | null>(
    null,
  );
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryAddressError, setDeliveryAddressError] = useState<
    string | null
  >(null);

  // Gift card state
  const [giftCardInput, setGiftCardInput] = useState("");
  const [giftCard, setGiftCard] = useState<{
    gan: string;
    balance: number;
  } | null>(null);
  const [giftCardError, setGiftCardError] = useState<string | null>(null);
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [giftCardReady, setGiftCardReady] = useState(false);

  // Discount code state
  const [discountInput, setDiscountInput] = useState("");
  const [discount, setDiscount] = useState<{
    id: string;
    code: string;
    label: string;
    discountType: string;
    percentage?: string;
    amountCents?: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);

  const discountSavings = discount
    ? discount.discountType === "FIXED_PERCENTAGE"
      ? total * (parseFloat(discount.percentage!) / 100)
      : (discount.amountCents ?? 0) / 100
    : 0;
  const discountedTotal = Math.max(0, total - discountSavings);
  const giftCardSavings = giftCard ? Math.min(giftCard.balance, discountedTotal) : 0;
  const displayTotal = Math.max(0, discountedTotal - giftCardSavings);

  const onTurnstileToken = useCallback((t: string) => setTurnstileToken(t), []);
  const sdkError = formT.sdkError;

  // Mount/unmount credit card element when sdkReady
  useEffect(() => {
    let cancelled = false;
    const script = document.createElement("script");
    script.src = sdkUrl;
    script.async = true;
    script.onload = async () => {
      if (cancelled) return;
      try {
        const payments = await window.Square!.payments(
          applicationId,
          locationId,
        );
        if (cancelled) return;
        paymentsRef.current = payments;
        const card = await payments.card();
        if (cancelled) return;
        await card.attach("#card-container");
        if (cancelled) {
          card.destroy();
          return;
        }
        cardRef.current = card;
        setSdkReady(true);
      } catch {
        if (!cancelled) setError(sdkError);
      }
    };
    script.onerror = () => {
      if (!cancelled) setError(sdkError);
    };
    document.head.appendChild(script);
    return () => {
      cancelled = true;
      cardRef.current?.destroy();
      cardRef.current = null;
      giftCardRef.current?.destroy();
      giftCardRef.current = null;
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, [applicationId, locationId, sdkUrl, sdkError]);

  // Mount/unmount gift card SDK element once balance has been verified
  useEffect(() => {
    if (!giftCard || !paymentsRef.current) return;
    let cancelled = false;
    setGiftCardReady(false);
    (async () => {
      try {
        const gc = await paymentsRef.current!.giftCard();
        if (cancelled) {
          gc.destroy();
          return;
        }
        await gc.attach("#gift-card-container");
        if (cancelled) {
          gc.destroy();
          return;
        }
        giftCardRef.current = gc;
        setGiftCardReady(true);
      } catch {
        // ignore — gift card field unavailable
      }
    })();
    return () => {
      cancelled = true;
      giftCardRef.current?.destroy();
      giftCardRef.current = null;
      setGiftCardReady(false);
    };
  }, [giftCard]);

  async function applyGiftCard() {
    if (!giftCardInput.trim()) return;
    setGiftCardError(null);
    setGiftCardLoading(true);
    try {
      const res = await fetch("/api/checkout/validate-gift-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gan: giftCardInput.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setGiftCard({ gan: giftCardInput.trim(), balance: data.balance });
        setGiftCardInput("");
      } else {
        setGiftCardError(data.error ?? formT.giftCardError);
      }
    } catch {
      setGiftCardError(formT.giftCardError);
    } finally {
      setGiftCardLoading(false);
    }
  }

  async function applyDiscount() {
    if (!discountInput.trim()) return;
    setDiscountError(null);
    setDiscountLoading(true);
    try {
      const res = await fetch("/api/checkout/validate-discount-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountInput.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscount({
          id: data.discountId,
          code: discountInput.trim().toUpperCase(),
          label: data.label,
          discountType: data.discountType,
          percentage: data.percentage,
          amountCents: data.amountCents,
        });
        setDiscountInput("");
      } else {
        setDiscountError(data.error ?? formT.discountError);
      }
    } catch {
      setDiscountError(formT.discountError);
    } finally {
      setDiscountLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (needsPickup && !selectedSlot) {
      setError(schedulerT.noSlotError);
      return;
    }

    if (hasDelivery) {
      if (!deliveryAddress.trim()) {
        setDeliveryAddressError(formT.deliveryAddressRequired);
        return;
      }
      if (!isMontrealAddress(deliveryAddress)) {
        setDeliveryAddressError(formT.deliveryAddressInvalid);
        return;
      }
    }

    if (!cardRef.current) return;

    setError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;

    // Tokenize credit card
    const tokenResult = await cardRef.current.tokenize();
    if (tokenResult.status !== "OK") {
      setError(tokenResult.errors?.[0]?.message ?? formT.tokenizeError);
      setSubmitting(false);
      return;
    }
    const token = tokenResult.token!;

    // Tokenize gift card if balance was verified
    let giftCardToken: string | undefined;
    if (giftCard && giftCardRef.current) {
      const gcResult = await giftCardRef.current.tokenize();
      if (gcResult.status !== "OK") {
        setError(gcResult.errors?.[0]?.message ?? formT.tokenizeError);
        setSubmitting(false);
        return;
      }
      giftCardToken = gcResult.token;
    }

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        name,
        email,
        phone,
        subscribe_to_news: subscribeToNews,
        turnstile: turnstileToken,
        ...(needsPickup && selectedSlot
          ? {
              pickupStartAt: selectedSlot.startAt,
              pickupSegments: [selectedSlot],
            }
          : {}),
        ...(hasDelivery ? { deliveryAddress } : {}),
        ...(giftCardToken ? { giftCardToken } : {}),
        ...(discount ? { discountCode: discount.code } : {}),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? formT.paymentError);
      setSubmitting(false);
      return;
    }

    router.push(`/order-confirmation?orderId=${data.orderId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
        <Field label={formT.nameLabel} name="name" type="text" required />
        <Field label={formT.emailLabel} name="email" type="email" required />
        <Field label={formT.phoneLabel} name="phone" type="tel" required />
      </div>

      {hasDelivery && (
        <div className="flex flex-col gap-1">
          <label
            htmlFor="deliveryAddress"
            className="font-sans text-xs uppercase tracking-widest font-semibold"
          >
            {formT.deliveryAddressLabel} *
          </label>
          <textarea
            id="deliveryAddress"
            value={deliveryAddress}
            onChange={(e) => {
              setDeliveryAddress(e.target.value);
              setDeliveryAddressError(null);
            }}
            placeholder={formT.deliveryAddressPlaceholder}
            rows={3}
            className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple resize-none"
          />
          {deliveryAddressError && (
            <p className="font-sans text-xs text-red-600">
              {formT.deliveryAddressError}
            </p>
          )}
        </div>
      )}

      {needsPickup && (
        <PickupScheduler
          onSlotSelect={setSelectedSlot}
          selectedSlot={selectedSlot}
          locale={locale}
          t={schedulerT}
          pickupLocation={pickupLocation}
        />
      )}

      {/* Gift card */}
      <div className="flex flex-col gap-2">
        <label htmlFor="gift-card-gan" className="font-sans text-xs uppercase tracking-widest font-semibold">
          {formT.giftCardLabel}
        </label>
        {!giftCard ? (
          <>
            <div className="flex gap-2">
              <input
                id="gift-card-gan"
                type="text"
                value={giftCardInput}
                onChange={(e) => {
                  setGiftCardInput(e.target.value);
                  setGiftCardError(null);
                }}
                placeholder={formT.giftCardPlaceholder}
                className="flex-1 border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple"
              />
              <button
                type="button"
                onClick={applyGiftCard}
                disabled={giftCardLoading || !giftCardInput.trim()}
                className="font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground px-5 py-3 hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {formT.giftCardApply}
              </button>
            </div>
            {giftCardError && (
              <p className="font-sans text-sm text-red-600">
                {formT.giftCardError}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between border-2 border-foreground/20 px-4 py-3 font-sans text-sm">
              <span>
                <span className="font-semibold">{formT.giftCardApplied}</span>
                {" (…"}
                {giftCard.gan.slice(-4)}
                {")"}
                {" — "}
                {formT.giftCardBalance}: ${giftCard.balance.toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => setGiftCard(null)}
                className="font-sans text-xs uppercase tracking-widest font-semibold underline"
              >
                {formT.giftCardRemove}
              </button>
            </div>
            <label className="font-sans text-xs uppercase tracking-widest font-semibold mt-1">
              {formT.giftCardConfirmLabel}
            </label>
            <div
              id="gift-card-container"
              className="bg-transparent px-1 py-1 min-h-[56px]"
            />
            {!giftCardReady && (
              <p className="font-sans text-xs text-foreground/40">
                {formT.loadingPayment}
              </p>
            )}
          </>
        )}
      </div>

      {/* Discount code */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="discount-code"
          className="font-sans text-xs uppercase tracking-widest font-semibold"
        >
          {formT.discountLabel}
        </label>
        {!discount ? (
          <>
            <div className="flex gap-2">
              <input
                id="discount-code"
                type="text"
                value={discountInput}
                onChange={(e) => {
                  setDiscountInput(e.target.value);
                  setDiscountError(null);
                }}
                placeholder={formT.discountPlaceholder}
                className="flex-1 border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple"
              />
              <button
                type="button"
                onClick={applyDiscount}
                disabled={discountLoading || !discountInput.trim()}
                className="font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground px-5 py-3 hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {formT.discountApply}
              </button>
            </div>
            {discountError && (
              <p className="font-sans text-sm text-red-600">{discountError}</p>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between border-2 border-foreground/20 px-4 py-3 font-sans text-sm">
            <span>
              <span className="font-semibold">{formT.discountApplied}</span>
              {" ("}
              {discount.code}
              {") — "}
              {discount.discountType === "FIXED_PERCENTAGE"
                ? `${discount.percentage}% off`
                : `−$${((discount.amountCents ?? 0) / 100).toFixed(2)}`}
            </span>
            <button
              type="button"
              onClick={() => setDiscount(null)}
              className="font-sans text-xs uppercase tracking-widest font-semibold underline"
            >
              {formT.discountRemove}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-sans text-xs uppercase tracking-widest font-semibold">
          {formT.cardDetails}
        </p>
        <div
          id="card-container"
          className="bg-transparent px-1 py-1 min-h-[56px]"
        />
        {!sdkReady && !error && (
          <p className="font-sans text-xs text-foreground/40">
            {formT.loadingPayment}
          </p>
        )}
      </div>

      {error && (
        <p className="font-sans text-sm text-red-600 border-2 border-red-200 bg-red-50 px-4 py-3">
          {error}
        </p>
      )}

      <div className="border-t-2 border-foreground/10 pt-5 flex flex-col gap-1">
        {discount && (
          <div className="flex justify-between font-sans text-sm text-foreground/60">
            <span>
              {formT.discountApplied} ({discount.code})
            </span>
            <span>−${discountSavings.toFixed(2)}</span>
          </div>
        )}
        {giftCard && (
          <div className="flex justify-between font-sans text-sm text-foreground/60">
            <span>
              {formT.giftCardApplied} (…{giftCard.gan.slice(-4)})
            </span>
            <span>−${giftCardSavings.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center font-display font-black text-lg">
          <span>{formT.total}</span>
          <span>${displayTotal.toFixed(2)} CAD</span>
        </div>
      </div>

      <label className="flex items-center gap-3 font-sans text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={subscribeToNews}
          onChange={(e) => setSubscribeToNews(e.target.checked)}
          className="accent-purple"
        />
        {subscribeLabel}
      </label>

      <TurnstileWidget onToken={onTurnstileToken} />

      <button
        type="submit"
        disabled={!sdkReady || submitting || (needsPickup && !selectedSlot)}
        className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-orange-500 hover:border-[#E6E6FA] hover:text-[#E6E6FA] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting
          ? formT.processing
          : `${formT.pay} $${displayTotal.toFixed(2)}`}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  required,
}: {
  label: string;
  name: string;
  type: string;
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
