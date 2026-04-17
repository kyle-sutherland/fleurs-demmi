'use client'

import { useEffect, useRef } from 'react'

type Props = {
  onToken: (token: string) => void
  onError?: () => void
}

/**
 * Invisible Cloudflare Turnstile widget.
 * Fires onToken automatically on first render (invisible mode).
 * If NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set, calls onToken('dev') immediately
 * so forms work in local development without keys.
 */
export function TurnstileWidget({ onToken, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!siteKey) {
      // Dev mode — no keys configured, skip verification
      onToken('dev')
      return
    }

    let cancelled = false

    function renderWidget() {
      if (cancelled || !containerRef.current) return
      if (widgetId.current !== null) return // already rendered

      const turnstile = (window as any).turnstile
      if (!turnstile) return

      widgetId.current = turnstile.render(containerRef.current, {
        sitekey: siteKey,
        size: 'invisible',
        callback: (token: string) => {
          if (!cancelled) onToken(token)
        },
        'error-callback': () => {
          if (!cancelled && onError) onError()
        },
        'expired-callback': () => {
          // Reset token so it's re-verified on next submit
          if (!cancelled) onToken('')
          widgetId.current && (window as any).turnstile?.reset(widgetId.current)
        },
      })
    }

    if ((window as any).turnstile) {
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
          ;(window as any).turnstile?.remove(widgetId.current)
          widgetId.current = null
        }
        if (document.head.contains(script)) document.head.removeChild(script)
      }
    }

    return () => {
      cancelled = true
      if (widgetId.current !== null) {
        ;(window as any).turnstile?.remove(widgetId.current)
        widgetId.current = null
      }
    }
  }, [onToken, onError])

  return <div ref={containerRef} />
}
