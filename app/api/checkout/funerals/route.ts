import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { SquareError } from 'square'
import type { OrderLineItem } from 'square'
import { getSquareClient, LOCATION_ID } from '@/app/lib/square'
import { sendMail } from '@/app/lib/email'

const ARRANGEMENT_PRICES: Record<string, { label: string; price: number }> = {
  small: { label: 'Small Vase Arrangement', price: 80 },
  medium: { label: 'Medium Vase Arrangement', price: 120 },
  large: { label: 'Large Vase Arrangement', price: 160 },
}

const CARD_ADDON_PRICE = 4

export async function POST(request: Request) {
  const body = await request.json()
  const {
    token,
    name,
    email,
    phone,
    funeral_date,
    funeral_location,
    fulfillment,
    arrangement,
    style_notes,
    card_name,
    card_message,
  } = body

  if (!token || !name || !email || !phone || !funeral_date || !arrangement) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const arrangementInfo = ARRANGEMENT_PRICES[arrangement]
  if (!arrangementInfo) {
    return NextResponse.json({ error: 'Invalid arrangement selected.' }, { status: 400 })
  }

  const hasCard = !!(card_name || card_message)
  const total = arrangementInfo.price + (hasCard ? CARD_ADDON_PRICE : 0)

  const lineItems: OrderLineItem[] = [
    {
      quantity: '1',
      name: arrangementInfo.label,
      basePriceMoney: { amount: BigInt(arrangementInfo.price * 100), currency: 'CAD' as const },
      ...(style_notes ? { note: style_notes } : {}),
    },
  ]

  if (hasCard) {
    lineItems.push({
      quantity: '1',
      name: 'Greeting Card',
      basePriceMoney: { amount: BigInt(CARD_ADDON_PRICE * 100), currency: 'CAD' as const },
      ...(card_name || card_message
        ? { note: [card_name && `To: ${card_name}`, card_message].filter(Boolean).join(' — ') }
        : {}),
    })
  }

  const client = getSquareClient()

  try {
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

    const fulfillmentList = Array.isArray(fulfillment) ? fulfillment : fulfillment ? [fulfillment] : []

    const ownerHtml = `
      <h2 style="font-family:sans-serif">New Sympathy Order — ${name}</h2>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${name}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Phone</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${phone}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Funeral Date</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${funeral_date}</td></tr>
        ${funeral_location ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Location</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${funeral_location}</td></tr>` : ''}
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${fulfillmentList.join(', ') || '—'}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Arrangement</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${arrangementInfo.label} — $${arrangementInfo.price.toFixed(2)}</td></tr>
        ${hasCard ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Card</td><td style="padding:6px 12px;border-bottom:1px solid #eee">To: ${card_name || '—'}<br/>${card_message || ''}</td></tr>` : ''}
        ${style_notes ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Style Notes</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${style_notes}</td></tr>` : ''}
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Total Paid</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:700">$${total.toFixed(2)} CAD</td></tr>
        <tr><td style="padding:6px 12px;font-weight:600">Square Order ID</td><td style="padding:6px 12px">${order.id}</td></tr>
      </table>
    `

    const customerHtml = `
      <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
        <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Order confirmed</h1>
        <p style="font-size:15px;line-height:1.6;color:#444">
          Thank you, ${name}. Your order has been received and your payment is confirmed. Emmi will be in touch soon with pickup or delivery details.
        </p>

        <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Order Summary</h2>
        <table style="font-size:14px;border-collapse:collapse;width:100%">
          <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${arrangementInfo.label}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${arrangementInfo.price.toFixed(2)}</td></tr>
          ${hasCard ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Greeting Card</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${CARD_ADDON_PRICE.toFixed(2)}</td></tr>` : ''}
          <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${total.toFixed(2)} CAD</td></tr>
        </table>

        <table style="font-size:14px;border-collapse:collapse;width:100%;margin-top:24px">
          <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Funeral Date</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${funeral_date}</td></tr>
          <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${fulfillmentList.join(', ') || '—'}</td></tr>
          ${funeral_location ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Location</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${funeral_location}</td></tr>` : ''}
        </table>

        <p style="font-size:12px;color:#aaa;margin-top:32px">Order ref: ${order.id}</p>
        <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d'Emmi · Montréal, QC</p>
      </div>
    `

    try {
      await Promise.all([
        sendMail({
          to: process.env.RECIPIENT_EMAIL!,
          subject: `New sympathy order — ${name}`,
          html: ownerHtml,
        }),
        sendMail({
          to: email,
          subject: `Your order is confirmed — Fleurs d'Emmi`,
          html: customerHtml,
        }),
      ])
    } catch (err) {
      console.error('Email error (funerals checkout):', err)
      // Payment already succeeded — don't fail the response
    }

    return NextResponse.json({ orderId: order.id, paymentId: payment.id })
  } catch (err: unknown) {
    if (err instanceof SquareError) {
      const message = err.errors?.[0]?.detail ?? 'Payment failed. Please try again.'
      return NextResponse.json({ error: message }, { status: 402 })
    }
    console.error('Funerals checkout error:', err)
    return NextResponse.json({ error: 'Payment failed. Please try again.' }, { status: 500 })
  }
}
