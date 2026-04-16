import { NextResponse } from 'next/server'
import { sendMail } from '@/app/lib/email'

export async function POST(request: Request) {
  const body = await request.json()
  const {
    name,
    email,
    phone,
    event_date,
    fulfillment,
    event_location,
    guest_count,
    items,
    style_notes,
    additional,
  } = body

  if (!name || !email || !phone || !event_date) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const itemList = Array.isArray(items) ? items : items ? [items] : []
  const fulfillmentList = Array.isArray(fulfillment) ? fulfillment : fulfillment ? [fulfillment] : []

  const ownerHtml = `
    <h2 style="font-family:sans-serif">New Wedding Inquiry — ${name}</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${name}</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><a href="mailto:${email}">${email}</a></td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Phone</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${phone}</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Event Date</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${event_date}</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${fulfillmentList.join(', ') || '—'}</td></tr>
      ${event_location ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Event Location</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${event_location}</td></tr>` : ''}
      ${guest_count ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Guest Count</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${guest_count}</td></tr>` : ''}
      ${itemList.length > 0 ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Selected Items</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${itemList.join('<br/>')}</td></tr>` : ''}
      ${style_notes ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Style Notes</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${style_notes}</td></tr>` : ''}
      ${additional ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Additional Info</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${additional}</td></tr>` : ''}
    </table>
  `

  const customerHtml = `
    <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
      <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Inquiry received!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444">
        Thank you, ${name}! Emmi has received your wedding & events inquiry and will be in touch shortly to discuss your vision and provide a custom quote.
      </p>

      <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Your Inquiry Details</h2>
      <table style="font-size:14px;border-collapse:collapse;width:100%">
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Event Date</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${event_date}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${fulfillmentList.join(', ') || '—'}</td></tr>
        ${event_location ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Event Location</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${event_location}</td></tr>` : ''}
        ${itemList.length > 0 ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Items of Interest</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${itemList.join('<br/>')}</td></tr>` : ''}
      </table>

      <p style="font-size:13px;color:#888;margin-top:32px">
        Fleurs d'Emmi · Montréal, QC
      </p>
    </div>
  `

  try {
    await Promise.all([
      sendMail({
        to: process.env.RECIPIENT_EMAIL!,
        subject: `New wedding inquiry — ${name}`,
        html: ownerHtml,
      }),
      sendMail({
        to: email,
        subject: `Inquiry received — Fleurs d'Emmi`,
        html: customerHtml,
      }),
    ])
  } catch (err) {
    console.error('Email error (weddings inquiry):', err)
    // Don't fail the request over email — the inquiry was received
  }

  return NextResponse.json({ ok: true })
}
