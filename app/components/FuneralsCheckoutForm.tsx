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

const CARD_PRICE = 4

export type SympathyArrangement = {
  variationId: string
  name: string
  price: number
  soldOut: boolean
}

type Props = {
  applicationId: string
  locationId: string
  sdkUrl: string
  arrangements: SympathyArrangement[]
  t: {
    name: string
    email: string
    phone: string
    funeralDate: string
    funeralDateHint: string
    funeralLocation: string
    funeralLocationHint: string
    fulfillment: string
    pickUp: string
    delivery: string
    arrangement: string
    arrangementPlaceholder: string
    styleNotes: string
    card: string
    cardRecipient: string
    cardMessage: string
    submit: string
  }
}

export function FuneralsCheckoutForm({ applicationId, locationId, sdkUrl, arrangements, t }: Props) {
  const router = useRouter()
  const cardRef = useRef<SquareCard | null>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [showCard, setShowCard] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')

  const onTurnstileToken = useCallback((t: string) => setTurnstileToken(t), [])

  const selected = arrangements.find((a) => a.variationId === selectedId)
  const arrangementPrice = selected?.price ?? 0
  const total = arrangementPrice + (showCard ? CARD_PRICE : 0)

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
        await card.attach('#funerals-card-container')
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
      funeral_date: data.get('funeral_date') as string,
      funeral_location: data.get('funeral_location') as string,
      fulfillment: data.getAll('fulfillment'),
      variationId: selected.variationId,
      arrangementName: selected.name,
      style_notes: data.get('style_notes') as string,
      card_name: data.get('card_name') as string,
      card_message: data.get('card_message') as string,
      turnstile: turnstileToken,
    }

    const res = await fetch('/api/checkout/funerals', {
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
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
      {/* Honeypot */}
      <input name="website" type="text" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} aria-hidden="true" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label={t.name} name="name" type="text" required />
        <Field label={t.email} name="email" type="email" required />
      </div>
      <Field label={t.phone} name="phone" type="tel" required />
      <Field label={t.funeralDate} name="funeral_date" type="date" hint={t.funeralDateHint} required />
      <Field label={t.funeralLocation} name="funeral_location" type="text" hint={t.funeralLocationHint} />

      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">{t.fulfillment} *</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 font-sans text-sm cursor-pointer">
            <input type="checkbox" name="fulfillment" value="pickup" className="accent-purple" /> {t.pickUp}
          </label>
          <label className="flex items-center gap-2 font-sans text-sm cursor-pointer">
            <input type="checkbox" name="fulfillment" value="delivery" className="accent-purple" /> {t.delivery}
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">{t.arrangement} *</label>
        <select
          name="arrangement"
          required
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="border-2 border-foreground bg-background font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple appearance-none"
        >
          <option value="">{t.arrangementPlaceholder}</option>
          {arrangements.map((a) => (
            <option key={a.variationId} value={a.variationId} disabled={a.soldOut}>
              {a.name} — ${a.price.toFixed(2)}{a.soldOut ? ' — Sold out' : ''}
            </option>
          ))}
        </select>
      </div>

      <Textarea label={t.styleNotes} name="style_notes" rows={3} />

      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 font-sans text-xs uppercase tracking-widest font-semibold cursor-pointer">
          <input
            type="checkbox"
            className="accent-purple"
            checked={showCard}
            onChange={(e) => setShowCard(e.target.checked)}
          />
          {t.card}
        </label>
        {showCard && (
          <div className="mt-2 flex flex-col gap-3 pl-5">
            <p className="font-sans text-xs text-foreground/50">{t.cardRecipient}</p>
            <Textarea label="" name="card_name" rows={1} />
            <Textarea label={t.cardMessage} name="card_message" rows={3} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">Card Details</label>
        <div
          id="funerals-card-container"
          className="bg-transparent px-1 py-1 min-h-[56px]"
        />
        {!sdkReady && !error && (
          <p className="font-sans text-xs text-foreground/40">Loading payment form…</p>
        )}
      </div>

      {error && (
        <p className="font-sans text-sm text-red-600 border-2 border-red-200 bg-red-50 px-4 py-3">{error}</p>
      )}

      {selected && (
        <div className="border-t-2 border-foreground/10 pt-4 flex flex-col gap-1">
          <div className="flex justify-between font-sans text-sm text-foreground/60">
            <span>{selected.name}</span>
            <span>${arrangementPrice.toFixed(2)}</span>
          </div>
          {showCard && (
            <div className="flex justify-between font-sans text-sm text-foreground/60">
              <span>Greeting card</span>
              <span>${CARD_PRICE.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-display font-black text-lg mt-2">
            <span>Total</span>
            <span>${total.toFixed(2)} CAD</span>
          </div>
        </div>
      )}

      <TurnstileWidget onToken={onTurnstileToken} />

      <button
        type="submit"
        disabled={!sdkReady || submitting || !selected}
        className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? 'Processing…' : selected ? `${t.submit} — $${total.toFixed(2)}` : t.submit}
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
