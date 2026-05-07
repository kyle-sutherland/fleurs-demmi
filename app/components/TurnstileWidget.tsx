'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

interface TurnstileInstance {
  render(container: HTMLElement, options: Record<string, unknown>): string
  reset(widgetId: string): void
  remove(widgetId: string): void
}

declare global {
  interface Window {
    turnstile?: TurnstileInstance
  }
}

type Props = {
  onToken: (token: string) => void
  onError?: () => void
}

export interface TurnstileHandle {
  reset(): void
}

/**
 * Invisible Cloudflare Turnstile widget.
 * Fires onToken automatically on first render (invisible mode).
 * If NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set, calls onToken('dev') immediately
 * so forms work in local development without keys.
 *
 * Expose a `reset()` method via ref so parents can force a fresh token after a
 * submission attempt — Turnstile tokens are single-use and Cloudflare will
 * reject a reused token with a 403, so callers should reset after every submit.
 */
export const TurnstileWidget = forwardRef<TurnstileHandle, Props>(function TurnstileWidget(
  { onToken, onError },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const onTokenRef = useRef(onToken)
  const devMode = useRef(false)

  // Keep the latest callback in a ref so reset() can call it without
  // re-running the mount effect on every render.
  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useImperativeHandle(ref, () => ({
    reset() {
      // Invalidate the parent's stored token immediately so a click during
      // re-issuance can't post an empty/stale value.
      onTokenRef.current('')
      if (devMode.current) {
        // Dev/no-keys path: re-fire the placeholder so submission still works.
        onTokenRef.current('dev')
        return
      }
      if (widgetId.current && window.turnstile) {
        window.turnstile.reset(widgetId.current)
      }
    },
  }), [])

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!siteKey) {
      // Dev mode — no keys configured, skip verification
      devMode.current = true
      onToken('dev')
      return
    }

    let cancelled = false

    function renderWidget() {
      if (cancelled || !containerRef.current) return
      if (widgetId.current !== null) return // already rendered

      const turnstile = window.turnstile
      if (!turnstile) return

      widgetId.current = turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          if (!cancelled) onToken(token)
        },
        'error-callback': () => {
          if (!cancelled && onError) onError()
        },
        'expired-callback': () => {
          // Reset token so it's re-verified on next submit
          if (!cancelled) onToken('')
          if (widgetId.current) window.turnstile?.reset(widgetId.current)
        },
      })
    }

    if (window.turnstile) {
      renderWidget()
    } else {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      script.onload = renderWidget
      document.head.appendChild(script)

      return () => {
        cancelled = true
        if (widgetId.current !== null) {
          ;window.turnstile?.remove(widgetId.current)
          widgetId.current = null
        }
        if (document.head.contains(script)) document.head.removeChild(script)
      }
    }

    return () => {
      cancelled = true
      if (widgetId.current !== null) {
        ;window.turnstile?.remove(widgetId.current)
        widgetId.current = null
      }
    }
  }, [onToken, onError])

  return <div ref={containerRef} />
})
