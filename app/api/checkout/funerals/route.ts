import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { SquareError } from "square";
import type { OrderLineItem } from "square";
import { getSquareClient, LOCATION_ID } from "@/app/lib/square";
import { getCatalogItemsByCategory } from "@/app/lib/catalog";
import { getInventoryByVariationId } from "@/app/lib/inventory";
import { getPickupLocation } from "@/app/lib/appointments";
import { sendMail, sanitizeSubject, extractBalanceCents } from "@/app/lib/email";
import {
  escapeHtml,
  emailSchema,
  nameSchema,
  phoneSchema,
  dateSchema,
  textSchema,
} from "@/app/lib/validate";
import { verifyTurnstile } from "@/app/lib/turnstile";
import { enforceRateLimit } from "@/app/lib/rateLimit";
import { appendToCustomerList } from "@/app/lib/sheets";

const SYMPATHY_CATEGORY = "Sympathy";
const CARD_CATEGORY = "Cards & Goodies";
const CARD_ITEM_NAME = "Candy Flowers Card (blank inside)";
const CARD_ADDON_PRICE = 4;

const bodySchema = z.object({
  token: z.string().min(1).max(512),
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  funeral_date: dateSchema,
  funeral_location: textSchema.optional(),
  fulfillment: z.union([z.string(), z.array(z.string())]).optional(),
  variationId: z.string().min(1).max(64),
  arrangementName: z.string().min(1).max(255),
  style_notes: textSchema.optional(),
  card_name: textSchema.optional(),
  card_message: textSchema.optional(),
  turnstile: z.string().optional(),
  website: z.string().max(0, "Honeypot").optional(),
  giftCardToken: z.string().min(1).max(512).optional(),
});

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const rateLimited = await enforceRateLimit(request, "checkout");
  if (rateLimited) return rateLimited;

  if (body.website) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
  if (!(await verifyTurnstile(body.turnstile, ip))) {
    return NextResponse.json(
      { error: "Bot verification failed. Please try again." },
      { status: 403 },
    );
  }

  const {
    token,
    name,
    email,
    phone,
    funeral_date,
    funeral_location,
    fulfillment,
    variationId,
    arrangementName,
    style_notes,
    card_name,
    card_message,
    giftCardToken,
  } = body;

  const sympathyItems = await getCatalogItemsByCategory(
    SYMPATHY_CATEGORY,
    "en",
  );
  const validVariation = sympathyItems
    .flatMap((item) => item.variations)
    .find((v) => v.variationId === variationId);
  if (!validVariation) {
    return NextResponse.json(
      { error: "Invalid arrangement selection." },
      { status: 400 },
    );
  }

  // Live stock check
  const inventoryCounts = await getInventoryByVariationId([variationId]);
  const stockCount = inventoryCounts[variationId];
  if (stockCount !== null && stockCount < 1) {
    return NextResponse.json(
      { error: "This arrangement is no longer available. Please contact us directly." },
      { status: 409 },
    );
  }

  const arrangementPrice = Number(validVariation.priceMoney) / 100;
  const hasCard = !!(card_name || card_message);

  const cardItems = hasCard
    ? await getCatalogItemsByCategory(CARD_CATEGORY, "en")
    : [];
  const cardItem =
    cardItems.find((i) => i.name === CARD_ITEM_NAME) ?? cardItems[0];
  const cardVariation = cardItem?.variations[0];
  const cardVariationId = cardVariation?.variationId;
  const cardPrice = cardVariation
    ? Number(cardVariation.priceMoney) / 100
    : CARD_ADDON_PRICE;

  const total = arrangementPrice + (hasCard ? cardPrice : 0);

  const lineItems: OrderLineItem[] = [
    {
      quantity: "1",
      catalogObjectId: variationId,
      ...(style_notes ? { note: style_notes } : {}),
    },
  ];

  if (hasCard) {
    if (cardVariationId) {
      lineItems.push({
        quantity: "1",
        catalogObjectId: cardVariationId,
        ...(card_name || card_message
          ? {
              note: [card_name && `To: ${card_name}`, card_message]
                .filter(Boolean)
                .join(" — "),
            }
          : {}),
      });
    } else {
      lineItems.push({
        quantity: "1",
        name: "Greeting Card",
        basePriceMoney: {
          amount: BigInt(CARD_ADDON_PRICE * 100),
          currency: "CAD" as const,
        },
        ...(card_name || card_message
          ? {
              note: [card_name && `To: ${card_name}`, card_message]
                .filter(Boolean)
                .join(" — "),
            }
          : {}),
      });
    }
  }

  const client = getSquareClient();

  try {
    const orderResponse = await client.orders.create({
      order: { locationId: LOCATION_ID, lineItems },
      idempotencyKey: randomUUID(),
    });

    const order = orderResponse.order;
    if (!order?.id) {
      return NextResponse.json(
        { error: "Failed to create order." },
        { status: 500 },
      );
    }

    const orderTotalCents = Number(order.totalMoney?.amount ?? 0);

    if (!orderTotalCents) {
      console.error(`Square order had no totalMoney — orderId=${order.id}`);
      return NextResponse.json(
        { error: "Failed to create order." },
        { status: 500 },
      );
    }
    let payment: { id?: string; receiptUrl?: string } | null = null;
    let giftCardAmountCents = 0;

    if (giftCardToken) {
      let gcPaymentId: string | null = null;
      try {
        const gcPaymentRes = await client.payments.create({
          sourceId: giftCardToken,
          idempotencyKey: randomUUID(),
          amountMoney: { amount: BigInt(orderTotalCents), currency: "CAD" },
          orderId: order.id,
          locationId: LOCATION_ID,
          buyerEmailAddress: email,
        });
        if (gcPaymentRes.payment?.id) {
          giftCardAmountCents = orderTotalCents;
          payment = gcPaymentRes.payment;
        }
      } catch (gcErr) {
        if (gcErr instanceof SquareError) {
          const insufficientErr = gcErr.errors?.find(
            (e) =>
              e.code === "INSUFFICIENT_FUNDS" ||
              e.code === "GIFT_CARD_BALANCE_INSUFFICIENT",
          );
          const availableCents = insufficientErr ? extractBalanceCents(gcErr) : 0;

          if (availableCents > 0) {
            const gcSplitRes = await client.payments.create({
              sourceId: giftCardToken,
              idempotencyKey: randomUUID(),
              amountMoney: { amount: BigInt(availableCents), currency: "CAD" },
              orderId: order.id,
              locationId: LOCATION_ID,
              buyerEmailAddress: email,
            });
            if (!gcSplitRes.payment?.id) {
              return NextResponse.json(
                { error: "Gift card payment failed. Please try again." },
                { status: 402 },
              );
            }
            gcPaymentId = gcSplitRes.payment.id;
            giftCardAmountCents = availableCents;

            const remainderCents = orderTotalCents - availableCents;
            const cardPaymentRes = await client.payments.create({
              sourceId: token,
              idempotencyKey: randomUUID(),
              amountMoney: { amount: BigInt(remainderCents), currency: "CAD" },
              orderId: order.id,
              locationId: LOCATION_ID,
              buyerEmailAddress: email,
            });
            if (!cardPaymentRes.payment?.id) {
              try {
                await client.refunds.refundPayment({
                  paymentId: gcPaymentId,
                  idempotencyKey: randomUUID(),
                  amountMoney: {
                    amount: BigInt(availableCents),
                    currency: "CAD",
                  },
                  reason: "Card payment failed — split payment rollback",
                });
              } catch (refundErr) {
                console.error(
                  "Gift card refund failed after card payment error:",
                  refundErr,
                );
              }
              return NextResponse.json(
                { error: "Card payment failed. Please try again." },
                { status: 402 },
              );
            }
            payment = cardPaymentRes.payment;
          }
        }
      }
    }

    if (!payment) {
      const paymentResponse = await client.payments.create({
        sourceId: token,
        idempotencyKey: randomUUID(),
        amountMoney: { amount: BigInt(orderTotalCents), currency: "CAD" },
        orderId: order.id,
        locationId: LOCATION_ID,
        buyerEmailAddress: email,
      });
      payment = paymentResponse.payment ?? null;
    }

    if (!payment?.id) {
      return NextResponse.json(
        { error: "Payment failed. Please try again." },
        { status: 402 },
      );
    }

    // Escaped values for email
    const sName = escapeHtml(name);
    const sEmail = escapeHtml(email);
    const sPhone = escapeHtml(phone);
    const sDate = escapeHtml(funeral_date);
    const sLoc = funeral_location ? escapeHtml(funeral_location) : "";
    const sNotes = style_notes ? escapeHtml(style_notes) : "";
    const sCardName = card_name ? escapeHtml(card_name) : "";
    const sCardMsg = card_message ? escapeHtml(card_message) : "";
    const fulfillmentRaw = Array.isArray(fulfillment)
      ? fulfillment
      : fulfillment
        ? [fulfillment]
        : [];
    const fulfillmentList = fulfillmentRaw.map(escapeHtml);
    const isPickup = fulfillmentRaw.some((f) =>
      f.toLowerCase().includes("pickup"),
    );

    const pickupLocationResult = isPickup
      ? await getPickupLocation().catch(() => null)
      : null;
    const safePickupLocation = pickupLocationResult
      ? escapeHtml(pickupLocationResult)
      : "";
    const receiptUrl = payment.receiptUrl ?? null;

    const gcDisplay =
      giftCardAmountCents > 0
        ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;color:#888">Gift Card</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;color:#888">−$${(giftCardAmountCents / 100).toFixed(2)}</td></tr>`
        : "";

    const ownerHtml = `
      <h2 style="font-family:sans-serif">New Sympathy Order — ${sName}</h2>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sName}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><a href="mailto:${sEmail}">${sEmail}</a></td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Phone</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sPhone}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Funeral Date</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sDate}</td></tr>
        ${sLoc ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Location</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sLoc}</td></tr>` : ""}
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${fulfillmentList.join(", ") || "—"}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Arrangement</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(arrangementName)} — $${arrangementPrice.toFixed(2)}</td></tr>
        ${hasCard ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Card</td><td style="padding:6px 12px;border-bottom:1px solid #eee">To: ${sCardName || "—"}<br/>${sCardMsg}</td></tr>` : ""}
        ${sNotes ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Style Notes</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sNotes}</td></tr>` : ""}
        ${gcDisplay}
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Total Paid</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:700">$${total.toFixed(2)} CAD</td></tr>
        <tr><td style="padding:6px 12px;font-weight:600">Square Order ID</td><td style="padding:6px 12px">${order.id}</td></tr>
      </table>
    `;

    const customerHtml = `
      <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a;padding-bottom:32px;border-bottom:2px solid #eee;margin-bottom:32px">
        <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Commande confirm&#233;e</h1>
        <p style="font-size:15px;line-height:1.6;color:#444">
          Merci, ${sName}. Votre commande a &#233;t&#233; re&#231;ue et votre paiement est confirm&#233;. Emmi vous contactera sous peu pour les d&#233;tails de la cueillette ou de la livraison.
        </p>
        <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">R&#233;sum&#233; de la commande</h2>
        <table style="font-size:14px;border-collapse:collapse;width:100%">
          <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(arrangementName)}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${arrangementPrice.toFixed(2)}</td></tr>
          ${hasCard ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Carte de voeux</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${cardPrice.toFixed(2)}</td></tr>` : ""}
          ${gcDisplay}
          <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${total.toFixed(2)} CAD</td></tr>
        </table>
        <table style="font-size:14px;border-collapse:collapse;width:100%;margin-top:24px">
          <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Date des fun&#233;railles</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sDate}</td></tr>
          <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Mode de r&#233;ception</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${fulfillmentList.join(", ") || "&#8212;"}</td></tr>
          ${safePickupLocation ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Lieu de cueillette</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${safePickupLocation}</td></tr>` : ""}
          ${sLoc ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Lieu</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sLoc}</td></tr>` : ""}
        </table>
        ${receiptUrl ? `<p style="margin-top:24px"><a href="${escapeHtml(receiptUrl)}" style="display:inline-block;padding:10px 20px;background:#1a1a1a;color:#fff;text-decoration:none;font-size:13px;font-weight:600">Voir le re&#231;u</a></p>` : ""}
        <p style="font-size:12px;color:#aaa;margin-top:32px">R&#233;f&#233;rence&nbsp;: ${order.id}</p>
        <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
      </div>
      <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
        <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Order confirmed</h1>
        <p style="font-size:15px;line-height:1.6;color:#444">
          Thank you, ${sName}. Your order has been received and your payment is confirmed. Emmi will be in touch soon with pickup or delivery details.
        </p>
        <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Order Summary</h2>
        <table style="font-size:14px;border-collapse:collapse;width:100%">
          <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(arrangementName)}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${arrangementPrice.toFixed(2)}</td></tr>
          ${hasCard ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Greeting Card</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${cardPrice.toFixed(2)}</td></tr>` : ""}
          ${gcDisplay}
          <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${total.toFixed(2)} CAD</td></tr>
        </table>
        <table style="font-size:14px;border-collapse:collapse;width:100%;margin-top:24px">
          <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Funeral Date</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sDate}</td></tr>
          <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${fulfillmentList.join(", ") || "&#8212;"}</td></tr>
          ${safePickupLocation ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Pickup Location</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${safePickupLocation}</td></tr>` : ""}
          ${sLoc ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Location</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sLoc}</td></tr>` : ""}
        </table>
        ${receiptUrl ? `<p style="margin-top:24px"><a href="${escapeHtml(receiptUrl)}" style="display:inline-block;padding:10px 20px;background:#1a1a1a;color:#fff;text-decoration:none;font-size:13px;font-weight:600">View Square receipt</a></p>` : ""}
        <p style="font-size:12px;color:#aaa;margin-top:32px">Order ref: ${order.id}</p>
        <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
      </div>
    `;

    try {
      await Promise.all([
        sendMail({
          to: process.env.RECIPIENT_EMAIL!,
          subject: `New sympathy order — ${sanitizeSubject(name)}`,
          html: ownerHtml,
        }),
        sendMail({
          to: email,
          subject: `Your order is confirmed — Fleurs d'Emmi`,
          html: customerHtml,
        }),
        appendToCustomerList({ name, email, phone, source: "funerals", subscribed: 'unknown' }),
      ]);
    } catch (err) {
      console.error("Email error (funerals checkout):", err);
    }

    return NextResponse.json({ orderId: order.id, paymentId: payment.id });
  } catch (err: unknown) {
    if (err instanceof SquareError) {
      console.error("Square error (funerals checkout):", err.errors);
      return NextResponse.json(
        { error: "Payment failed. Please try again." },
        { status: 402 },
      );
    }
    console.error("Funerals checkout error:", err);
    return NextResponse.json(
      { error: "Payment failed. Please try again." },
      { status: 500 },
    );
  }
}
