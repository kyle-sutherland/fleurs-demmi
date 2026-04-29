/**
 * Sends one owner email + one customer email for every email permutation,
 * all addressed to RECIPIENT_EMAIL so Emily can review them.
 *
 * Run: npx tsx scripts/send-test-emails.ts
 */

import * as fs from 'fs'

const envLines = fs.readFileSync('.env.local', 'utf-8').split('\n')
for (const line of envLines) {
  const eq = line.indexOf('=')
  if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
}

import { sendMail } from '../app/lib/email'

const TO = process.env.RECIPIENT_EMAIL!
const CC = process.env.RECIPIENT_EMAIL!

// ─── shared dummy data ────────────────────────────────────────────────────────

const d = {
  name: 'Test Customer',
  email: 'testcustomer@example.com',
  phone: '514-555-0123',
  orderId: 'TEST-ORDER-00X',
  address: '123 Rue Sainte-Catherine O, Montréal, QC H3B 1A7',
  deliveryTime: '2:00 PM',
  totalFormatted: '75.00',
  arrangementNames: ['Spring Bouquet', 'Garden Mix'],
  arrangementPrices: [35.0, 40.0],
  funeralDate: 'May 15, 2026',
  funeralLocation: 'Salon funéraire Smith, 456 Rue Principale, Montréal',
  weddingDate: 'September 20, 2026',
  weddingLocation: 'Jardin botanique de Montréal',
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function tag(label: string) {
  return `<p style="font-family:monospace;font-size:11px;color:#999;border:1px dashed #ccc;padding:4px 8px;margin-bottom:16px">TEST EMAIL — ${label}</p>`
}

async function send(label: string, ownerHtml: string, customerHtml: string) {
  const subject = `[TEST] ${label}`
  console.log(`Sending: ${label}`)
  await sendMail({ to: TO, subject: `${subject} — owner`, html: tag(`OWNER — ${label}`) + ownerHtml })
  await sendMail({ to: TO, cc: CC, subject: `${subject} — customer`, html: tag(`CUSTOMER — ${label}`) + customerHtml })
  console.log(`  ✓ sent`)
}

// ─── 1. Mother's Day — Pickup ─────────────────────────────────────────────────

const mdPickupOwner = `
  <h2 style="font-family:sans-serif">New Mother's Day Order — ${d.name}</h2>
  <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.name}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><a href="mailto:${d.email}">${d.email}</a></td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Phone</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.phone}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">Pick up — May 9th, Mile End</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Items</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.arrangementNames.join('<br/>')}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Total Paid</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:700">$${d.totalFormatted} CAD</td></tr>
    <tr><td style="padding:6px 12px;font-weight:600">Square Order ID</td><td style="padding:6px 12px">${d.orderId}</td></tr>
  </table>
`

const mdPickupCustomer = `
  <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
    <h1 style="font-size:24px;font-weight:900;margin-bottom:16px">Order Confirmed</h1>
    <p style="font-size:15px;line-height:1.6;color:#333">
      Thank you so much for your purchase with Fleurs D&#8217;Emmi.
    </p>
    <p style="font-size:15px;line-height:1.6;color:#333">
      Your flowers will be available for pick up on Saturday May 9th at 59 Bernard Ouest between 10am&#8211;5pm.
    </p>
    <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Order Summary</h2>
    <table style="font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.arrangementNames[0]}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${d.arrangementPrices[0].toFixed(2)}</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.arrangementNames[1]}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${d.arrangementPrices[1].toFixed(2)}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${d.totalFormatted} CAD</td></tr>
    </table>
    <p style="font-size:15px;line-height:1.6;color:#333;margin-top:32px">
      Always remember to keep the flowers out of direct sunlight and submerged in water. Snip the ends of the stems every few days and refresh the water in order to prolong their vase life.
    </p>
    <p style="font-size:15px;line-height:1.6;color:#333">
      Please contact <a href="mailto:fleursdemmi@gmail.com">fleursdemmi@gmail.com</a> if you have any questions or concerns related to your order.
    </p>
    <p style="font-size:12px;color:#aaa;margin-top:32px">Order ref: ${d.orderId}</p>
    <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
  </div>
`

// ─── 2. Mother's Day — Delivery ───────────────────────────────────────────────

const mdDeliveryOwner = `
  <h2 style="font-family:sans-serif">New Mother's Day Order — ${d.name}</h2>
  <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.name}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><a href="mailto:${d.email}">${d.email}</a></td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Phone</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.phone}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">Delivery — May 10th</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Address</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.address} · ${d.deliveryTime}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Items</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.arrangementNames.join('<br/>')}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Card</td><td style="padding:6px 12px;border-bottom:1px solid #eee">To: Maman<br/>Happy Mother's Day! Love you.</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Total Paid</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:700">$${d.totalFormatted} CAD</td></tr>
    <tr><td style="padding:6px 12px;font-weight:600">Square Order ID</td><td style="padding:6px 12px">${d.orderId}</td></tr>
  </table>
`

const mdDeliveryCustomer = `
  <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
    <h1 style="font-size:24px;font-weight:900;margin-bottom:16px">Order Confirmed</h1>
    <p style="font-size:15px;line-height:1.6;color:#333">
      Thank you so much for your purchase with Fleurs D&#8217;Emmi.
    </p>
    <p style="font-size:15px;line-height:1.6;color:#333">
      Your flowers will be delivered to ${d.address} on Sunday May 10th at ${d.deliveryTime}.
    </p>
    <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Order Summary</h2>
    <table style="font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.arrangementNames[0]}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${d.arrangementPrices[0].toFixed(2)}</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.arrangementNames[1]}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${d.arrangementPrices[1].toFixed(2)}</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Delivery &#8212; May 10th</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$10.00</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Greeting Card</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$4.00</td></tr>
      <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${d.totalFormatted} CAD</td></tr>
    </table>
    <p style="font-size:15px;line-height:1.6;color:#333;margin-top:32px">
      Always remember to keep the flowers out of direct sunlight and submerged in water. Snip the ends of the stems every few days and refresh the water in order to prolong their vase life.
    </p>
    <p style="font-size:15px;line-height:1.6;color:#333">
      Please contact <a href="mailto:fleursdemmi@gmail.com">fleursdemmi@gmail.com</a> if you have any questions or concerns related to your order.
    </p>
    <p style="font-size:12px;color:#aaa;margin-top:32px">Order ref: ${d.orderId}</p>
    <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
  </div>
`

// ─── 3. Subscription — Pickup ─────────────────────────────────────────────────

const subPickupOwner = `
  <h2 style="font-family:sans-serif">New shop order — ${d.name}</h2>
  <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.name}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><a href="mailto:${d.email}">${d.email}</a></td></tr>
  </table>
  <h3 style="font-family:sans-serif;margin-top:24px">Items</h3>
  <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Monthly Bouquet Subscription × 1</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${d.totalFormatted}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${d.totalFormatted} CAD</td></tr>
  </table>
  <p style="font-family:sans-serif;font-size:13px;color:#888;margin-top:16px">Order ID: ${d.orderId}</p>
`

const subPickupCustomer = `
  <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
    <h1 style="font-size:24px;font-weight:900;margin-bottom:16px">Order Confirmed</h1>
    <p style="font-size:15px;line-height:1.6;color:#333">
      Thank you so much for your purchase of a Fleurs D&#8217;Emmi floral subscription!
    </p>
    <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Order Summary</h2>
    <table style="font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Monthly Bouquet Subscription × 1</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${d.totalFormatted}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${d.totalFormatted} CAD</td></tr>
    </table>
    <p style="font-size:15px;line-height:1.6;color:#333;margin-top:24px">
      Your bouquets will be available for pick up on Saturdays at either location:
    </p>
    <ul style="font-size:15px;line-height:1.8;color:#333;padding-left:20px">
      <li>Caf&#233; Replika &#8212; 252 Rue Rachel E, Montr&#233;al (11am&#8211;6pm)</li>
      <li>D&#233;panneur Le Pick-Up &#8212; 7032 Rue Waverly (11am&#8211;4pm)</li>
    </ul>
    <p style="font-size:15px;line-height:1.6;color:#333">
      Just come in and speak to one of the baristas to let them know your name, and you can pick up your very own seasonal bouquet &#10047;
    </p>
    <p style="font-size:15px;line-height:1.6;color:#333">
      If you are unable to pick up on certain dates and would like to request delivery, please contact <a href="mailto:fleursdemmi@gmail.com">fleursdemmi@gmail.com</a> in advance (there is an additional $10 delivery fee).
    </p>
    <p style="font-size:15px;line-height:1.6;color:#333;margin-top:24px">
      <strong>Mark the calendar!</strong> Your bouquets will be prepared for the following dates:<br/>
      May 23 &middot; June 6 &middot; June 20 &middot; July 4 &middot; July 18 &middot; August 1 &middot; August 15 &middot; August 29 &middot; September 12 &middot; September 26 &middot; October 10 &middot; October 24
    </p>
    <p style="font-size:15px;line-height:1.6;color:#333">
      If you need to cancel a bouquet, you must give at least 1 week notice and you will be refunded 75% of the bouquet price.
    </p>
    <p style="font-size:15px;line-height:1.6;color:#333">
      Always remember to keep the flowers out of direct sunlight and submerged in water. Snip the ends of the stems every few days and refresh the water in order to prolong their vase life.
    </p>
    <p style="font-size:15px;line-height:1.6;color:#333">
      Please contact <a href="mailto:fleursdemmi@gmail.com">fleursdemmi@gmail.com</a> if you have any questions or concerns.
    </p>
    <p style="font-size:12px;color:#aaa;margin-top:32px">Order ref: ${d.orderId}</p>
    <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
  </div>
`

// ─── 4. Subscription — Delivery ───────────────────────────────────────────────

const subDeliveryOwner = subPickupOwner.replace('Monthly Bouquet Subscription × 1', 'Monthly Bouquet Subscription × 1 (delivery)')

const subDeliveryCustomer = `
  <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
    <h1 style="font-size:24px;font-weight:900;margin-bottom:16px">Order Confirmed</h1>
    <p style="font-size:15px;line-height:1.6;color:#333">
      Thank you so much for your purchase of a Fleurs D&#8217;Emmi floral subscription!
    </p>
    <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Order Summary</h2>
    <table style="font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Monthly Bouquet Subscription × 1</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${d.totalFormatted}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${d.totalFormatted} CAD</td></tr>
    </table>
    <p style="font-size:15px;line-height:1.6;color:#333;margin-top:24px">
      Your bouquets will be delivered to ${d.address}.<br/>
      Please contact <a href="mailto:fleursdemmi@gmail.com">fleursdemmi@gmail.com</a> if you have any special instructions for deliveries.
    </p>
    <p style="font-size:15px;line-height:1.6;color:#333;margin-top:24px">
      <strong>Mark the calendar!</strong> Your bouquets will be prepared for the following dates:<br/>
      May 23 &middot; June 6 &middot; June 20 &middot; July 4 &middot; July 18 &middot; August 1 &middot; August 15 &middot; August 29 &middot; September 12 &middot; September 26 &middot; October 10 &middot; October 24
    </p>
    <p style="font-size:15px;line-height:1.6;color:#333">
      If you need to cancel a bouquet, you must give at least 1 week notice and you will be refunded 75% of the bouquet price.
    </p>
    <p style="font-size:15px;line-height:1.6;color:#333">
      Always remember to keep the flowers out of direct sunlight and submerged in water. Snip the ends of the stems every few days and refresh the water in order to prolong their vase life.
    </p>
    <p style="font-size:15px;line-height:1.6;color:#333">
      Please contact <a href="mailto:fleursdemmi@gmail.com">fleursdemmi@gmail.com</a> if you have any questions or concerns.
    </p>
    <p style="font-size:12px;color:#aaa;margin-top:32px">Order ref: ${d.orderId}</p>
    <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
  </div>
`

// ─── 5. Generic shop — Pickup ─────────────────────────────────────────────────

const shopPickupOwner = `
  <h2 style="font-family:sans-serif">New shop order — ${d.name}</h2>
  <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.name}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><a href="mailto:${d.email}">${d.email}</a></td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Pickup time</td><td style="padding:6px 12px;border-bottom:1px solid #eee">Saturday, May 17, 10:00 AM &#8212; Mile End</td></tr>
  </table>
  <h3 style="font-family:sans-serif;margin-top:24px">Items</h3>
  <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Medium Glass Vase × 1</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${d.totalFormatted}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${d.totalFormatted} CAD</td></tr>
  </table>
  <p style="font-family:sans-serif;font-size:13px;color:#888;margin-top:16px">Order ID: ${d.orderId}</p>
`

const shopPickupCustomer = `
  <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a;padding-bottom:32px;border-bottom:2px solid #eee;margin-bottom:32px">
    <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Commande confirm&#233;e</h1>
    <p style="font-size:15px;line-height:1.6;color:#444">
      Merci, ${d.name}&nbsp;! Votre commande a &#233;t&#233; re&#231;ue et votre paiement est confirm&#233;. Votre cueillette est pr&#233;vue le samedi 17 mai, 10 h 00 &#8212; Mile End.
    </p>
    <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">R&#233;sum&#233; de la commande</h2>
    <table style="font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Vase en verre moyen × 1</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${d.totalFormatted}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${d.totalFormatted} CAD</td></tr>
    </table>
    <p style="font-size:12px;color:#aaa;margin-top:32px">R&#233;f&#233;rence&nbsp;: ${d.orderId}</p>
    <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
  </div>
  <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
    <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Order confirmed</h1>
    <p style="font-size:15px;line-height:1.6;color:#444">
      Thank you, ${d.name}! Your order has been received and your payment is confirmed. Your pickup is booked for Saturday, May 17, 10:00 AM &#8212; Mile End.
    </p>
    <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Order Summary</h2>
    <table style="font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Medium Glass Vase × 1</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${d.totalFormatted}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${d.totalFormatted} CAD</td></tr>
    </table>
    <p style="font-size:12px;color:#aaa;margin-top:32px">Order ref: ${d.orderId}</p>
    <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
  </div>
`

// ─── 6. Generic shop — Delivery ───────────────────────────────────────────────

const shopDeliveryOwner = `
  <h2 style="font-family:sans-serif">New shop order — ${d.name}</h2>
  <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.name}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><a href="mailto:${d.email}">${d.email}</a></td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Delivery address</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.address}</td></tr>
  </table>
  <h3 style="font-family:sans-serif;margin-top:24px">Items</h3>
  <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Medium Glass Vase × 1</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${d.totalFormatted}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${d.totalFormatted} CAD</td></tr>
  </table>
  <p style="font-family:sans-serif;font-size:13px;color:#888;margin-top:16px">Order ID: ${d.orderId}</p>
`

const shopDeliveryCustomer = `
  <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a;padding-bottom:32px;border-bottom:2px solid #eee;margin-bottom:32px">
    <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Commande confirm&#233;e</h1>
    <p style="font-size:15px;line-height:1.6;color:#444">
      Merci, ${d.name}&nbsp;! Votre commande a &#233;t&#233; re&#231;ue et votre paiement est confirm&#233;. Livraison &#224;&nbsp;: ${d.address}.
    </p>
    <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">R&#233;sum&#233; de la commande</h2>
    <table style="font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Vase en verre moyen × 1</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${d.totalFormatted}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${d.totalFormatted} CAD</td></tr>
    </table>
    <p style="font-size:12px;color:#aaa;margin-top:32px">R&#233;f&#233;rence&nbsp;: ${d.orderId}</p>
    <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
  </div>
  <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
    <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Order confirmed</h1>
    <p style="font-size:15px;line-height:1.6;color:#444">
      Thank you, ${d.name}! Your order has been received and your payment is confirmed. Delivery to: ${d.address}.
    </p>
    <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Order Summary</h2>
    <table style="font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Medium Glass Vase × 1</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${d.totalFormatted}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${d.totalFormatted} CAD</td></tr>
    </table>
    <p style="font-size:12px;color:#aaa;margin-top:32px">Order ref: ${d.orderId}</p>
    <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
  </div>
`

// ─── 7. Funerals checkout ─────────────────────────────────────────────────────

const funeralsCheckoutOwner = `
  <h2 style="font-family:sans-serif">New Sympathy Order — ${d.name}</h2>
  <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.name}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><a href="mailto:${d.email}">${d.email}</a></td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Phone</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.phone}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Funeral Date</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.funeralDate}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Location</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.funeralLocation}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">delivery</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Arrangement</td><td style="padding:6px 12px;border-bottom:1px solid #eee">White Peace Arrangement — $${d.totalFormatted}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Card</td><td style="padding:6px 12px;border-bottom:1px solid #eee">To: The Smith Family<br/>Our deepest condolences.</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Total Paid</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:700">$${d.totalFormatted} CAD</td></tr>
    <tr><td style="padding:6px 12px;font-weight:600">Square Order ID</td><td style="padding:6px 12px">${d.orderId}</td></tr>
  </table>
`

const funeralsCheckoutCustomer = `
  <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a;padding-bottom:32px;border-bottom:2px solid #eee;margin-bottom:32px">
    <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Commande confirm&#233;e</h1>
    <p style="font-size:15px;line-height:1.6;color:#444">
      Merci, ${d.name}. Votre commande a &#233;t&#233; re&#231;ue et votre paiement est confirm&#233;. Emmi vous contactera sous peu pour les d&#233;tails.
    </p>
    <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">R&#233;sum&#233; de la commande</h2>
    <table style="font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">Arrangement paix blanche</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${d.totalFormatted}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${d.totalFormatted} CAD</td></tr>
    </table>
    <p style="font-size:12px;color:#aaa;margin-top:32px">R&#233;f&#233;rence&nbsp;: ${d.orderId}</p>
    <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
  </div>
  <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
    <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Order confirmed</h1>
    <p style="font-size:15px;line-height:1.6;color:#444">
      Thank you, ${d.name}. Your order has been received and your payment is confirmed. Emmi will be in touch soon with pickup or delivery details.
    </p>
    <h2 style="font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Order Summary</h2>
    <table style="font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee">White Peace Arrangement</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">$${d.totalFormatted}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:700">Total</td><td style="padding:6px 12px;font-weight:700;text-align:right">$${d.totalFormatted} CAD</td></tr>
    </table>
    <table style="font-size:14px;border-collapse:collapse;width:100%;margin-top:24px">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Funeral Date</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.funeralDate}</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">delivery</td></tr>
    </table>
    <p style="font-size:12px;color:#aaa;margin-top:32px">Order ref: ${d.orderId}</p>
    <p style="font-size:13px;color:#888;margin-top:4px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
  </div>
`

// ─── 8. Wedding inquiry ───────────────────────────────────────────────────────

const weddingInquiryOwner = `
  <h2 style="font-family:sans-serif">New Wedding Inquiry — ${d.name}</h2>
  <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.name}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><a href="mailto:${d.email}">${d.email}</a></td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Phone</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.phone}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Event Date</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.weddingDate}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">delivery</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Event Location</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.weddingLocation}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Guest Count</td><td style="padding:6px 12px;border-bottom:1px solid #eee">80</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Selected Items</td><td style="padding:6px 12px;border-bottom:1px solid #eee">Bridal bouquet<br/>Table centrepieces (×8)<br/>Boutonnières (×4)</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Style Notes</td><td style="padding:6px 12px;border-bottom:1px solid #eee">Soft pinks and whites, romantic garden style</td></tr>
  </table>
`

const weddingInquiryCustomer = `
  <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a;padding-bottom:32px;border-bottom:2px solid #eee;margin-bottom:32px">
    <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Demande re&#231;ue&nbsp;!</h1>
    <p style="font-size:15px;line-height:1.6;color:#444">
      Merci, ${d.name}&nbsp;! Emmi a bien re&#231;u votre demande de devis pour mariage &amp; &#233;v&#233;nements et vous contactera sous peu.
    </p>
    <table style="font-size:14px;border-collapse:collapse;width:100%;margin-top:16px">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Date de l&#39;&#233;v&#233;nement</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.weddingDate}</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Mode de r&#233;ception</td><td style="padding:6px 12px;border-bottom:1px solid #eee">delivery</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Lieu de l&#39;&#233;v&#233;nement</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.weddingLocation}</td></tr>
    </table>
    <p style="font-size:13px;color:#888;margin-top:32px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
  </div>
  <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
    <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Inquiry received!</h1>
    <p style="font-size:15px;line-height:1.6;color:#444">
      Thank you, ${d.name}! Emmi has received your wedding &amp; events inquiry and will be in touch shortly to discuss your vision and provide a custom quote.
    </p>
    <table style="font-size:14px;border-collapse:collapse;width:100%;margin-top:16px">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Event Date</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.weddingDate}</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">delivery</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Event Location</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.weddingLocation}</td></tr>
    </table>
    <p style="font-size:13px;color:#888;margin-top:32px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
  </div>
`

// ─── 9. Funeral inquiry ───────────────────────────────────────────────────────

const funeralInquiryOwner = `
  <h2 style="font-family:sans-serif">New Funeral / Sympathy Inquiry — ${d.name}</h2>
  <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.name}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><a href="mailto:${d.email}">${d.email}</a></td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Phone</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.phone}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Funeral Date</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.funeralDate}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">delivery</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Funeral Location</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.funeralLocation}</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Arrangement Interest</td><td style="padding:6px 12px;border-bottom:1px solid #eee">Casket spray</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Style Notes</td><td style="padding:6px 12px;border-bottom:1px solid #eee">White and soft yellow, elegant</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Card Recipient</td><td style="padding:6px 12px;border-bottom:1px solid #eee">The Johnson Family</td></tr>
    <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Card Message</td><td style="padding:6px 12px;border-bottom:1px solid #eee">In loving memory.</td></tr>
  </table>
`

const funeralInquiryCustomer = `
  <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a;padding-bottom:32px;border-bottom:2px solid #eee;margin-bottom:32px">
    <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Demande re&#231;ue</h1>
    <p style="font-size:15px;line-height:1.6;color:#444">
      Merci, ${d.name}. Emmi a bien re&#231;u votre demande d&#39;arrangement de condol&#233;ances et vous contactera sous peu.
    </p>
    <table style="font-size:14px;border-collapse:collapse;width:100%;margin-top:16px">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Date des fun&#233;railles</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.funeralDate}</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Mode de r&#233;ception</td><td style="padding:6px 12px;border-bottom:1px solid #eee">delivery</td></tr>
    </table>
    <p style="font-size:13px;color:#888;margin-top:32px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
  </div>
  <div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
    <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Inquiry received</h1>
    <p style="font-size:15px;line-height:1.6;color:#444">
      Thank you, ${d.name}. Emmi has received your sympathy arrangement inquiry and will be in touch shortly to discuss the details.
    </p>
    <table style="font-size:14px;border-collapse:collapse;width:100%;margin-top:16px">
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px">Funeral Date</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${d.funeralDate}</td></tr>
      <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">Fulfillment</td><td style="padding:6px 12px;border-bottom:1px solid #eee">delivery</td></tr>
    </table>
    <p style="font-size:13px;color:#888;margin-top:32px">Fleurs d&#39;Emmi &middot; Montr&#233;al, QC</p>
  </div>
`

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Sending test emails to ${TO}\n`)

  await send("Mother's Day — Pickup",       mdPickupOwner,            mdPickupCustomer)
  await send("Mother's Day — Delivery",     mdDeliveryOwner,          mdDeliveryCustomer)
  await send('Subscription — Pickup',       subPickupOwner,           subPickupCustomer)
  await send('Subscription — Delivery',     subDeliveryOwner,         subDeliveryCustomer)
  await send('Shop (generic) — Pickup',     shopPickupOwner,          shopPickupCustomer)
  await send('Shop (generic) — Delivery',   shopDeliveryOwner,        shopDeliveryCustomer)
  await send('Funerals checkout',           funeralsCheckoutOwner,    funeralsCheckoutCustomer)
  await send('Wedding inquiry',             weddingInquiryOwner,      weddingInquiryCustomer)
  await send('Funeral inquiry',             funeralInquiryOwner,      funeralInquiryCustomer)

  console.log('\nDone — 18 emails sent (owner + customer for each of 9 permutations).')
}

main().catch((err) => { console.error(err); process.exit(1) })
