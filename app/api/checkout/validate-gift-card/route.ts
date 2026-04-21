import { NextResponse } from 'next/server'
import { z } from 'zod'
import { SquareError } from 'square'
import { getSquareClient } from '@/app/lib/square'

const bodySchema = z.object({
  gan:     z.string().min(1).max(255),
  website: z.string().max(0, 'Honeypot').optional(),
})

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid request.' }, { status: 400 })
  }

  if (body.website) {
    return NextResponse.json({ valid: false, error: 'Invalid request.' }, { status: 400 })
  }

  const client = getSquareClient()

  try {
    const res = await client.giftCards.getFromGan({ gan: body.gan })
    const gc = res.giftCard

    if (!gc || gc.state !== 'ACTIVE') {
      return NextResponse.json({ valid: false, error: 'Gift card not found or is not active.' })
    }

    const balanceCents = Number(gc.balanceMoney?.amount ?? 0)
    if (balanceCents <= 0) {
      return NextResponse.json({ valid: false, error: 'Gift card has no remaining balance.' })
    }

    return NextResponse.json({
      valid: true,
      balance: balanceCents / 100,
      giftCardId: gc.id,
    })
  } catch (err) {
    if (err instanceof SquareError) {
      return NextResponse.json({ valid: false, error: 'Gift card not found or has no balance.' })
    }
    console.error('Gift card validation error:', err)
    return NextResponse.json({ valid: false, error: 'Could not validate gift card. Please try again.' }, { status: 500 })
  }
}
