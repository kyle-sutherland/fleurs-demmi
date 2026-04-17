'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TurnstileWidget } from '@/app/components/TurnstileWidget'

type Props = {
  applicationId: string
  locationId: string
  sdkUrl: string
  total: number
}

export function CheckoutForm({ applicationId, locationId, sdkUrl, total }: Props) {
  const router = useRouter()
  const cardRef = useRef<any>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscribeToNews, setSubscribeToNews] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')

  const onTurnstileToken = useCallback((t: string) => setTurnstileToken(t), [])

  useEffect(() => {
    let cancelled = false
    const script = document.createElement('script')
    script.src = sdkUrl
    script.async = true
    script.onload = async () => {
      if (cancelled) return
      try {
        const payments = await (window as any).Square.payments(applicationId, locationId)
        if (cancelled) return
        const card = await payments.card()
        if (cancelled) return
        await card.attach('#card-container')
        if (cancelled) { card.destroy(); return }
        cardRef.current = card
        setSdkReady(true)
      } catch {
        if (!cancelled) setError('Failed to load payment form. Please refresh and try again.')
      }
    }
    script.onerror = () => { if (!cancelled) setError('Failed to load payment form. Please refresh and try again.') }
    document.head.appendChild(script)
    return () => {
      cancelled = true
      cardRef.current?.destroy()
      cardRef.current = null
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [applicationId, locationId, sdkUrl])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!cardRef.current) return
    setError(null)
    setSubmitting(true)

    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value

    const tokenResult = await cardRef.current.tokenize()
    if (tokenResult.status !== 'OK') {
      setError(tokenResult.errors?.[0]?.message ?? 'Card tokenization failed.')
      setSubmitting(false)
      return
    }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenResult.token, name, email, subscribe_to_news: subscribeToNews, turnstile: turnstileToken }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Payment failed. Please try again.')
      setSubmitting(false)
      return
    }

    router.push(`/order-confirmation?orderId=${data.orderId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Honeypot */}
      <input name="website" type="text" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} aria-hidden="true" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Name" name="name" type="text" required />
        <Field label="Email" name="email" type="email" required />
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">
          Card Details
        </label>
        <div
          id="card-container"
          className="bg-transparent px-1 py-1 min-h-[56px]"
        />
        {!sdkReady && !error && (
          <p className="font-sans text-xs text-foreground/40">Loading payment form…</p>
        )}
      </div>

      {error && (
        <p className="font-sans text-sm text-red-600 border-2 border-red-200 bg-red-50 px-4 py-3">
          {error}
        </p>
      )}

      <div className="border-t-2 border-foreground/10 pt-5 flex justify-between items-center font-display font-black text-lg">
        <span>Total</span>
        <span>${total.toFixed(2)} CAD</span>
      </div>

      <label className="flex items-center gap-3 font-sans text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={subscribeToNews}
          onChange={(e) => setSubscribeToNews(e.target.checked)}
          className="accent-purple"
        />
        Subscribe to our newsletter
      </label>

      <TurnstileWidget onToken={onTurnstileToken} />

      <button
        type="submit"
        disabled={!sdkReady || submitting}
        className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? 'Processing…' : `Pay $${total.toFixed(2)}`}
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  type,
  required,
}: {
  label: string
  name: string
  type: string
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="font-sans text-xs uppercase tracking-widest font-semibold">
        {label}
        {required && ' *'}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple"
      />
    </div>
  )
}
