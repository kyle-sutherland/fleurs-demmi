"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/translations/en";
import SaturdayMultiSelect from "@/app/components/SaturdayMultiSelect";

type Props = {
  variationId: string;
  tierLabel: string;
  tierPrice: number;
  tierBouquets: number;
  subscribeBtn: string;
  deliveryLabel: string;
  pickUpOption: string;
  pickUpOption2: string;
  deliveryOption: string;
  stockCount?: number | null;
  /** When provided, shows a Saturday picker whose selection is added to the cart options. */
  saturdayOptions?: string[];
  saturdayLabel?: string;
  labels: Dictionary["addToCart"];
  locale: string;
};

export function BouquetSubscribeButton({
  variationId,
  tierLabel,
  tierPrice,
  tierBouquets,
  subscribeBtn,
  deliveryLabel,
  pickUpOption,
  pickUpOption2,
  deliveryOption,
  stockCount,
  saturdayOptions,
  saturdayLabel,
  labels,
  locale,
}: Props) {
  const router = useRouter();
  const [delivery, setDelivery] = useState("pickup1");
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");
  const [saturdays, setSaturdays] = useState<string[]>([]);

  const soldOut = stockCount === 0;

  const quantity = saturdayOptions ? saturdays.length || 1 : tierBouquets;

  const isDelivery = delivery === "delivery";
  const total = isDelivery ? tierPrice + 10 * quantity : tierPrice;

  async function handleClick() {
    setState("adding");

    const subscriptionItem = {
      productId: variationId,
      name: tierLabel,
      price: tierPrice,
      quantity,
      options: {
        pickup:
          delivery === "pickup1" ? pickUpOption
          : delivery === "pickup2" ? pickUpOption2
          : "Delivery",
        ...(saturdays.length > 0 ? { saturdays: saturdays.join(", ") } : {}),
      },
    };

    const body =
      isDelivery ?
        {
          items: [
            subscriptionItem,
            {
              productId: `delivery-surcharge:${variationId}`,
              name: "Home Delivery",
              price: 10,
              quantity,
              options: { for: tierLabel },
            },
          ],
        }
      : subscriptionItem;

    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setState("added");
    router.refresh();
    window.dispatchEvent(new Event("cart-updated"));
    setTimeout(() => setState("idle"), 1500);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">
          {deliveryLabel}
        </label>
        <div className="relative">
          <select
            value={delivery}
            onChange={(e) => setDelivery(e.target.value)}
            disabled={soldOut}
            className="w-full border-2 border-foreground bg-background font-sans text-sm px-4 py-3 pr-10 focus:outline-none focus:border-[#ff5129] appearance-none text-foreground disabled:opacity-50"
          >
            <option value="pickup1">{pickUpOption}</option>
            <option value="pickup2">{pickUpOption2}</option>
            <option value="delivery">{deliveryOption}</option>
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-foreground">
            &#8964;
          </span>
        </div>
      </div>

      {saturdayOptions && saturdayOptions.length > 0 && (
        <SaturdayMultiSelect
          dates={saturdayOptions}
          label={saturdayLabel ?? "Select your delivery Saturdays"}
          onSelectionChange={setSaturdays}
          locale={locale}
        />
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={soldOut || state === "adding"}
        className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-4 py-2 hover:bg-[#ff5129] hover:border-[#E6E6FA] hover:text-[#E6E6FA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {soldOut ?
          labels.soldOut
        : state === "adding" ?
          labels.adding
        : state === "added" ?
          labels.added
        : `${subscribeBtn}${total}.00`}
      </button>
    </div>
  );
}
