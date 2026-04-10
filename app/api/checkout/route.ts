import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { SquareClient, SquareEnvironment, SquareError } from 'square'
import { parseCart, serializeCart, cartTotal } from '@/app/lib/cart'

const COOKIE_NAME = 'cart'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const cart = parseCart(cookieStore.get(COOKIE_NAME)?.value)

  if (cart.items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const { token, email } = await request.json()

  const totalCents = Math.round(cartTotal(cart) * 100)

  const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment:
      process.env.SQUARE_ENVIRONMENT === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
  })

  try {
    const response = await client.payments.create({
      sourceId: token,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(totalCents),
        currency: 'CAD',
      },
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
      buyerEmailAddress: email,
      note: `Fleurs d'Emmi — ${cart.items.map((i) => i.name).join(', ')}`,
    })

    const res = NextResponse.json({ orderId: response.payment?.id })
    res.cookies.set(COOKIE_NAME, serializeCart({ items: [] }), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      httpOnly: false,
    })
    return res
  } catch (err: unknown) {
    if (err instanceof SquareError) {
      const message = err.errors?.[0]?.detail ?? 'Payment failed. Please try again.'
      return NextResponse.json({ error: message }, { status: 402 })
    }
    return NextResponse.json({ error: 'Payment failed. Please try again.' }, { status: 500 })
  }
}
