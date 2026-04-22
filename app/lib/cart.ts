import { signCart, verifyCart } from '@/app/lib/cartCookie'

export type CartItem = {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  options?: Record<string, string>
}

export type Cart = { items: CartItem[] }

export function parseCart(value: string | undefined): Cart {
  if (!value) return { items: [] }
  try {
    const payload = verifyCart(value)
    if (!payload) return { items: [] }
    const parsed = JSON.parse(payload)
    if (parsed && Array.isArray(parsed.items)) return parsed as Cart
  } catch {}
  return { items: [] }
}

export function serializeCart(cart: Cart): string {
  return signCart(JSON.stringify(cart))
}

export function cartTotal(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export function cartCount(cart: Cart): number {
  return cart.items.reduce((sum, item) =>
    sum + (item.productId.startsWith('delivery-surcharge:') ? 1 : item.quantity), 0)
}
