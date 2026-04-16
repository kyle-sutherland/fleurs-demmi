import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { SquareError } from 'square'
import { parseCart, serializeCart, cartTotal } from '@/app/lib/cart'
import { getSquareClient, LOCATION_ID, PRODUCT_VARIATION_MAP } from '@/app/lib/square'

const COOKIE_NAME = 'cart'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const cart = parseCart(cookieStore.get(COOKIE_NAME)?.value)

  if (cart.items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const { token, email, name } = await request.json()
  const client = getSquareClient()

  try {
    // Build order line items, splitting into catalog and custom line items
    const lineItems = cart.items.map((item) => {
      const variationId = PRODUCT_VARIATION_MAP[item.productId]

      if (variationId) {
        // Catalog item — Square will pull name and price from the catalog
        return {
          quantity: String(item.quantity),
          catalogObjectId: variationId,
          ...(Object.keys(item.options ?? {}).length > 0 && {
            note: Object.entries(item.options!)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', '),
          }),
        }
      }

      // Non-catalog item (e.g. delivery surcharge, custom upgrade) — use ad-hoc line item
      return {
        quantity: String(item.quantity),
        name: item.name,
        basePriceMoney: {
          amount: BigInt(Math.round(item.price * 100)),
          currency: 'CAD' as const,
        },
        ...(Object.keys(item.options ?? {}).length > 0 && {
          note: Object.entries(item.options!)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', '),
        }),
      }
    })

    // Step 1: Create the order
    const orderResponse = await client.orders.create({
      order: {
        locationId: LOCATION_ID,
        lineItems,
      },
      idempotencyKey: randomUUID(),
    })

    const order = orderResponse.order
    if (!order?.id) {
      return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 })
    }

    // Step 2: Verify order total matches cart total (sanity check)
    const orderTotalCents = Number(order.totalMoney?.amount ?? 0)
    const cartTotalCents = Math.round(cartTotal(cart) * 100)

    // Allow a small tolerance for floating point; if they diverge significantly something is wrong
    if (Math.abs(orderTotalCents - cartTotalCents) > 5) {
      console.error(
        `Order total mismatch: Square=${orderTotalCents} cart=${cartTotalCents} orderId=${order.id}`
      )
    }

    // Step 3: Charge the payment against the order
    const paymentResponse = await client.payments.create({
      sourceId: token,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(orderTotalCents || cartTotalCents),
        currency: 'CAD',
      },
      orderId: order.id,
      locationId: LOCATION_ID,
      buyerEmailAddress: email ?? undefined,
    })

    const payment = paymentResponse.payment
    if (!payment?.id) {
      return NextResponse.json({ error: 'Payment failed. Please try again.' }, { status: 402 })
    }

    // Step 4: Clear the cart cookie
    const res = NextResponse.json({ orderId: order.id, paymentId: payment.id })
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
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Payment failed. Please try again.' }, { status: 500 })
  }
}
