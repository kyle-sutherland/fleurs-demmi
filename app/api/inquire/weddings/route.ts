import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendMail } from '@/app/lib/email'
import { escapeHtml, emailSchema, nameSchema, phoneSchema, dateSchema, textSchema } from '@/app/lib/validate'
import { verifyTurnstile } from '@/app/lib/turnstile'
import { enforceRateLimit } from '@/app/lib/rateLimit'
import { upsertSquareCustomer } from '@/app/lib/squareCustomers'

const bodySchema = z.object({
  name:           nameSchema,
  email:          emailSchema,
  phone:          phoneSchema,
  event_date:     dateSchema,
  fulfillment:    z.union([z.string(), z.array(z.string())]).optional(),
  event_location: textSchema.optional(),
  guest_count:    textSchema.optional(),
  items:          z.union([z.string(), z.array(z.string())]).optional(),
  style_notes:        textSchema.optional(),
  additional:         textSchema.optional(),
  subscribe_to_news:  z.boolean().optional(),
  turnstile:          z.string().optional(),
  website:            z.string().max(0, 'Honeypot').optional(),
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

  const { name, email, phone, event_date, fulfillment, event_location, guest_count, items, style_notes, additional, subscribe_to_news } = body

  const sName     = escapeHtml(name)
  const sEmail    = escapeHtml(email)
  const sPhone    = escapeHtml(phone)
  const sDate     = escapeHtml(event_date)
  const sLoc      = event_location ? escapeHtml(event_location) : ''
  const sGuests   = guest_count ? escapeHtml(guest_count) : ''
  const sNotes    = style_notes ? escapeHtml(style_notes) : ''
  const sAdditional = additional ? escapeHtml(additional) : ''

  const itemList        = (Array.isArray(items) ? items : items ? [items] : []).map(escapeHtml)
  const fulfillmentList = (Array.isArray(fulfillment) ? fulfillment : fulfillment ? [fulfillment] : []).map(escapeHtml)

  const ownerHtml = `
    <h2 style="font-family:sans-serif">New Wedding Inquiry — ${sName}</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sName}</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><a href="mailto:${sEmail}">${sEmail}</a></td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Phone</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sPhone}</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Event Date</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sDate}</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${fulfillmentList.join(', ') || '—'}</td></tr>
      ${sLoc ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Event Location</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sLoc}</td></tr>` : ''}
      ${sGuests ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Guest Count</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sGuests}</td></tr>` : ''}
      ${itemList.length > 0 ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Selected Items</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${itemList.join('<br/>')}</td></tr>` : ''}
      ${sNotes ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Style Notes</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sNotes}</td></tr>` : ''}
      ${sAdditional ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Additional Info</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sAdditional}</td></tr>` : ''}
    </table>
  `

  const customerHtml = `
    <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a;padding-bottom:32px;border-bottom:2px solid #eee;margin-bottom:32px">
      <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Demande re&#231;ue&nbsp;!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444">
        Merci, ${sName}&nbsp;! Emmi a bien re&#231;u votre demande de devis pour mariage &amp; &#233;v&#233;nements et vous contactera sous peu pour discuter de votre vision et vous envoyer une soumission personnalis&#233;e.
      </p>
      <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">D&#233;tails de votre demande</h2>
      <table style="font-size:14px;border-collapse:collapse;width:100%">
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Date de l&#39;&#233;v&#233;nement</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sDate}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Mode de r&#233;ception</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${fulfillmentList.join(', ') || '&#8212;'}</td></tr>
        ${sLoc ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Lieu de l&#39;&#233;v&#233;nement</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sLoc}</td></tr>` : ''}
        ${itemList.length > 0 ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Articles d&#39;int&#233;r&#234;t</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${itemList.join('<br/>')}</td></tr>` : ''}
      </table>
      <p style="font-size:13px;color:#888;margin-top:32px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
    </div>
    <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
      <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Inquiry received!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444">
        Thank you, ${sName}! Emmi has received your wedding &amp; events inquiry and will be in touch shortly to discuss your vision and provide a custom quote.
      </p>
      <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Your Inquiry Details</h2>
      <table style="font-size:14px;border-collapse:collapse;width:100%">
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Event Date</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sDate}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${fulfillmentList.join(', ') || '&#8212;'}</td></tr>
        ${sLoc ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Event Location</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${sLoc}</td></tr>` : ''}
        ${itemList.length > 0 ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Items of Interest</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${itemList.join('<br/>')}</td></tr>` : ''}
      </table>
      <p style="font-size:13px;color:#888;margin-top:32px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
    </div>
  `

  try {
    await Promise.all([
      sendMail({ to: process.env.RECIPIENT_EMAIL!, subject: `New wedding inquiry — ${name}`, html: ownerHtml }),
      sendMail({ to: email, cc: process.env.RECIPIENT_EMAIL, subject: `Inquiry received — Fleurs d'Emmi`, html: customerHtml }),
      upsertSquareCustomer({ name, email, phone, source: 'weddings-inquiry', subscribed: subscribe_to_news ? 'subscribed' : 'unknown', isOrder: false }),
    ])
  } catch (err) {
    console.error('Email error (weddings inquiry):', err)
    // Don't fail the request over email — the inquiry was received
  }

  return NextResponse.json({ ok: true })
}
