import { google } from 'googleapis'

export type CustomerRow = {
  name?: string
  email?: string
  phone?: string
  postalCode?: string
  source: string   // e.g. 'checkout', 'mothers-day', 'funerals', 'weddings-inquiry'
  notes?: string
  subscribed?: 'subscribed' | 'unsubscribed' | 'unknown'
}

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  )
  auth.setCredentials({ refresh_token: process.env.REFRESH_TOKEN })
  return auth
}

function formatDate(): string {
  const now = new Date()
  return `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getFullYear()}`
}

export async function appendToCustomerList(row: CustomerRow): Promise<void> {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() })
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SUBSCRIBERS_SHEET_ID,
    range: 'Sheet1!A:H',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        row.name ?? '',
        row.email ?? '',
        row.phone ?? '',
        row.postalCode ?? '',
        row.source,
        row.notes ?? '',
        formatDate(),
        row.subscribed ?? 'unknown',
      ]],
    },
  })
}
