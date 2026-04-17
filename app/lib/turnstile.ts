/**
 * Verify a Cloudflare Turnstile token server-side.
 * Returns true if valid, false otherwise.
 *
 * If TURNSTILE_SECRET_KEY is not configured (e.g. local dev without keys),
 * verification is skipped and returns true so development isn't blocked.
 */
export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    // Keys not configured — skip in dev. In production this env var must be set.
    if (process.env.NODE_ENV === 'production') {
      console.error('TURNSTILE_SECRET_KEY is not set in production')
      return false
    }
    return true
  }

  if (!token) return false

  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.append('remoteip', ip)

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    })
    const data = await res.json() as { success: boolean }
    return data.success === true
  } catch (err) {
    console.error('Turnstile verification error:', err)
    return false
  }
}
