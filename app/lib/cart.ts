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
    const parsed = JSON.parse(decodeURIComponent(value))
    if (parsed && Array.isArray(parsed.items)) return parsed as Cart
  } catch { }
  return { items: [] }
}

export function serializeCart(cart: Cart): string {
  return encodeURIComponent(JSON.stringify(cart))
}

export function cartTotal(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export function cartCount(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0)
}
