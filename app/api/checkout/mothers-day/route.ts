import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { SquareError } from 'square'
import type { OrderLineItem } from 'square'
import { getSquareClient, LOCATION_ID, PRODUCT_VARIATION_MAP } from '@/app/lib/square'
import { sendMail } from '@/app/lib/email'

const ARRANGEMENT_PRICES: Record<string, { label: string; price: number; productId: string }> = {
  '50': { label: '$50 Arrangement (490mL mason jar)', price: 50, productId: 'mothers-day-bouquet-50' },
  '75': { label: '$75 Arrangement (750mL mason jar)', price: 75, productId: 'mothers-day-bouquet-75' },
}

const DELIVERY_PRICE = 10
const CARD_PRICE = 4

export async function POST(request: Request) {
  const body = await request.json()
  const {
    token,
    name,
    email,
    phone,
    fulfillment,
    address,
    delivery_time,
    arrangement,
    card_to,
    card_message,
  } = body

  if (!token || !name || !email || !phone || !arrangement) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const arrangementInfo = ARRANGEMENT_PRICES[arrangement]
  if (!arrangementInfo) {
    return NextResponse.json({ error: 'Invalid arrangement selected.' }, { status: 400 })
  }

  const isDelivery = fulfillment === 'delivery'
  const hasCard = !!(card_to || card_message)
  const total = arrangementInfo.price + (isDelivery ? DELIVERY_PRICE : 0) + (hasCard ? CARD_PRICE : 0)

  const lineItems: OrderLineItem[] = [
    {
      quantity: '1',
      catalogObjectId: PRODUCT_VARIATION_MAP[arrangementInfo.productId],
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
    lineItems.push({
      quantity: '1',
      catalogObjectId: PRODUCT_VARIATION_MAP['card-addon'],
      ...(card_to || card_message
        ? { note: [card_to && `To: ${card_to}`, card_message].filter(Boolean).join(' — ') }
        : {}),
    })
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

    const paymentResponse = await client.payments.create({
      sourceId: token,
      idempotencyKey: randomUUID(),
      amountMoney: { amount: BigInt(total * 100), currency: 'CAD' },
      orderId: order.id,
      locationId: LOCATION_ID,
      buyerEmailAddress: email,
    })

    const payment = paymentResponse.payment
    if (!payment?.id) {
      return NextResponse.json({ error: 'Payment failed. Please try again.' }, { status: 402 })
    }

    const ownerHtml = `
      <h2 style="font-family:sans-serif">New Mother's Day Order — ${name}</h2>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${name}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Phone</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${phone}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${isDelivery ? `Delivery — May 10th` : 'Pick up — May 9th, Mile End'}</td></tr>
        ${isDelivery && address ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Address</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${address}${delivery_time ? ` · ${delivery_time}` : ''}</td></tr>` : ''}
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Arrangement</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${arrangementInfo.label}</td></tr>
        ${hasCard ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Card</td><td style="padding:6px 12px;border-bottom:1px solid #eee">To: ${card_to || '—'}<br/>${card_message || ''}</td></tr>` : ''}
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Total Paid</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:700">$${total.toFixed(2)} CAD</td></tr>
        <tr><td style="padding:6px 12px;font-weight:600">Square Order ID</td><td style="padding:6px 12px">${order.id}</td></tr>
      </table>
    `

    const customerHtml = `
      <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
        <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Order confirmed</h1>
        <p style="font-size:15px;line-height:1.6;color:#444">
          Thank you, ${name}! Your Mother's Day order is confirmed. Emmi will have it ready for you.
        </p>
        <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Order Summary</h2>
        <table style="font-size:14px;border-collapse:collapse;width:100%">
          <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${arrangementInfo.label}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${arrangementInfo.price.toFixed(2)}</td></tr>
          ${isDelivery ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Delivery — May 10th</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${DELIVERY_PRICE.toFixed(2)}</td></tr>` : ''}
          ${hasCard ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Greeting Card</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${CARD_PRICE.toFixed(2)}</td></tr>` : ''}
          <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${total.toFixed(2)} CAD</td></tr>
        </table>
        <table style="font-size:14px;border-collapse:collapse;width:100%;margin-top:24px">
          <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${isDelivery ? `Delivery — May 10th${address ? `, ${address}` : ''}` : 'Pick up — May 9th, 10am–5pm, Mile End'}</td></tr>
        </table>
        <p style="font-size:12px;color:#aaa;margin-top:32px">Order ref: ${order.id}</p>
        <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d'Emmi · Montréal, QC</p>
      </div>
    `

    try {
      await Promise.all([
        sendMail({
          to: process.env.RECIPIENT_EMAIL!,
          subject: `New Mother's Day order — ${name}`,
          html: ownerHtml,
        }),
        sendMail({
          to: email,
          subject: `Your order is confirmed — Fleurs d'Emmi`,
          html: customerHtml,
        }),
      ])
    } catch (err) {
      console.error("Email error (Mother's Day checkout):", err)
    }

    return NextResponse.json({ orderId: order.id, paymentId: payment.id })
  } catch (err: unknown) {
    if (err instanceof SquareError) {
      const message = err.errors?.[0]?.detail ?? 'Payment failed. Please try again.'
      return NextResponse.json({ error: message }, { status: 402 })
    }
    console.error("Mother's Day checkout error:", err)
    return NextResponse.json({ error: 'Payment failed. Please try again.' }, { status: 500 })
  }
}
