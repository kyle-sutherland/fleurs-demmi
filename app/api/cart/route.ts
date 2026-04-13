<<<<<<< Updated upstream
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { parseCart, serializeCart, type CartItem } from '@/app/lib/cart'
import { randomUUID } from 'crypto'

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
    httpOnly: false,
  })
  return res
}

export async function GET() {
  const cart = await readCart()
  return NextResponse.json(cart)
}

export async function POST(request: Request) {
  const cart = await readCart()
  const item: Omit<CartItem, 'id'> = await request.json()

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

  return cartResponse(cart)
}

export async function DELETE(request: Request) {
  const cart = await readCart()
  const { id }: { id: string } = await request.json()
  cart.items = cart.items.filter((i) => i.id !== id)
  return cartResponse(cart)
}

export async function PATCH(request: Request) {
  const cart = await readCart()
  const { id, quantity }: { id: string; quantity: number } = await request.json()
  const item = cart.items.find((i) => i.id === id)
  if (item) {
    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.id !== id)
    } else {
      item.quantity = quantity
    }
  }
  return cartResponse(cart)
}
=======
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { parseCart, serializeCart, type CartItem } from '@/app/lib/cart'
import { randomUUID } from 'crypto'

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
    httpOnly: false,
  })
  return res
}

export async function GET() {
  const cart = await readCart()
  return NextResponse.json(cart)
}

export async function POST(request: Request) {
  const cart = await readCart()
  const item: Omit<CartItem, 'id'> = await request.json()

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

  return cartResponse(cart)
}

export async function DELETE(request: Request) {
  const cart = await readCart()
  const { id }: { id: string } = await request.json()
  cart.items = cart.items.filter((i) => i.id !== id)
  return cartResponse(cart)
}

export async function PATCH(request: Request) {
  const cart = await readCart()
  const { id, quantity }: { id: string; quantity: number } = await request.json()
  const item = cart.items.find((i) => i.id === id)
  if (item) {
    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.id !== id)
    } else {
      item.quantity = quantity
    }
  }
  return cartResponse(cart)
}
>>>>>>> Stashed changes
