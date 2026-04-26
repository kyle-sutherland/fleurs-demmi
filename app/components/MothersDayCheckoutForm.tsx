'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TurnstileWidget } from '@/app/components/TurnstileWidget'

interface SquarePaymentMethod {
  attach(selector: string): Promise<void>
  tokenize(): Promise<{ status: string; token?: string; errors?: Array<{ message: string }> }>
  destroy(): void
}

declare global {
  interface Window {
    Square?: {
      payments(appId: string, locationId: string): Promise<{
        card(): Promise<SquarePaymentMethod>
        giftCard(): Promise<SquarePaymentMethod>
      }>
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
  section: 'bouquet' | 'arrangement'
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
    subscribeLabel: string
    submit: string
    giftCardLabel: string
    giftCardPlaceholder: string
    giftCardApply: string
    giftCardApplied: string
    giftCardBalance: string
    giftCardError: string
    giftCardRemove: string
    giftCardConfirmLabel: string
    discountLabel: string
    discountPlaceholder: string
    discountApply: string
    discountError: string
  }
}

export function MothersDayCheckoutForm({ applicationId, locationId, sdkUrl, arrangements, t }: Props) {
  const router = useRouter()
  const cardRef = useRef<SquarePaymentMethod | null>(null)
  const giftCardRef = useRef<SquarePaymentMethod | null>(null)
  const paymentsRef = useRef<{ card(): Promise<SquarePaymentMethod>; giftCard(): Promise<SquarePaymentMethod> } | null>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fulfillment, setFulfillment] = useState('pickup')
  const firstAvailable = arrangements.find((a) => !a.soldOut)
  const [selectedIds, setSelectedIds] = useState<string[]>(
    firstAvailable ? [firstAvailable.variationId] : arrangements[0] ? [arrangements[0].variationId] : []
  )
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [showCard, setShowCard] = useState(false)
  const [subscribeToNews, setSubscribeToNews] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')

  // Gift card state
  const [giftCardInput, setGiftCardInput] = useState('')
  const [giftCard, setGiftCard] = useState<{ gan: string; balance: number } | null>(null)
  const [giftCardError, setGiftCardError] = useState<string | null>(null)
  const [giftCardLoading, setGiftCardLoading] = useState(false)
  const [giftCardReady, setGiftCardReady] = useState(false)

  // Discount code state (stubbed — always invalid)
  const [discountInput, setDiscountInput] = useState('')
  const [discountError, setDiscountError] = useState<string | null>(null)

  const onTurnstileToken = useCallback((t: string) => setTurnstileToken(t), [])

  const selectedItems = arrangements.filter((a) => selectedIds.includes(a.variationId))
  const arrangementPrice = selectedItems.reduce((sum, a) => sum + a.price, 0)
  const total = arrangementPrice + (fulfillment === 'delivery' ? DELIVERY_PRICE : 0) + (showCard ? CARD_PRICE : 0)

  const displayTotal = giftCard ? Math.max(0, total - giftCard.balance) : total

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
        paymentsRef.current = payments
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
      giftCardRef.current?.destroy()
      giftCardRef.current = null
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [applicationId, locationId, sdkUrl])

  useEffect(() => {
    if (!giftCard || !paymentsRef.current) return
    let cancelled = false
    setGiftCardReady(false)
    ;(async () => {
      try {
        const gc = await paymentsRef.current!.giftCard()
        if (cancelled) { gc.destroy(); return }
        await gc.attach('#md-gift-card-container')
        if (cancelled) { gc.destroy(); return }
        giftCardRef.current = gc
        setGiftCardReady(true)
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
      giftCardRef.current?.destroy()
      giftCardRef.current = null
      setGiftCardReady(false)
    }
  }, [giftCard])

  async function applyGiftCard() {
    if (!giftCardInput.trim()) return
    setGiftCardError(null)
    setGiftCardLoading(true)
    try {
      const res = await fetch('/api/checkout/validate-gift-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gan: giftCardInput.trim() }),
      })
      const data = await res.json()
      if (data.valid) {
        setGiftCard({ gan: giftCardInput.trim(), balance: data.balance })
        setGiftCardInput('')
      } else {
        setGiftCardError(data.error ?? t.giftCardError)
      }
    } catch {
      setGiftCardError(t.giftCardError)
    } finally {
      setGiftCardLoading(false)
    }
  }

  function applyDiscountCode() {
    if (!discountInput.trim()) return
    setDiscountError(t.discountError)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (selectedIds.length === 0) {
      setSelectionError('Please select at least one item.')
      return
    }
    if (!cardRef.current) return
    setError(null)
    setSelectionError(null)
    setSubmitting(true)

    const form = e.currentTarget
    const data = new FormData(form)

    const tokenResult = await cardRef.current.tokenize()
    if (tokenResult.status !== 'OK') {
      setError(tokenResult.errors?.[0]?.message ?? 'Card tokenization failed.')
      setSubmitting(false)
      return
    }
    const token = tokenResult.token!

    let giftCardToken: string | undefined
    if (giftCard && giftCardRef.current) {
      const gcResult = await giftCardRef.current.tokenize()
      if (gcResult.status !== 'OK') {
        setError(gcResult.errors?.[0]?.message ?? 'Gift card tokenization failed.')
        setSubmitting(false)
        return
      }
      giftCardToken = gcResult.token
    }

    const body = {
      token,
      name: data.get('name') as string,
      email: data.get('email') as string,
      phone: data.get('phone') as string,
      fulfillment,
      address: data.get('address') as string,
      delivery_time: data.get('delivery_time') as string,
      variationIds: selectedIds,
      arrangementNames: selectedItems.map((a) => a.name),
      card_to: data.get('card_to') as string,
      card_message: data.get('card_message') as string,
      subscribe_to_news: subscribeToNews,
      turnstile: turnstileToken,
      ...(giftCardToken ? { giftCardToken } : {}),
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
        {selectionError && <p className="font-sans text-sm text-red-600">{selectionError}</p>}
        <div className="flex flex-col gap-4 font-sans text-sm">
          {(['bouquet', 'arrangement'] as const).map((section) => {
            const sectionItems = arrangements.filter((a) => a.section === section)
            if (sectionItems.length === 0) return null
            return (
              <div key={section} className="flex flex-col gap-2">
                <span className="font-sans text-xs uppercase tracking-widest text-foreground/50">
                  {section === 'bouquet' ? 'Bouquets' : 'Arrangements'}
                </span>
                {sectionItems.map((a) => (
                  <label key={a.variationId} className={`flex items-center gap-3 ${a.soldOut ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      value={a.variationId}
                      checked={selectedIds.includes(a.variationId)}
                      onChange={(e) => {
                        setSelectionError(null)
                        setSelectedIds((prev) =>
                          e.target.checked
                            ? [...prev, a.variationId]
                            : prev.filter((id) => id !== a.variationId)
                        )
                      }}
                      disabled={a.soldOut}
                      className="accent-purple"
                    />
                    {a.name} — ${a.price.toFixed(2)}{a.soldOut && ' — Sold out'}
                  </label>
                ))}
              </div>
            )
          })}
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

      {/* Gift card */}
      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">
          {t.giftCardLabel}
        </label>
        {!giftCard ? (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={giftCardInput}
                onChange={(e) => { setGiftCardInput(e.target.value); setGiftCardError(null) }}
                placeholder={t.giftCardPlaceholder}
                className="flex-1 border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple"
              />
              <button
                type="button"
                onClick={applyGiftCard}
                disabled={giftCardLoading || !giftCardInput.trim()}
                className="font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground px-5 py-3 hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t.giftCardApply}
              </button>
            </div>
            {giftCardError && <p className="font-sans text-sm text-red-600">{giftCardError}</p>}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between border-2 border-foreground/20 px-4 py-3 font-sans text-sm">
              <span>
                <span className="font-semibold">{t.giftCardApplied}</span>
                {' (…'}{giftCard.gan.slice(-4)}{')'}{' — '}{t.giftCardBalance}: ${giftCard.balance.toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => setGiftCard(null)}
                className="font-sans text-xs uppercase tracking-widest font-semibold underline"
              >
                {t.giftCardRemove}
              </button>
            </div>
            <label className="font-sans text-xs uppercase tracking-widest font-semibold mt-1">
              {t.giftCardConfirmLabel}
            </label>
            <div id="md-gift-card-container" className="bg-transparent px-1 py-1 min-h-[56px]" />
            {!giftCardReady && (
              <p className="font-sans text-xs text-foreground/40">Loading…</p>
            )}
          </>
        )}
      </div>

      {/* Discount code */}
      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">
          {t.discountLabel}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={discountInput}
            onChange={(e) => { setDiscountInput(e.target.value); setDiscountError(null) }}
            placeholder={t.discountPlaceholder}
            className="flex-1 border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple"
          />
          <button
            type="button"
            onClick={applyDiscountCode}
            disabled={!discountInput.trim()}
            className="font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground px-5 py-3 hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.discountApply}
          </button>
        </div>
        {discountError && (
          <p className="font-sans text-sm text-red-600">{discountError}</p>
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
        {selectedItems.map((a) => (
          <div key={a.variationId} className="flex justify-between font-sans text-sm text-foreground/60">
            <span>{a.name}</span>
            <span>${a.price.toFixed(2)}</span>
          </div>
        ))}
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
        {giftCard && (
          <div className="flex justify-between font-sans text-sm text-foreground/60">
            <span>{t.giftCardApplied} (…{giftCard.gan.slice(-4)})</span>
            <span>−${Math.min(giftCard.balance, total).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-display font-black text-lg mt-2">
          <span>Total</span>
          <span>${displayTotal.toFixed(2)} CAD</span>
        </div>
      </div>

      <label className="flex items-center gap-3 font-sans text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={subscribeToNews}
          onChange={(e) => setSubscribeToNews(e.target.checked)}
          className="accent-purple"
        />
        {t.subscribeLabel}
      </label>

      <TurnstileWidget onToken={onTurnstileToken} />

      <button
        type="submit"
        disabled={!sdkReady || submitting || selectedIds.length === 0}
        className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-orange-500 hover:border-[#E6E6FA] hover:text-[#E6E6FA] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? 'Processing…' : `${t.submit} — $${displayTotal.toFixed(2)}`}
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
