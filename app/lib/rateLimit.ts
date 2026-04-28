import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const LIMITS = {
  checkout:   { requests: 10, windowSeconds: 60 },
  inquire:    { requests: 5,  windowSeconds: 60 },
  subscribe:  { requests: 3,  windowSeconds: 60 },
  cart_write: { requests: 60, windowSeconds: 60 },
} as const

type RouteKey = keyof typeof LIMITS

let redis: Redis | null = null
const limiters = new Map<RouteKey, Ratelimit>()

function getRedis(): Redis | null {
  if (process.env.NODE_ENV === 'production') {
    const url   = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production')
    if (!redis) redis = new Redis({ url, token })
    return redis
  }
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token || process.env.NODE_ENV === 'development') return null
  if (!redis) redis = new Redis({ url, token })
  return redis
}

function getLimiter(key: RouteKey): Ratelimit | null {
  const r = getRedis()
  if (!r) return null
  if (!limiters.has(key)) {
    const { requests, windowSeconds } = LIMITS[key]
    limiters.set(key, new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
      prefix: `rl:${key}`,
    }))
  }
  return limiters.get(key)!
}

function extractIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0].trim() ?? 'unknown'
}

export async function enforceRateLimit(request: Request, key: RouteKey): Promise<NextResponse | null> {
  const limiter = getLimiter(key)
  if (!limiter) return null  // no Redis configured in dev — skip

  const ip = extractIp(request)
  const { success } = await limiter.limit(`${ip}:${key}`)
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429 }
    )
  }
  return null
}
