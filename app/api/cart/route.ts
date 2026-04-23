import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { parseCart, serializeCart, type CartItem } from '@/app/lib/cart'
import { enforceRateLimit } from '@/app/lib/rateLimit'
import { randomUUID } from 'crypto'

const addItemSchema = z.object({
  productId: z.string().min(1).max(128),
  name: z.string().min(1).max(255),
  price: z.number().nonnegative().max(10000),
  quantity: z.number().int().positive().max(50),
  options: z.record(z.string().max(64), z.string().max(255)).optional(),
})

const batchAddSchema = z.object({
  items: z.array(addItemSchema).min(1).max(20),
})

const patchSchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().int().positive().max(50),
})

const deleteSchema = z.object({ id: z.string().uuid() })

const COOKIE_NAME = 'cart'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

async function readCart() {
  const cookieStore = await cookies()
  return parseCart(cookieStore.get(COOKIE_NAME)?.value)
}

function cartResponse(cart: ReturnType<typeof parseCart>) {
  const res = NextResponse.json(cart)
  res.cookies.set(COOKIE_NAME, serializeCart(cart), {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}

export async function GET() {
  const cart = await readCart()
  return NextResponse.json(cart)
}

function applyItem(cart: ReturnType<typeof parseCart>, item: Omit<CartItem, 'id'>) {
  const existing = cart.items.find(
    (i) =>
      i.productId === item.productId &&
      JSON.stringify(i.options ?? {}) === JSON.stringify(item.options ?? {})
  )
  if (existing) {
    existing.quantity += item.quantity
  } else {
    cart.items.push({ ...item, id: randomUUID() })
  }
}

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, 'cart_write')
  if (rateLimited) return rateLimited

  const cart = await readCart()
  const body = await request.json()

  if (body && typeof body === 'object' && Array.isArray(body.items)) {
    const parsed = batchAddSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
    for (const item of parsed.data.items) applyItem(cart, item)
  } else {
    const parsed = addItemSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid item' }, { status: 400 })
    applyItem(cart, parsed.data)
  }

  return cartResponse(cart)
}

export async function DELETE(request: Request) {
  const rateLimited = await enforceRateLimit(request, 'cart_write')
  if (rateLimited) return rateLimited

  const cart = await readCart()
  const parsed = deleteSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  cart.items = cart.items.filter((i) => i.id !== parsed.data.id)
  return cartResponse(cart)
}

export async function PATCH(request: Request) {
  const rateLimited = await enforceRateLimit(request, 'cart_write')
  if (rateLimited) return rateLimited

  const cart = await readCart()
  const parsed = patchSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid patch' }, { status: 400 })
  const { id, quantity } = parsed.data
  const item = cart.items.find((i) => i.id === id)
  if (item) item.quantity = quantity
  return cartResponse(cart)
}
