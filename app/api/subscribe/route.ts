import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json()

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

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
