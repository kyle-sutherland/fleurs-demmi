import { createHmac, timingSafeEqual } from 'crypto'

function getSecret(): string {
  const secret = process.env.CART_COOKIE_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CART_COOKIE_SECRET is required in production')
    }
    return 'dev-insecure-placeholder'
  }
  return secret
}

export function signCart(payload: string): string {
  const secret = getSecret()
  const mac = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${Buffer.from(payload).toString('base64url')}.${mac}`
}

export function verifyCart(value: string): string | null {
  const dot = value.lastIndexOf('.')
  if (dot === -1) return null
  const encodedPayload = value.slice(0, dot)
  const mac = value.slice(dot + 1)

  try {
    const secret = getSecret()
    const expected = createHmac('sha256', secret).update(Buffer.from(encodedPayload, 'base64url').toString()).digest('base64url')
    const expectedBuf = Buffer.from(expected)
    const macBuf = Buffer.from(mac)
    if (expectedBuf.length !== macBuf.length) return null
    if (!timingSafeEqual(expectedBuf, macBuf)) return null
    return Buffer.from(encodedPayload, 'base64url').toString()
  } catch {
    return null
  }
}
