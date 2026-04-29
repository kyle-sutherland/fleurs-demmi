import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendMail } from '@/app/lib/email'
import { escapeHtml, emailSchema, nameSchema, phoneSchema, dateSchema, textSchema } from '@/app/lib/validate'
import { verifyTurnstile } from '@/app/lib/turnstile'
import { enforceRateLimit } from '@/app/lib/rateLimit'
import { appendToCustomerList } from '@/app/lib/sheets'

const bodySchema = z.object({
  name:              nameSchema,
  email:             emailSchema,
  phone:             phoneSchema,
  funeral_date:      dateSchema,
  funeral_location:  textSchema.optional(),
  fulfillment:       z.union([z.literal('pickup'), z.literal('delivery')]).optional(),
  arrangementName:   textSchema.optional(),
  style_notes:       textSchema.optional(),
  card_name:         textSchema.optional(),
  card_message:      textSchema.optional(),
  turnstile:         z.string().optional(),
  website:           z.string().max(0, 'Honeypot').optional(),
})

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const rateLimited = await enforceRateLimit(request, 'inquire')
  if (rateLimited) return rateLimited

  if (body.website) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
  if (!await verifyTurnstile(body.turnstile, ip)) {
    return NextResponse.json({ error: 'Bot verification failed. Please try again.' }, { status: 403 })
  }

  const { name, email, phone, funeral_date, funeral_location, fulfillment, arrangementName, style_notes, card_name, card_message } = body

  const sName        = escapeHtml(name)
  const sEmail       = escapeHtml(email)
  const sPhone       = escapeHtml(phone)
  const sDate        = escapeHtml(funeral_date)
  const sLocation    = funeral_location ? escapeHtml(funeral_location) : ''
  const sFulfillment = fulfillment ? escapeHtml(fulfillment) : ''
  const sArrangement = arrangementName ? escapeHtml(arrangementName) : ''
  const sNotes       = style_notes ? escapeHtml(style_notes) : ''
  const sCardName    = card_name ? escapeHtml(card_name) : ''
  const sCardMessage = card_message ? escapeHtml(card_message) : ''

  const ownerHtml = `
    <h2 style="font-family:sans-serif">New Funeral / Sympathy Inquiry — ${sName}</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sName}</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><a href="mailto:${sEmail}">${sEmail}</a></td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Phone</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sPhone}</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Funeral Date</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sDate}</td></tr>
      ${sFulfillment ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sFulfillment}</td></tr>` : ''}
      ${sLocation ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Funeral Location</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sLocation}</td></tr>` : ''}
      ${sArrangement ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Arrangement Interest</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sArrangement}</td></tr>` : ''}
      ${sNotes ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Style Notes</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sNotes}</td></tr>` : ''}
      ${sCardName ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Card Recipient</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sCardName}</td></tr>` : ''}
      ${sCardMessage ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Card Message</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sCardMessage}</td></tr>` : ''}
    </table>
  `

  const customerHtml = `
    <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a;padding-bottom:32px;border-bottom:2px solid #eee;margin-bottom:32px">
      <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Demande re&#231;ue</h1>
      <p style="font-size:15px;line-height:1.6;color:#444">
        Merci, ${sName}. Emmi a bien re&#231;u votre demande d&#39;arrangement de condol&#233;ances et vous contactera sous peu pour discuter des d&#233;tails.
      </p>
      <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">D&#233;tails de votre demande</h2>
      <table style="font-size:14px;border-collapse:collapse;width:100%">
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Date des fun&#233;railles</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sDate}</td></tr>
        ${sFulfillment ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Mode de r&#233;ception</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sFulfillment}</td></tr>` : ''}
        ${sLocation ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Lieu</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sLocation}</td></tr>` : ''}
        ${sArrangement ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Arrangement</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sArrangement}</td></tr>` : ''}
      </table>
      <p style="font-size:13px;color:#888;margin-top:32px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
    </div>
    <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
      <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Inquiry received</h1>
      <p style="font-size:15px;line-height:1.6;color:#444">
        Thank you, ${sName}. Emmi has received your sympathy arrangement inquiry and will be in touch shortly to discuss the details.
      </p>
      <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Your Inquiry Details</h2>
      <table style="font-size:14px;border-collapse:collapse;width:100%">
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Funeral Date</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sDate}</td></tr>
        ${sFulfillment ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sFulfillment}</td></tr>` : ''}
        ${sLocation ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Location</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sLocation}</td></tr>` : ''}
        ${sArrangement ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Arrangement</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sArrangement}</td></tr>` : ''}
      </table>
      <p style="font-size:13px;color:#888;margin-top:32px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
    </div>
  `

  try {
    await Promise.all([
      sendMail({ to: process.env.RECIPIENT_EMAIL!, subject: `New funeral inquiry — ${name}`, html: ownerHtml }),
      sendMail({ to: email, cc: process.env.RECIPIENT_EMAIL, subject: `Inquiry received — Fleurs d'Emmi`, html: customerHtml }),
      appendToCustomerList({ name, email, phone, source: 'funerals-inquiry', subscribed: 'unknown' }),
    ])
  } catch (err) {
    console.error('Email error (funerals inquiry):', err)
  }

  return NextResponse.json({ ok: true })
}
