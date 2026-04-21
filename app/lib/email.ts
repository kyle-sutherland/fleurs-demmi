import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'

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
