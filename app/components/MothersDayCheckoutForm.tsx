'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TurnstileWidget } from '@/app/components/TurnstileWidget'

interface SquareCard {
  attach(selector: string): Promise<void>
  tokenize(): Promise<{ status: string; token?: string; errors?: Array<{ message: string }> }>
  destroy(): void
}

declare global {
  interface Window {
    Square?: {
      payments(appId: string, locationId: string): Promise<{ card(): Promise<SquareCard> }>
    }
  }
}

const DELIVERY_PRICE = 10
const CARD_PRICE = 4

export type MDArrangement = {
  variationId: string
  name: string        // Localized display name
  price: number       // CAD dollars
  soldOut: boolean
}

type Props = {
  applicationId: string
  locationId: string
  sdkUrl: string
  arrangements: MDArrangement[]
  t: {
    name: string
    email: string
    phone: string
    fulfillment: string
    pickUp: string
    delivery: string
    deliveryAddress: string
    deliveryAddressHint: string
    deliveryTime: string
    deliveryTimeHint: string
    arrangement: string
    card: string
    cardName: string
    cardMessage: string
    submit: string
  }
}

export function MothersDayCheckoutForm({ applicationId, locationId, sdkUrl, arrangements, t }: Props) {
  const router = useRouter()
  const cardRef = useRef<SquareCard | null>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fulfillment, setFulfillment] = useState('pickup')
  const firstAvailable = arrangements.find((a) => !a.soldOut)
  const [selectedId, setSelectedId] = useState(firstAvailable?.variationId ?? arrangements[0]?.variationId ?? '')
  const [showCard, setShowCard] = useState(false)
  const [subscribeToNews, setSubscribeToNews] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')

  const onTurnstileToken = useCallback((t: string) => setTurnstileToken(t), [])

  const selected = arrangements.find((a) => a.variationId === selectedId)
  const arrangementPrice = selected?.price ?? 0
  const total = arrangementPrice + (fulfillment === 'delivery' ? DELIVERY_PRICE : 0) + (showCard ? CARD_PRICE : 0)

  useEffect(() => {
    let cancelled = false
    const script = document.createElement('script')
    script.src = sdkUrl
    script.async = true
    script.onload = async () => {
      if (cancelled) return
      try {
        const payments = await window.Square!.payments(applicationId, locationId)
        if (cancelled) return
        const card = await payments.card()
        if (cancelled) return
        await card.attach('#mothers-day-card-container')
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
    if (!cardRef.current || !selected) return
    setError(null)
    setSubmitting(true)

    const form = e.currentTarget
    const data = new FormData(form)

    const tokenResult = await cardRef.current.tokenize()
    if (tokenResult.status !== 'OK') {
      setError(tokenResult.errors?.[0]?.message ?? 'Card tokenization failed.')
      setSubmitting(false)
      return
    }

    const body = {
      token: tokenResult.token,
      name: data.get('name') as string,
      email: data.get('email') as string,
      phone: data.get('phone') as string,
      fulfillment,
      address: data.get('address') as string,
      delivery_time: data.get('delivery_time') as string,
      variationId: selected.variationId,
      arrangementName: selected.name,
      card_to: data.get('card_to') as string,
      card_message: data.get('card_message') as string,
      subscribe_to_news: subscribeToNews,
      turnstile: turnstileToken,
    }

    const res = await fetch('/api/checkout/mothers-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const resData = await res.json()
    if (!res.ok) {
      setError(resData.error ?? 'Payment failed. Please try again.')
      setSubmitting(false)
      return
    }

    router.push(`/order-confirmation?orderId=${resData.orderId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Honeypot */}
      <input name="website" type="text" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} aria-hidden="true" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label={t.name} name="name" type="text" required />
        <Field label={t.email} name="email" type="email" required />
      </div>
      <Field label={t.phone} name="phone" type="tel" required />

      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">{t.fulfillment} *</label>
        <div className="flex flex-col gap-2 font-sans text-sm">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="fulfillment"
              value="pickup"
              checked={fulfillment === 'pickup'}
              onChange={() => setFulfillment('pickup')}
              className="accent-purple"
            />
            {t.pickUp}
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="fulfillment"
              value="delivery"
              checked={fulfillment === 'delivery'}
              onChange={() => setFulfillment('delivery')}
              className="accent-purple"
            />
            {t.delivery}
          </label>
        </div>
      </div>

      {fulfillment === 'delivery' && (
        <>
          <Field label={t.deliveryAddress} name="address" type="text" hint={t.deliveryAddressHint} required />
          <Field label={t.deliveryTime} name="delivery_time" type="text" hint={t.deliveryTimeHint} />
        </>
      )}

      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">{t.arrangement} *</label>
        <div className="flex flex-col gap-2 font-sans text-sm">
          {arrangements.map((a) => (
            <label key={a.variationId} className={`flex items-center gap-3 ${a.soldOut ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="radio"
                name="arrangement"
                value={a.variationId}
                checked={selectedId === a.variationId}
                onChange={() => setSelectedId(a.variationId)}
                disabled={a.soldOut}
                className="accent-purple"
              />
              {a.name}{a.soldOut && ' — Sold out'}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-5 bg-foreground/5">
        <label className="flex items-center gap-2 font-sans text-xs uppercase tracking-widest font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={showCard}
            onChange={(e) => setShowCard(e.target.checked)}
            className="accent-purple"
          />
          {t.card}
        </label>
        {showCard && (
          <div className="mt-2 flex flex-col gap-3">
            <Field label={t.cardName} name="card_to" type="text" />
            <Textarea label={t.cardMessage} name="card_message" rows={3} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">Card Details</label>
        <div
          id="mothers-day-card-container"
          className="bg-transparent px-1 py-1 min-h-[56px]"
        />
        {!sdkReady && !error && (
          <p className="font-sans text-xs text-foreground/40">Loading payment form…</p>
        )}
      </div>

      {error && (
        <p className="font-sans text-sm text-red-600 border-2 border-red-200 bg-red-50 px-4 py-3">{error}</p>
      )}

      <div className="border-t-2 border-foreground/10 pt-4 flex flex-col gap-1">
        <div className="flex justify-between font-sans text-sm text-foreground/60">
          <span>{selected?.name ?? ''}</span>
          <span>${arrangementPrice.toFixed(2)}</span>
        </div>
        {fulfillment === 'delivery' && (
          <div className="flex justify-between font-sans text-sm text-foreground/60">
            <span>Delivery — May 10th</span>
            <span>+${DELIVERY_PRICE.toFixed(2)}</span>
          </div>
        )}
        {showCard && (
          <div className="flex justify-between font-sans text-sm text-foreground/60">
            <span>Greeting card</span>
            <span>+${CARD_PRICE.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-display font-black text-lg mt-2">
          <span>Total</span>
          <span>${total.toFixed(2)} CAD</span>
        </div>
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
        disabled={!sdkReady || submitting || (selected?.soldOut ?? true)}
        className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-orange-500 hover:border-[#E6E6FA] hover:text-[#E6E6FA] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? 'Processing…' : `${t.submit} — $${total.toFixed(2)}`}
      </button>
    </form>
  )
}

function Field({ label, name, type, hint, required }: { label: string; name: string; type: string; hint?: string; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="font-sans text-xs uppercase tracking-widest font-semibold">
        {label}{required && ' *'}
      </label>
      {hint && <p className="font-sans text-xs text-foreground/50 -mt-0.5">{hint}</p>}
      <input id={name} name={name} type={type} required={required} className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple" />
    </div>
  )
}

function Textarea({ label, name, rows }: { label: string; name: string; rows: number }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="font-sans text-xs uppercase tracking-widest font-semibold">{label}</label>}
      <textarea name={name} rows={rows} className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple resize-none" />
    </div>
  )
}
