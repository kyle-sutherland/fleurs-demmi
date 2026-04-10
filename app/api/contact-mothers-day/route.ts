import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { google } from 'googleapis'

const OAuth2 = google.auth.OAuth2
const client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
)
client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name, email, phone, fulfillment, address, delivery_time,
      bouquet_style, custom_bouquet, style_notes, card_to, card_message,
    } = body

    const { token: accessToken } = await client.getAccessToken()

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.WEBMASTER_EMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken || '',
      },
    })

    const lines = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Fulfillment: ${fulfillment}`,
      fulfillment === 'delivery' && address ? `Delivery Address: ${address}` : null,
      fulfillment === 'delivery' && delivery_time ? `Preferred Delivery Time: ${delivery_time}` : null,
      `$60 Bouquet Style: ${bouquet_style}`,
      custom_bouquet ? `Custom Bouquet: $${custom_bouquet}` : null,
      style_notes ? `Style/Colour Notes: ${style_notes}` : null,
      card_to ? `Card To: ${card_to}` : null,
      card_message ? `Card Message: ${card_message}` : null,
    ].filter(Boolean)

    await transporter.sendMail({
      from: process.env.WEBMASTER_EMAIL,
      to: process.env.RECIPIENT_EMAIL,
      subject: `Mother's Day Order — ${name}`,
      text: lines.join('\n'),
    })

    return NextResponse.json({ message: 'Order submitted successfully!' })
  } catch (err) {
    console.error('Email error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
