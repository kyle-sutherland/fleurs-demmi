import { NextResponse } from 'next/server'
import { z } from 'zod'
import { searchPickupAvailability } from '@/app/lib/appointments'

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start') ?? ''
  const end = searchParams.get('end') ?? ''

  if (!dateSchema.safeParse(start).success || !dateSchema.safeParse(end).success) {
    return NextResponse.json({ error: 'Invalid date parameters.' }, { status: 400 })
  }

  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  const diffDays = (endMs - startMs) / (1000 * 60 * 60 * 24)

  if (diffDays < 0 || diffDays > 14) {
    return NextResponse.json({ error: 'Date window must be between 0 and 14 days.' }, { status: 400 })
  }

  try {
    const slots = await searchPickupAvailability(start, end)
    return NextResponse.json(slots)
  } catch (err) {
    console.error('Availability fetch error:', err)
    return NextResponse.json({ error: 'Could not load availability.' }, { status: 500 })
  }
}
