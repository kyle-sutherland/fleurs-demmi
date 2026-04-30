import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { emailSchema } from '@/app/lib/validate'
import { verifyTurnstile } from '@/app/lib/turnstile'
import { enforceRateLimit } from '@/app/lib/rateLimit'
import { upsertSquareCustomer } from '@/app/lib/squareCustomers'

const bodySchema = z.object({
  email:     emailSchema,
  name:      z.string().max(200).trim().optional(),
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

  const rateLimited = await enforceRateLimit(req, 'subscribe')
  if (rateLimited) return rateLimited

  if (body.website) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
  if (!await verifyTurnstile(body.turnstile, ip)) {
    return NextResponse.json({ error: 'Bot verification failed. Please try again.' }, { status: 403 })
  }

  const { name, email } = body

  await upsertSquareCustomer({ name, email, source: 'subscribed', subscribed: 'subscribed', isOrder: false })
  return NextResponse.json({ message: 'Subscribed!' })
}
