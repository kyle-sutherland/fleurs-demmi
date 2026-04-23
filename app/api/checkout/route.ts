import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z, ZodError } from 'zod'
import { SquareError } from 'square'
import { parseCart, serializeCart, cartTotal } from '@/app/lib/cart'
import { getSquareClient, LOCATION_ID } from '@/app/lib/square'
import { sendMail } from '@/app/lib/email'
import { escapeHtml, emailSchema, nameSchema, montrealAddressSchema } from '@/app/lib/validate'
import { verifyTurnstile } from '@/app/lib/turnstile'
import { enforceRateLimit } from '@/app/lib/rateLimit'
import { appendToCustomerList } from '@/app/lib/sheets'
import { createPickupBooking, getPickupLocation } from '@/app/lib/appointments'
import type { CatalogObject } from 'square'

const SQUARE_VARIATION_ID = /^[A-Z0-9]{20,30}$/

const COOKIE_NAME = 'cart'

const bodySchema = z.object({
  token:              z.string().min(1).max(512),
  email:              emailSchema.optional(),
  name:               nameSchema.optional(),
  subscribe_to_news:  z.boolean().optional(),
  turnstile:          z.string().optional(),
  website:            z.string().max(0, 'Honeypot').optional(), // must be empty
  pickupStartAt:      z.string().datetime().optional(),
  pickupSegments:     z.array(z.object({
    startAt:                 z.string(),
    durationMinutes:         z.number().int().positive(),
    serviceVariationId:      z.string().min(1).max(64),
    serviceVariationVersion: z.string().regex(/^\d+$/),
    teamMemberId:            z.string().min(1).max(64),
  })).min(1).max(1).optional(),
  deliveryAddress: montrealAddressSchema.optional(),
  giftCardToken: z.string().min(1).max(512).optional(),
  discountCode:  z.string().max(50).optional(),
})

