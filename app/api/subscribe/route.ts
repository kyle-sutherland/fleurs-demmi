import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { google } from 'googleapis'
import { emailSchema, nameSchema } from '@/app/lib/validate'
import { verifyTurnstile } from '@/app/lib/turnstile'

const bodySchema = z.object({
  email:     emailSchema,
  name:      nameSchema.optional(),
  turnstile: z.string().optional(),
  website:   z.string().max(0, 'Honeypot').optional(),
})

export async function POST(req: NextRequest) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  if (body.website) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? undefined
  if (!await verifyTurnstile(body.turnstile, ip)) {
    return NextResponse.json({ error: 'Bot verification failed. Please try again.' }, { status: 403 })
  }

  const { name, email } = body

  try {
    const auth = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    )
    auth.setCredentials({ refresh_token: process.env.REFRESH_TOKEN })

    const sheets = google.sheets({ version: 'v4', auth })

    const now = new Date()
    const date = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getFullYear()}`

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SUBSCRIBERS_SHEET_ID,
      range: 'Sheet1!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[name ?? '', email, 'subscribed', date]],
      },
    })

    return NextResponse.json({ message: 'Subscribed!' })
  } catch (err) {
    console.error('Subscribe error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
