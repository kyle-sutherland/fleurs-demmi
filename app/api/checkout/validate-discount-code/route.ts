import { NextResponse } from 'next/server'
import { z } from 'zod'
import { SquareError } from 'square'
import { getSquareClient } from '@/app/lib/square'
import { enforceRateLimit } from '@/app/lib/rateLimit'

const bodySchema = z.object({
  code:    z.string().min(1).max(50).trim(),
  website: z.string().max(0, 'Honeypot').optional(),
})

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid request.' }, { status: 400 })
  }

  const rateLimited = await enforceRateLimit(request, 'discount')
  if (rateLimited) return rateLimited

  if (body.website) {
    return NextResponse.json({ valid: false, error: 'Invalid request.' }, { status: 400 })
  }

  const normalizedCode = body.code.toUpperCase()
  const client = getSquareClient()

  try {
    const res = await client.catalog.search({
      objectTypes: ['DISCOUNT'],
      query: {
        exactQuery: {
          attributeName: 'name',
          attributeValue: normalizedCode,
        },
      },
    })

    const obj = res.objects?.[0]
    const disc = obj?.discountData

    if (!obj?.id || !disc) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired discount code.' })
    }

    const discountType = disc.discountType
    if (discountType !== 'FIXED_PERCENTAGE' && discountType !== 'FIXED_AMOUNT') {
      return NextResponse.json({ valid: false, error: 'Invalid or expired discount code.' })
    }

    return NextResponse.json({
      valid: true,
      discountId: obj.id,
      discountType,
      percentage: discountType === 'FIXED_PERCENTAGE' ? disc.percentage : undefined,
      amountCents: discountType === 'FIXED_AMOUNT' ? Number(disc.amountMoney?.amount ?? 0) : undefined,
      label: disc.name,
    })
  } catch (err) {
    if (err instanceof SquareError) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired discount code.' })
    }
    console.error('Discount code validation error:', err)
    return NextResponse.json({ valid: false, error: 'Could not validate discount code. Please try again.' }, { status: 500 })
  }
}
