import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z, ZodError } from 'zod'
import { SquareError } from 'square'
import type { OrderLineItem } from 'square'
import { getSquareClient, LOCATION_ID } from '@/app/lib/square'
import { getCatalogItemsByCategory } from '@/app/lib/catalog'
import { getInventoryByVariationId } from '@/app/lib/inventory'
import { getPickupLocation } from '@/app/lib/appointments'
import { sendMail, sanitizeSubject, extractBalanceCents } from '@/app/lib/email'
import { escapeHtml, emailSchema, nameSchema, phoneSchema, textSchema, montrealAddressSchema } from '@/app/lib/validate'
import { verifyTurnstile } from '@/app/lib/turnstile'
import { enforceRateLimit } from '@/app/lib/rateLimit'
import { appendToCustomerList } from '@/app/lib/sheets'

const MD_CATEGORY = "Mother's Day"
const CARD_CATEGORY = 'Cards & Goodies'
const CARD_ITEM_NAME = 'Candy Flowers Card (blank inside)'
const DELIVERY_PRICE = 10
const CARD_PRICE = 4

const bodySchema = z.object({
  token:           z.string().min(1).max(512),
  name:            nameSchema,
  email:           emailSchema,
  phone:           phoneSchema,
  fulfillment:     z.enum(['pickup', 'delivery']),
  address:         montrealAddressSchema.optional(),
  delivery_time:   textSchema.optional(),
  variationId:     z.string().min(1).max(64),  // Square variation ID for chosen arrangement
  arrangementName: z.string().min(1).max(255), // Display name for emails
  card_to:            textSchema.optional(),
  card_message:       textSchema.optional(),
  subscribe_to_news:  z.boolean().optional(),
  turnstile:          z.string().optional(),
  website:            z.string().max(0, 'Honeypot').optional(),
  giftCardToken: z.string().min(1).max(512).optional(),
})

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      const addressIssue = err.issues.find((i) => i.path.includes('address'))
      if (addressIssue) return NextResponse.json({ error: addressIssue.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const rateLimited = await enforceRateLimit(request, 'checkout')
  if (rateLimited) return rateLimited

  if (body.website) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
  if (!await verifyTurnstile(body.turnstile, ip)) {
    return NextResponse.json({ error: 'Bot verification failed. Please try again.' }, { status: 403 })
  }

  const { token, name, email, phone, fulfillment, address, delivery_time, variationId, arrangementName, card_to, card_message, subscribe_to_news, giftCardToken } = body

  const mdItems = await getCatalogItemsByCategory(MD_CATEGORY, 'en')
  const validVariation = mdItems
    .flatMap((item) => item.variations)
    .find((v) => v.variationId === variationId)
  if (!validVariation) {
    return NextResponse.json({ error: 'Invalid arrangement selection.' }, { status: 400 })
  }

  // Live stock check
  const inventoryCounts = await getInventoryByVariationId([variationId])
  const stockCount = inventoryCounts[variationId]
  if (stockCount !== null && stockCount < 1) {
    return NextResponse.json(
      { error: 'This arrangement is no longer available. Please contact us directly.' },
      { status: 409 },
    )
  }

  const arrangementPrice = Number(validVariation.priceMoney) / 100
  const isDelivery = fulfillment === 'delivery'
  const hasCard = !!(card_to || card_message)

  const cardItems = hasCard ? await getCatalogItemsByCategory(CARD_CATEGORY, 'en') : []
  const cardItem = cardItems.find((i) => i.name === CARD_ITEM_NAME) ?? cardItems[0]
  const cardVariation = cardItem?.variations[0]
  const cardVariationId = cardVariation?.variationId
  const cardPrice = cardVariation ? Number(cardVariation.priceMoney) / 100 : CARD_PRICE

  const total = arrangementPrice + (isDelivery ? DELIVERY_PRICE : 0) + (hasCard ? cardPrice : 0)

  const lineItems: OrderLineItem[] = [
    {
      quantity: '1',
      catalogObjectId: variationId,
    },
  ]

  if (isDelivery) {
    lineItems.push({
      quantity: '1',
      name: "Mother's Day Delivery — May 10th",
      basePriceMoney: { amount: BigInt(DELIVERY_PRICE * 100), currency: 'CAD' as const },
      ...(address ? { note: `${address}${delivery_time ? ` · ${delivery_time}` : ''}` } : {}),
    })
  }

  if (hasCard) {
    if (cardVariationId) {
      lineItems.push({
        quantity: '1',
        catalogObjectId: cardVariationId,
        ...(card_to || card_message
          ? { note: [card_to && `To: ${card_to}`, card_message].filter(Boolean).join(' — ') }
          : {}),
      })
    } else {
      lineItems.push({
        quantity: '1',
        name: 'Greeting Card',
        basePriceMoney: { amount: BigInt(CARD_PRICE * 100), currency: 'CAD' as const },
        ...(card_to || card_message
          ? { note: [card_to && `To: ${card_to}`, card_message].filter(Boolean).join(' — ') }
          : {}),
      })
    }
  }

  const client = getSquareClient()

  try {
    const orderResponse = await client.orders.create({
      order: { locationId: LOCATION_ID, lineItems },
      idempotencyKey: randomUUID(),
    })

    const order = orderResponse.order
    if (!order?.id) {
      return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 })
    }

    const orderTotalCents = Number(order.totalMoney?.amount ?? 0)

    if (!orderTotalCents) {
      console.error(`Square order had no totalMoney — orderId=${order.id}`)
      return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 })
    }
    let payment: { id?: string; receiptUrl?: string } | null = null
    let giftCardAmountCents = 0

    if (giftCardToken) {
      let gcPaymentId: string | null = null
      try {
        const gcPaymentRes = await client.payments.create({
          sourceId: giftCardToken,
          idempotencyKey: randomUUID(),
          amountMoney: { amount: BigInt(orderTotalCents), currency: 'CAD' },
          orderId: order.id,
          locationId: LOCATION_ID,
          buyerEmailAddress: email,
        })
        if (gcPaymentRes.payment?.id) {
          giftCardAmountCents = orderTotalCents
          payment = gcPaymentRes.payment
        }
      } catch (gcErr) {
        if (gcErr instanceof SquareError) {
          const insufficientErr = gcErr.errors?.find(
            (e) => e.code === 'INSUFFICIENT_FUNDS' || e.code === 'GIFT_CARD_BALANCE_INSUFFICIENT'
          )
          const availableCents = insufficientErr ? extractBalanceCents(gcErr) : 0

          if (availableCents > 0) {
            const gcSplitRes = await client.payments.create({
              sourceId: giftCardToken,
              idempotencyKey: randomUUID(),
              amountMoney: { amount: BigInt(availableCents), currency: 'CAD' },
              orderId: order.id,
              locationId: LOCATION_ID,
              buyerEmailAddress: email,
            })
            if (!gcSplitRes.payment?.id) {
              return NextResponse.json({ error: 'Gift card payment failed. Please try again.' }, { status: 402 })
            }
            gcPaymentId = gcSplitRes.payment.id
            giftCardAmountCents = availableCents

            const remainderCents = orderTotalCents - availableCents
            const cardPaymentRes = await client.payments.create({
              sourceId: token,
              idempotencyKey: randomUUID(),
              amountMoney: { amount: BigInt(remainderCents), currency: 'CAD' },
              orderId: order.id,
              locationId: LOCATION_ID,
              buyerEmailAddress: email,
            })
            if (!cardPaymentRes.payment?.id) {
              try {
                await client.refunds.refundPayment({
                  paymentId: gcPaymentId,
                  idempotencyKey: randomUUID(),
                  amountMoney: { amount: BigInt(availableCents), currency: 'CAD' },
                  reason: 'Card payment failed — split payment rollback',
                })
              } catch (refundErr) {
                console.error('Gift card refund failed after card payment error:', refundErr)
              }
              return NextResponse.json({ error: 'Card payment failed. Please try again.' }, { status: 402 })
            }
            payment = cardPaymentRes.payment
          }
        }
      }
    }

    if (!payment) {
      const paymentResponse = await client.payments.create({
        sourceId: token,
        idempotencyKey: randomUUID(),
        amountMoney: { amount: BigInt(orderTotalCents), currency: 'CAD' },
        orderId: order.id,
        locationId: LOCATION_ID,
        buyerEmailAddress: email,
      })
      payment = paymentResponse.payment ?? null
    }

    if (!payment?.id) {
      return NextResponse.json({ error: 'Payment failed. Please try again.' }, { status: 402 })
    }

    // Escaped values for email
    const sName         = escapeHtml(name)
    const sEmail        = escapeHtml(email)
    const sPhone        = escapeHtml(phone)
    const sAddress      = address ? escapeHtml(address) : ''
    const sDeliveryTime = delivery_time ? escapeHtml(delivery_time) : ''
    const sCardTo       = card_to ? escapeHtml(card_to) : ''
    const sCardMsg      = card_message ? escapeHtml(card_message) : ''

    // Pickup location (from Square custom attribute) — only shown for pickup fulfillment
    const pickupLocationResult = !isDelivery ? await getPickupLocation().catch(() => null) : null
    const safePickupLocation = escapeHtml(pickupLocationResult ?? 'Mile End')
    const receiptUrl = payment.receiptUrl ?? null

    const gcDisplay = giftCardAmountCents > 0
      ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;color:#888">Gift Card</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;color:#888">−$${(giftCardAmountCents / 100).toFixed(2)}</td></tr>`
      : ''

    const ownerHtml = `
      <h2 style="font-family:sans-serif">New Mother's Day Order — ${sName}</h2>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sName}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><a href="mailto:${sEmail}">${sEmail}</a></td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Phone</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sPhone}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${isDelivery ? 'Delivery — May 10th' : 'Pick up — May 9th, Mile End'}</td></tr>
        ${isDelivery && sAddress ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Address</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sAddress}${sDeliveryTime ? ` · ${sDeliveryTime}` : ''}</td></tr>` : ''}
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Arrangement</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(arrangementName)}</td></tr>
        ${hasCard ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Card</td><td style="padding:6px 12px;border-bottom:1px solid #eee">To: ${sCardTo || '—'}<br/>${sCardMsg}</td></tr>` : ''}
        ${gcDisplay}
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Total Paid</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:700">$${total.toFixed(2)} CAD</td></tr>
        <tr><td style="padding:6px 12px;font-weight:600">Square Order ID</td><td style="padding:6px 12px">${order.id}</td></tr>
      </table>
    `

    const customerHtml = `
      <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a;padding-bottom:32px;border-bottom:2px solid #eee;margin-bottom:32px">
        <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Commande confirm&#233;e</h1>
        <p style="font-size:15px;line-height:1.6;color:#444">
          Merci, ${sName}&nbsp;! Votre commande f&#234;te des M&#232;res est confirm&#233;e. Emmi l&#39;aura pr&#234;te pour vous.
        </p>
        <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">R&#233;sum&#233; de la commande</h2>
        <table style="font-size:14px;border-collapse:collapse;width:100%">
          <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(arrangementName)}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${arrangementPrice.toFixed(2)}</td></tr>
          ${isDelivery ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Livraison &#8212; 10 mai</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${DELIVERY_PRICE.toFixed(2)}</td></tr>` : ''}
          ${hasCard ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Carte de voeux</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${cardPrice.toFixed(2)}</td></tr>` : ''}
          ${gcDisplay}
          <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${total.toFixed(2)} CAD</td></tr>
        </table>
        <table style="font-size:14px;border-collapse:collapse;width:100%;margin-top:24px">
          <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Mode de r&#233;ception</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${isDelivery ? `Livraison &#8212; 10 mai${sAddress ? `, ${sAddress}` : ''}` : `Cueillette &#8212; 9 mai, 10h&#8211;17h, ${safePickupLocation}`}</td></tr>
        </table>
        ${receiptUrl ? `<p style="margin-top:24px"><a href="${escapeHtml(receiptUrl)}" style="display:inline-block;padding:10px 20px;background:#1a1a1a;color:#fff;text-decoration:none;font-size:13px;font-weight:600">Voir le re&#231;u Square</a></p>` : ''}
        <p style="font-size:12px;color:#aaa;margin-top:32px">R&#233;f&#233;rence&nbsp;: ${order.id}</p>
        <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
      </div>
      <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
        <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Order confirmed</h1>
        <p style="font-size:15px;line-height:1.6;color:#444">
          Thank you, ${sName}! Your Mother&#39;s Day order is confirmed. Emmi will have it ready for you.
        </p>
        <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Order Summary</h2>
        <table style="font-size:14px;border-collapse:collapse;width:100%">
          <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(arrangementName)}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${arrangementPrice.toFixed(2)}</td></tr>
          ${isDelivery ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Delivery &#8212; May 10th</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${DELIVERY_PRICE.toFixed(2)}</td></tr>` : ''}
          ${hasCard ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Greeting Card</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${cardPrice.toFixed(2)}</td></tr>` : ''}
          ${gcDisplay}
          <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${total.toFixed(2)} CAD</td></tr>
        </table>
        <table style="font-size:14px;border-collapse:collapse;width:100%;margin-top:24px">
          <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${isDelivery ? `Delivery &#8212; May 10th${sAddress ? `, ${sAddress}` : ''}` : `Pick up &#8212; May 9th, 10am&#8211;5pm, ${safePickupLocation}`}</td></tr>
        </table>
        ${receiptUrl ? `<p style="margin-top:24px"><a href="${escapeHtml(receiptUrl)}" style="display:inline-block;padding:10px 20px;background:#1a1a1a;color:#fff;text-decoration:none;font-size:13px;font-weight:600">View Square receipt</a></p>` : ''}
        <p style="font-size:12px;color:#aaa;margin-top:32px">Order ref: ${order.id}</p>
        <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
      </div>
    `

    try {
      await Promise.all([
        sendMail({ to: process.env.RECIPIENT_EMAIL!, subject: `New Mother's Day order — ${sanitizeSubject(name)}`, html: ownerHtml }),
        sendMail({ to: email, subject: `Your order is confirmed — Fleurs d'Emmi`, html: customerHtml }),
        appendToCustomerList({ name, email, phone, source: 'mothers-day', subscribed: subscribe_to_news ? 'subscribed' : 'unknown' }),
      ])
    } catch (err) {
      console.error("Email error (Mother's Day checkout):", err)
    }

    return NextResponse.json({ orderId: order.id, paymentId: payment.id })
  } catch (err: unknown) {
    if (err instanceof SquareError) {
      console.error("Square error (Mother's Day checkout):", err.errors)
      return NextResponse.json({ error: 'Payment failed. Please try again.' }, { status: 402 })
    }
    console.error("Mother's Day checkout error:", err)
    return NextResponse.json({ error: 'Payment failed. Please try again.' }, { status: 500 })
  }
}
