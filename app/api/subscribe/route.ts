import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { emailSchema, nameSchema } from '@/app/lib/validate'
import { verifyTurnstile } from '@/app/lib/turnstile'
import { appendToCustomerList } from '@/app/lib/sheets'

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
    await appendToCustomerList({ name, email, source: 'subscribed', subscribed: 'subscribed' })
    return NextResponse.json({ message: 'Subscribed!' })
  } catch (err) {
    console.error('Subscribe error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
