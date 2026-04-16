'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const DELIVERY_PRICE = 10
const CARD_PRICE = 4
const ARRANGEMENT_PRICES: Record<string, number> = { '50': 50, '75': 75 }

type Props = {
  applicationId: string
  locationId: string
  sdkUrl: string
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
    arrangement50: string
    arrangement75: string
    card: string
    cardName: string
    cardMessage: string
    submit: string
  }
}

export function MothersDayCheckoutForm({ applicationId, locationId, sdkUrl, t }: Props) {
  const router = useRouter()
  const cardRef = useRef<any>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fulfillment, setFulfillment] = useState('pickup')
  const [arrangement, setArrangement] = useState('50')
  const [showCard, setShowCard] = useState(false)

  const arrangementPrice = ARRANGEMENT_PRICES[arrangement] ?? 0
  const total = arrangementPrice + (fulfillment === 'delivery' ? DELIVERY_PRICE : 0) + (showCard ? CARD_PRICE : 0)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = sdkUrl
    script.async = true
    script.onload = async () => {
      try {
        const payments = await (window as any).Square.payments(applicationId, locationId)
        const card = await payments.card()
        await card.attach('#mothers-day-card-container')
        cardRef.current = card
        setSdkReady(true)
      } catch {
        setError('Failed to load payment form. Please refresh and try again.')
      }
    }
    script.onerror = () => setError('Failed to load payment form. Please refresh and try again.')
    document.head.appendChild(script)
    return () => {
      cardRef.current?.destroy()
      cardRef.current = null
      document.head.removeChild(script)
    }
  }, [applicationId, locationId, sdkUrl])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!cardRef.current) return
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
      arrangement,
      card_to: data.get('card_to') as string,
      card_message: data.get('card_message') as string,
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
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="arrangement"
              value="50"
              checked={arrangement === '50'}
              onChange={() => setArrangement('50')}
              className="accent-purple"
            />
            {t.arrangement50}
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="arrangement"
              value="75"
              checked={arrangement === '75'}
              onChange={() => setArrangement('75')}
              className="accent-purple"
            />
            {t.arrangement75}
          </label>
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
          className="border-2 border-foreground bg-transparent px-1 py-1 min-h-[56px]"
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
          <span>{arrangement === '50' ? t.arrangement50 : t.arrangement75}</span>
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

      <button
        type="submit"
        disabled={!sdkReady || submitting}
        className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