export async function POST(request: Request) {
  // --- Validate request body ---
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      const addressIssue = err.issues.find((i) => i.path.includes('deliveryAddress'))
      if (addressIssue) return NextResponse.json({ error: addressIssue.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // --- Rate limiting ---
  const rateLimited = await enforceRateLimit(request, 'checkout')
  if (rateLimited) return rateLimited

  // --- Honeypot check ---
  if (body.website) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // --- Turnstile verification ---
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
  const turnstileOk = await verifyTurnstile(body.turnstile, ip)
  if (!turnstileOk) {
    return NextResponse.json({ error: 'Bot verification failed. Please try again.' }, { status: 403 })
  }

  const { token, email, name, subscribe_to_news, giftCardToken } = body

  const cookieStore = await cookies()
  const cart = parseCart(cookieStore.get(COOKIE_NAME)?.value)

  if (cart.items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const needsPickup = cart.items.some(
    (i) => !i.productId.startsWith('delivery-surcharge:') && !i.options?.pickup
  )
  const hasDelivery = cart.items.some((i) => i.options?.pickup === 'Delivery')

  if (needsPickup && !body.pickupStartAt) {
    return NextResponse.json({ error: 'Please select a pickup time.' }, { status: 400 })
  }

  if (hasDelivery && !body.deliveryAddress?.trim()) {
    return NextResponse.json({ error: 'Please enter a delivery address.' }, { status: 400 })
  }

  const client = getSquareClient()

  // Defense-in-depth: validate delivery surcharge prices server-side.
  // productId format is `delivery-surcharge:<variationId>` where the
  // variationId encodes the linked subscription tier.
  const surchargeItems = cart.items.filter((i) => i.productId.startsWith('delivery-surcharge:'))
  if (surchargeItems.length > 0) {
    const variationIds = surchargeItems.map((i) => i.productId.slice('delivery-surcharge:'.length))
    try {
      const res = await client.catalog.batchGet({ objectIds: variationIds })
      const variationMap = new Map<string, CatalogObject>()
      for (const obj of res.objects ?? []) {
        if (obj.id) variationMap.set(obj.id, obj)
      }
      for (const surcharge of surchargeItems) {
        const varId = surcharge.productId.slice('delivery-surcharge:'.length)
        const variation = variationMap.get(varId)
        const attrs = variation && 'customAttributeValues' in variation
          ? (variation.customAttributeValues as Record<string, { numberValue?: string | null }> | undefined)
          : undefined
        const bouquets = attrs?.['bouquets']?.numberValue != null ? Number(attrs['bouquets'].numberValue) : null
        const expectedPrice = bouquets != null ? 10 * bouquets : null
        if (expectedPrice === null || Math.abs(surcharge.price * surcharge.quantity - expectedPrice) > 0.01) {
          console.error(
            `Delivery surcharge price mismatch: cartPrice=${surcharge.price * surcharge.quantity} expected=${expectedPrice} varId=${varId}`
          )
          return NextResponse.json({ error: 'Invalid delivery surcharge.' }, { status: 400 })
        }
      }
    } catch (err) {
      console.error('Surcharge validation failed:', err)
      return NextResponse.json({ error: 'Failed to validate cart. Please try again.' }, { status: 500 })
    }
  }

  try {
    const lineItems = cart.items.map((item) => {
      const note =
        Object.keys(item.options ?? {}).length > 0
          ? Object.entries(item.options!).map(([k, v]) => `${k}: ${v}`).join(', ')
          : undefined

      if (SQUARE_VARIATION_ID.test(item.productId)) {
        return {
          quantity: String(item.quantity),
          catalogObjectId: item.productId,
          ...(note && { note }),
        }
      }

      return {
        quantity: String(item.quantity),
        name: item.name,
        basePriceMoney: {
          amount: BigInt(Math.round(item.price * 100)),
          currency: 'CAD' as const,
        },
        ...(note && { note }),
      }
    })

    // Step 1: Create the order
    const orderResponse = await client.orders.create({
      order: { locationId: LOCATION_ID, lineItems },
      idempotencyKey: randomUUID(),
    })

    const order = orderResponse.order
    if (!order?.id) {
      return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 })
    }

    // Step 2: Verify order total matches cart total — hard reject if they diverge
    const orderTotalCents = Number(order.totalMoney?.amount ?? 0)
    const cartTotalCents = Math.round(cartTotal(cart) * 100)

    if (!orderTotalCents) {
      console.error(`Square order had no totalMoney — orderId=${order.id}`)
      return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 })
    }

    if (Math.abs(orderTotalCents - cartTotalCents) > 5) {
      console.error(
        `Order total mismatch: Square=${orderTotalCents} cart=${cartTotalCents} orderId=${order.id}`
      )
      return NextResponse.json({ error: 'Order total mismatch. Please refresh and try again.' }, { status: 400 })
    }

    // Step 3: Charge the payment against the order using Square's verified total
    // If a gift card token was provided, re-fetch live balance and apply split payment
    let payment: { id?: string; receiptUrl?: string } | null = null
    let giftCardAmountCents = 0

    if (giftCardToken) {
      // Attempt to charge the full order amount to the gift card.
      // If the balance is insufficient Square returns INSUFFICIENT_FUNDS — we catch it,
      // read the available balance from the error, then do a split charge.
      let gcPaymentId: string | null = null
      try {
        const gcPaymentRes = await client.payments.create({
          sourceId: giftCardToken,
          idempotencyKey: randomUUID(),
          amountMoney: { amount: BigInt(orderTotalCents), currency: 'CAD' },
          orderId: order.id,
          locationId: LOCATION_ID,
          buyerEmailAddress: email ?? undefined,
        })
        if (gcPaymentRes.payment?.id) {
          giftCardAmountCents = orderTotalCents
          payment = gcPaymentRes.payment
        }
      } catch (gcErr) {
        // Check if this is an insufficient-funds error with a partial balance
        if (gcErr instanceof SquareError) {
          const insufficientErr = gcErr.errors?.find(
            (e) => e.code === 'INSUFFICIENT_FUNDS' || e.code === 'GIFT_CARD_BALANCE_INSUFFICIENT'
          )
          const availableCents = insufficientErr
            ? Number((insufficientErr as { detail?: string }).detail?.match(/(\d+)/)?.[1] ?? 0)
            : 0

          if (availableCents > 0) {
            // Charge gift card for its available balance
            const gcSplitRes = await client.payments.create({
              sourceId: giftCardToken,
              idempotencyKey: randomUUID(),
              amountMoney: { amount: BigInt(availableCents), currency: 'CAD' },
              orderId: order.id,
              locationId: LOCATION_ID,
              buyerEmailAddress: email ?? undefined,
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
              buyerEmailAddress: email ?? undefined,
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
          // If no available balance info, fall through to full card charge
        }
      }
    }

    if (!payment) {
      // No gift card, or GC lookup failed — charge full amount to card
      const paymentResponse = await client.payments.create({
        sourceId: token,
        idempotencyKey: randomUUID(),
        amountMoney: { amount: BigInt(orderTotalCents), currency: 'CAD' },
        orderId: order.id,
        locationId: LOCATION_ID,
        buyerEmailAddress: email ?? undefined,
      })
      payment = paymentResponse.payment ?? null
    }

    if (!payment?.id) {
      return NextResponse.json({ error: 'Payment failed. Please try again.' }, { status: 402 })
    }

    // Step 4: Create pickup booking (non-fatal — payment already captured)
    let bookingId: string | null = null
    if (needsPickup && body.pickupSegments) {
      try {
        const customerNote = `Order ${order.id}${name ? ` — ${name}` : ''}`
        bookingId = await createPickupBooking(body.pickupSegments[0], customerNote)
      } catch (err) {
        console.error('Booking creation failed after payment:', err)
      }
    }

    // Step 5: Send confirmation emails (HTML-escaped)
    const receiptUrl = payment.receiptUrl ?? null

    async function fetchReceiptAttachment(url: string): Promise<Buffer | null> {
      try {
        const res = await fetch(url, { headers: { 'Accept': 'text/html' } })
        if (!res.ok) return null
        return Buffer.from(await res.arrayBuffer())
      } catch {
        return null
      }
    }

    const [pickupLocationResult, receiptBufferResult] = await Promise.allSettled([
      needsPickup ? getPickupLocation() : Promise.resolve(null),
      receiptUrl ? fetchReceiptAttachment(receiptUrl) : Promise.resolve(null),
    ])
    const safePickupLocation = escapeHtml(
      (pickupLocationResult.status === 'fulfilled' && pickupLocationResult.value)
        ? pickupLocationResult.value
        : 'Mile End'
    )

    const receiptBuffer = receiptBufferResult.status === 'fulfilled' ? receiptBufferResult.value : null
    const receiptAttachments = receiptBuffer
      ? [{ filename: 'receipt.html', content: receiptBuffer, contentType: 'text/html' }]
      : []

    const safePickup = needsPickup && body.pickupStartAt
      ? escapeHtml(new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Toronto',
          weekday: 'long', month: 'long', day: 'numeric',
          hour: 'numeric', minute: '2-digit', hour12: true,
        }).format(new Date(body.pickupStartAt)))
      : null

    const safePickupFr = needsPickup && body.pickupStartAt
      ? escapeHtml(new Intl.DateTimeFormat('fr-CA', {
          timeZone: 'America/Toronto',
          weekday: 'long', month: 'long', day: 'numeric',
          hour: 'numeric', minute: '2-digit', hour12: false,
        }).format(new Date(body.pickupStartAt)))
      : null

    const safeDeliveryAddress = hasDelivery && body.deliveryAddress
      ? escapeHtml(body.deliveryAddress)
      : null

    const totalFormatted = (orderTotalCents / 100).toFixed(2)
    const safeName = escapeHtml(name ?? '')
    const safeEmail = escapeHtml(email ?? '')
    const itemRows = cart.items
      .map((item) => {
        const safItemName = escapeHtml(item.name)
        const opts = item.options && Object.keys(item.options).length
          ? ` <span style="color:#888;font-size:12px">(${Object.entries(item.options).map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(v)}`).join(', ')})</span>`
          : ''
        return `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${safItemName}${opts} × ${item.quantity}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${(item.price * item.quantity).toFixed(2)}</td></tr>`
      })
      .join('')

    const gcDisplay = giftCardAmountCents > 0
      ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;color:#888">Gift Card</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;color:#888">−$${(giftCardAmountCents / 100).toFixed(2)}</td></tr>`
      : ''

    const ownerHtml = `
      <h2 style="font-family:sans-serif">New shop order — ${safeName || safeEmail}</h2>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${safeName || '—'}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${safeEmail ? `<a href="mailto:${safeEmail}">${safeEmail}</a>` : '—'}</td></tr>
        ${safePickup ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Pickup time</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${safePickup} — ${safePickupLocation}${bookingId ? ` <span style="color:#888;font-size:12px">(Booking: ${escapeHtml(bookingId)})</span>` : ''}</td></tr>` : ''}
        ${safeDeliveryAddress ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Delivery address</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${safeDeliveryAddress}</td></tr>` : ''}
        ${cart.items.filter(i => i.options?.pickup).map(i => `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;color:#555">${escapeHtml(i.name)}</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(i.options!.pickup)}</td></tr>`).join('')}
      </table>
      <h3 style="font-family:sans-serif;margin-top:24px">Items</h3>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
        ${itemRows}
        ${gcDisplay}
        <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${totalFormatted} CAD</td></tr>
      </table>
      <p style="font-family:sans-serif;font-size:13px;color:#888;margin-top:16px">Square Order ID: ${order.id}</p>
    `

    const customerHtml = email
      ? `
      <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a;padding-bottom:32px;border-bottom:2px solid #eee;margin-bottom:32px">
        <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Commande confirm&#233;e</h1>
        <p style="font-size:15px;line-height:1.6;color:#444">
          Merci${safeName ? `, ${safeName}` : ''}&nbsp;! Votre commande a &#233;t&#233; re&#231;ue et votre paiement est confirm&#233;.${safePickupFr ? ` Votre cueillette est pr&#233;vue le ${safePickupFr} &#8212; ${safePickupLocation}.` : ''}${safeDeliveryAddress ? ` Livraison &#224;&nbsp;: ${safeDeliveryAddress}.` : ''}
        </p>
        <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">R&#233;sum&#233; de la commande</h2>
        <table style="font-size:14px;border-collapse:collapse;width:100%">
          ${itemRows}
          ${gcDisplay}
          <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${totalFormatted} CAD</td></tr>
        </table>
        ${receiptUrl ? `<p style="margin-top:24px"><a href="${escapeHtml(receiptUrl)}" style="display:inline-block;padding:10px 20px;background:#1a1a1a;color:#fff;text-decoration:none;font-size:13px;font-weight:600">Voir le re&#231;u Square</a></p>` : ''}
        <p style="font-size:12px;color:#aaa;margin-top:32px">R&#233;f&#233;rence&nbsp;: ${order.id}</p>
        <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
      </div>
      <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
        <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Order confirmed</h1>
        <p style="font-size:15px;line-height:1.6;color:#444">
          Thank you${safeName ? `, ${safeName}` : ''}! Your order has been received and your payment is confirmed.${safePickup ? ` Your pickup is booked for ${safePickup} &#8212; ${safePickupLocation}.` : ''}${safeDeliveryAddress ? ` Delivery to: ${safeDeliveryAddress}.` : ''}
        </p>
        <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Order Summary</h2>
        <table style="font-size:14px;border-collapse:collapse;width:100%">
          ${itemRows}
          ${gcDisplay}
          <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${totalFormatted} CAD</td></tr>
        </table>
        ${receiptUrl ? `<p style="margin-top:24px"><a href="${escapeHtml(receiptUrl)}" style="display:inline-block;padding:10px 20px;background:#1a1a1a;color:#fff;text-decoration:none;font-size:13px;font-weight:600">View Square receipt</a></p>` : ''}
        <p style="font-size:12px;color:#aaa;margin-top:32px">Order ref: ${order.id}</p>
        <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
      </div>
    `
      : null

    try {
      await Promise.all([
        sendMail({
          to: process.env.RECIPIENT_EMAIL!,
          subject: `New shop order — ${name ?? email ?? 'customer'}`,
          html: ownerHtml,
        }),
        ...(customerHtml && email
          ? [sendMail({ to: email, subject: `Your order is confirmed — Fleurs d'Emmi`, html: customerHtml, attachments: receiptAttachments })]
          : []),
        appendToCustomerList({ name, email, source: 'checkout', subscribed: subscribe_to_news ? 'subscribed' : 'unknown' }),
      ])
    } catch (err) {
      console.error('Email error (shop checkout):', err)
    }

    // Step 6: Clear the cart cookie
    const res = NextResponse.json({ orderId: order.id, paymentId: payment.id })
    res.cookies.set(COOKIE_NAME, serializeCart({ items: [] }), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    return res
  } catch (err: unknown) {
    if (err instanceof SquareError) {
      console.error('Square error (shop checkout):', err.errors)
      return NextResponse.json({ error: 'Payment failed. Please try again.' }, { status: 402 })
    }
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Payment failed. Please try again.' }, { status: 500 })
  }
}
