import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { SquareError } from 'square'
import { parseCart, serializeCart, cartTotal } from '@/app/lib/cart'
import { getSquareClient, LOCATION_ID, PRODUCT_VARIATION_MAP } from '@/app/lib/square'
import { sendMail } from '@/app/lib/email'

const COOKIE_NAME = 'cart'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const cart = parseCart(cookieStore.get(COOKIE_NAME)?.value)

  if (cart.items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const { token, email, name } = await request.json()
  const client = getSquareClient()

  try {
    // Build order line items, splitting into catalog and custom line items
    const lineItems = cart.items.map((item) => {
      const variationId = PRODUCT_VARIATION_MAP[item.productId]

      if (variationId) {
        // Catalog item — Square will pull name and price from the catalog
        return {
          quantity: String(item.quantity),
          catalogObjectId: variationId,
          ...(Object.keys(item.options ?? {}).length > 0 && {
            note: Object.entries(item.options!)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', '),
          }),
        }
      }

      // Non-catalog item (e.g. delivery surcharge, custom upgrade) — use ad-hoc line item
      return {
        quantity: String(item.quantity),
        name: item.name,
        basePriceMoney: {
          amount: BigInt(Math.round(item.price * 100)),
          currency: 'CAD' as const,
        },
        ...(Object.keys(item.options ?? {}).length > 0 && {
          note: Object.entries(item.options!)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', '),
        }),
      }
    })

    // Step 1: Create the order
    const orderResponse = await client.orders.create({
      order: {
        locationId: LOCATION_ID,
        lineItems,
      },
      idempotencyKey: randomUUID(),
    })

    const order = orderResponse.order
    if (!order?.id) {
      return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 })
    }

    // Step 2: Verify order total matches cart total (sanity check)
    const orderTotalCents = Number(order.totalMoney?.amount ?? 0)
    const cartTotalCents = Math.round(cartTotal(cart) * 100)

    // Allow a small tolerance for floating point; if they diverge significantly something is wrong
    if (Math.abs(orderTotalCents - cartTotalCents) > 5) {
      console.error(
        `Order total mismatch: Square=${orderTotalCents} cart=${cartTotalCents} orderId=${order.id}`
      )
    }

    // Step 3: Charge the payment against the order
    const paymentResponse = await client.payments.create({
      sourceId: token,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(orderTotalCents || cartTotalCents),
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

    // Step 4: Send confirmation emails
    const totalFormatted = ((orderTotalCents || cartTotalCents) / 100).toFixed(2)
    const itemRows = cart.items
      .map(
        (item) =>
          `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${item.name}${item.options && Object.keys(item.options).length ? ` <span style="color:#888;font-size:12px">(${Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(', ')})</span>` : ''} × ${item.quantity}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${(item.price * item.quantity).toFixed(2)}</td></tr>`
      )
      .join('')

    const ownerHtml = `
      <h2 style="font-family:sans-serif">New shop order — ${name ?? email}</h2>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${name ?? '—'}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${email ? `<a href="mailto:${email}">${email}</a>` : '—'}</td></tr>
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
          Thank you${name ? `, ${name}` : ''}! Your order has been received and your payment is confirmed. Emmi will be in touch soon with pickup or delivery details.
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
          ? [
              sendMail({
                to: email,
                subject: `Your order is confirmed — Fleurs d'Emmi`,
                html: customerHtml,
              }),
            ]
          : []),
      ])
    } catch (err) {
      console.error('Email error (shop checkout):', err)
    }

    // Step 5: Clear the cart cookie
    const res = NextResponse.json({ orderId: order.id, paymentId: payment.id })
    res.cookies.set(COOKIE_NAME, serializeCart({ items: [] }), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      httpOnly: false,
    })
    return res
  } catch (err: unknown) {
    if (err instanceof SquareError) {
      const message = err.errors?.[0]?.detail ?? 'Payment failed. Please try again.'
      return NextResponse.json({ error: message }, { status: 402 })
    }
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Payment failed. Please try again.' }, { status: 500 })
  }
}
