import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { SquareError } from 'square'
import { parseCart, serializeCart, cartTotal } from '@/app/lib/cart'
import { getSquareClient, LOCATION_ID } from '@/app/lib/square'
import { sendMail } from '@/app/lib/email'
import { escapeHtml, emailSchema, nameSchema } from '@/app/lib/validate'
import { verifyTurnstile } from '@/app/lib/turnstile'
import { appendToCustomerList } from '@/app/lib/sheets'
import { createPickupBooking } from '@/app/lib/appointments'

const SQUARE_VARIATION_ID = /^[A-Z0-9]{20,30}$/

const COOKIE_NAME = 'cart'

const bodySchema = z.object({
  token:              z.string().min(1).max(512),
  email:              emailSchema.optional(),
  name:               nameSchema.optional(),
  subscribe_to_news:  z.boolean().optional(),
  turnstile:          z.string().optional(),
  website:            z.string().max(0, 'Honeypot').optional(), // must be empty
  pickupStartAt:      z.string().datetime(),
  pickupSegments:     z.array(z.object({
    startAt:                 z.string(),
    durationMinutes:         z.number().int().positive(),
    serviceVariationId:      z.string().min(1).max(64),
    serviceVariationVersion: z.string().regex(/^\d+$/),
    teamMemberId:            z.string().min(1).max(64),
  })).min(1).max(1),
})

export async function POST(request: Request) {
  // --- Validate request body ---
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // --- Honeypot check ---
  if (body.website) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // --- Turnstile verification ---
  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? undefined
  const turnstileOk = await verifyTurnstile(body.turnstile, ip ?? undefined)
  if (!turnstileOk) {
    return NextResponse.json({ error: 'Bot verification failed. Please try again.' }, { status: 403 })
  }

  const { token, email, name, subscribe_to_news } = body

  const cookieStore = await cookies()
  const cart = parseCart(cookieStore.get(COOKIE_NAME)?.value)

  if (cart.items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const client = getSquareClient()

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
    const paymentResponse = await client.payments.create({
      sourceId: token,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(orderTotalCents),
        currency: 'CAD',
      },
      orderId: order.id,
      locationId: LOCATION_ID,
      buyerEmailAddress: email ?? undefined,
    })

    const payment = paymentResponse.payment
    if (!payment?.id) {
      return NextResponse.json({ error: 'Payment failed. Please try again.' }, { status: 402 })
    }

    // Step 4: Create pickup booking (non-fatal — payment already captured)
    let bookingId: string | null = null
    try {
      const customerNote = `Order ${order.id}${name ? ` — ${name}` : ''}`
      bookingId = await createPickupBooking(body.pickupSegments[0], customerNote)
    } catch (err) {
      console.error('Booking creation failed after payment:', err)
    }

    // Step 5: Send confirmation emails (HTML-escaped)
    const pickupFormatted = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto',
      weekday: 'long', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }).format(new Date(body.pickupStartAt))
    const safePickup = escapeHtml(pickupFormatted)

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

    const ownerHtml = `
      <h2 style="font-family:sans-serif">New shop order — ${safeName || safeEmail}</h2>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${safeName || '—'}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${safeEmail ? `<a href="mailto:${safeEmail}">${safeEmail}</a>` : '—'}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Pickup</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${safePickup}${bookingId ? ` <span style="color:#888;font-size:12px">(Booking: ${escapeHtml(bookingId)})</span>` : ''}</td></tr>
      </table>
      <h3 style="font-family:sans-serif;margin-top:24px">Items</h3>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
        ${itemRows}
        <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${totalFormatted} CAD</td></tr>
      </table>
      <p style="font-family:sans-serif;font-size:13px;color:#888;margin-top:16px">Square Order ID: ${order.id}</p>
    `

    const customerHtml = email
      ? `
      <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
        <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Order confirmed</h1>
        <p style="font-size:15px;line-height:1.6;color:#444">
          Thank you${safeName ? `, ${safeName}` : ''}! Your order has been received and your payment is confirmed. Your pickup is booked for ${safePickup} in the Mile End.
        </p>
        <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Order Summary</h2>
        <table style="font-size:14px;border-collapse:collapse;width:100%">
          ${itemRows}
          <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${totalFormatted} CAD</td></tr>
        </table>
        <p style="font-size:12px;color:#aaa;margin-top:32px">Order ref: ${order.id}</p>
        <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d'Emmi · Montréal, QC</p>
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
          ? [sendMail({ to: email, subject: `Your order is confirmed — Fleurs d'Emmi`, html: customerHtml })]
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
