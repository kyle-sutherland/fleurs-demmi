import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import type { SquareError } from 'square'

export function sanitizeSubject(name: string): string {
  return name.replace(/[\r\n]/g, ' ').slice(0, 100)
}

export function extractBalanceCents(err: SquareError): number {
  const insufficientErr = err.errors?.find(
    (e) => e.code === 'INSUFFICIENT_FUNDS' || e.code === 'GIFT_CARD_BALANCE_INSUFFICIENT',
  )
  if (!insufficientErr) return 0
  const fromDetail = (insufficientErr as { detail?: string }).detail?.match(/(\d+)/)?.[1]
  const fromField = (insufficientErr as { field?: string }).field?.match(/(\d+)/)?.[1]
  const raw = fromDetail ?? fromField
  if (!raw) {
    console.error('extractBalanceCents: could not parse balance from Square error', insufficientErr)
    return 0
  }
  return Number(raw)
}

export async function sendMail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string
  subject: string
  html: string
  attachments?: Mail.Attachment[]
}) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.WEBMASTER_EMAIL,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
    },
  })

  await transporter.sendMail({
    from: `Fleurs d'Emmi <${process.env.WEBMASTER_EMAIL}>`,
    to,
    subject,
    html,
    ...(attachments?.length ? { attachments } : {}),
  })
}
