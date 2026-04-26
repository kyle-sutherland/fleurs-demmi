'use client'

import { useCallback, useState } from 'react'
import { TurnstileWidget } from '@/app/components/TurnstileWidget'

export type SympathyArrangement = {
  variationId: string
  name: string
  price: number
  soldOut: boolean
}

type Props = {
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
    customArrangement: string
    inquireForPricing: string
    soldOut: string
    styleNotes: string
    card: string
    cardRecipient: string
    cardMessage: string
    submit: string
  }
}

export function FuneralsForm({ arrangements, t }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [showCard, setShowCard] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [fulfillment, setFulfillment] = useState('pickup')

  const onTurnstileToken = useCallback((t: string) => setTurnstileToken(t), [])

  const adjust = (id: string, delta: number) => {
    setQuantities((prev) => {
      const next = (prev[id] ?? 0) + delta
      if (next <= 0) {
        const { [id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: next }
    })
  }

  const hasCustom = (quantities['custom'] ?? 0) > 0
  const selectedArrangements = arrangements.filter((a) => (quantities[a.variationId] ?? 0) > 0)
  const totalSelected = Object.values(quantities).reduce((s, q) => s + q, 0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (totalSelected === 0) return
    setError(null)
    setSubmitting(true)

    const form = e.currentTarget
    const data = new FormData(form)

    const body = {
      name: data.get('name') as string,
      email: data.get('email') as string,
      phone: data.get('phone') as string,
      funeral_date: data.get('funeral_date') as string,
      funeral_location: data.get('funeral_location') as string,
      fulfillment,
      arrangementQuantities: quantities,
      arrangementNames: selectedArrangements.map((a) => `${quantities[a.variationId]}x ${a.name}`).concat(hasCustom ? [`${quantities['custom']}x Custom Arrangement`] : []),
      style_notes: data.get('style_notes') as string,
      card_name: data.get('card_name') as string,
      card_message: data.get('card_message') as string,
      turnstile: turnstileToken,
    }

    try {
      const res = await fetch('/api/inquire/funerals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }

      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="mt-8 p-8 border-2 border-foreground/20 flex flex-col gap-3 max-w-lg">
        <p className="font-display font-black text-2xl">Request received!</p>
        <p className="font-sans text-sm text-foreground/70 leading-relaxed">
          Thank you! Emmi will be in touch shortly to discuss the details of your sympathy arrangement.
        </p>
      </div>
    )
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

      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">{t.arrangement} *</label>
        <div className="flex flex-col gap-3">
          {arrangements.map((a) => {
            const qty = quantities[a.variationId] ?? 0
            return (
              <div key={a.variationId} className={`flex items-center justify-between font-sans text-sm ${a.soldOut ? 'opacity-40' : ''}`}>
                <span className="capitalize">{a.name} — ${a.price.toFixed(2)}{a.soldOut ? ` — ${t.soldOut}` : ''}</span>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <button type="button" onClick={() => adjust(a.variationId, -1)} disabled={qty === 0 || a.soldOut} className="w-7 h-7 border-2 border-foreground/30 flex items-center justify-center font-sans font-bold text-base hover:border-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed">−</button>
                  <span className="w-4 text-center">{qty}</span>
                  <button type="button" onClick={() => adjust(a.variationId, 1)} disabled={a.soldOut} className="w-7 h-7 border-2 border-foreground/30 flex items-center justify-center font-sans font-bold text-base hover:border-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                </div>
              </div>
            )
          })}
          <div className="flex items-center justify-between font-sans text-sm">
            <span>{t.customArrangement} — {t.inquireForPricing}</span>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <button type="button" onClick={() => adjust('custom', -1)} disabled={(quantities['custom'] ?? 0) === 0} className="w-7 h-7 border-2 border-foreground/30 flex items-center justify-center font-sans font-bold text-base hover:border-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed">−</button>
              <span className="w-4 text-center">{quantities['custom'] ?? 0}</span>
              <button type="button" onClick={() => adjust('custom', 1)} className="w-7 h-7 border-2 border-foreground/30 flex items-center justify-center font-sans font-bold text-base hover:border-foreground transition-colors">+</button>
            </div>
          </div>
        </div>
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

      {error && (
        <p className="font-sans text-sm text-red-600 border-2 border-red-200 bg-red-50 px-4 py-3">{error}</p>
      )}

      <TurnstileWidget onToken={onTurnstileToken} />

      <button
        type="submit"
        disabled={submitting || totalSelected === 0}
        className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? 'Sending…' : t.submit}
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
      {label && <label htmlFor={name} className="font-sans text-xs uppercase tracking-widest font-semibold">{label}</label>}
      <textarea id={name} name={name} rows={rows} aria-label={label || name} className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple resize-none" />
    </div>
  )
}
