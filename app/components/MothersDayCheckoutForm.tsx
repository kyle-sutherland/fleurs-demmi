'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

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
  arrangements: MDArrangement[]
  t: {
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

export function MothersDayCheckoutForm({ arrangements, t }: Props) {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fulfillment, setFulfillment] = useState('pickup')
  const firstAvailable = arrangements.find((a) => !a.soldOut)
  const [selectedIds, setSelectedIds] = useState<string[]>(
    firstAvailable ? [firstAvailable.variationId] : arrangements[0] ? [arrangements[0].variationId] : []
  )
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [showCard, setShowCard] = useState(false)

  const selectedItems = arrangements.filter((a) => selectedIds.includes(a.variationId))
  const arrangementPrice = selectedItems.reduce((sum, a) => sum + a.price, 0)
  const total = arrangementPrice + (fulfillment === 'delivery' ? DELIVERY_PRICE : 0) + (showCard ? CARD_PRICE : 0)

  async function handleAddToCart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (selectedIds.length === 0) {
      setSelectionError('Please select at least one item.')
      return
    }
    setError(null)
    setSelectionError(null)
    setSubmitting(true)

    const data = new FormData(e.currentTarget)
    const card_to = (data.get('card_to') as string | null) ?? ''
    const card_message = (data.get('card_message') as string | null) ?? ''

    const pickupLabel = fulfillment === 'pickup' ? 'Pick up — May 9th, Mile End' : 'Delivery'

    const items = [
      ...selectedItems.map((a) => ({
        productId: a.variationId,
        name: a.name,
        price: a.price,
        quantity: 1,
        options: { pickup: pickupLabel },
      })),
      ...(fulfillment === 'delivery' ? [{
        productId: 'md-delivery',
        name: "Mother's Day Delivery — May 10th",
        price: DELIVERY_PRICE,
        quantity: 1,
        options: { pickup: 'Delivery' },
      }] : []),
      ...(showCard ? [{
        productId: 'card-addon',
        name: 'Card with note',
        price: CARD_PRICE,
        quantity: 1,
        options: {
          pickup: pickupLabel,
          ...(card_to.trim() && { To: card_to.trim() }),
          ...(card_message.trim() && { Message: card_message.trim() }),
        },
      }] : []),
    ]

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as { error?: string }).error ?? 'Failed to add to cart. Please try again.')
        setSubmitting(false)
        return
      }
      router.push(`/${locale}/cart`)
    } catch {
      setError('Failed to add to cart. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleAddToCart} className="flex flex-col gap-5">
      {/* Honeypot */}
      <input name="website" type="text" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} aria-hidden="true" />

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
        <div className="flex justify-between font-display font-black text-lg mt-2">
          <span>Total</span>
          <span>${total.toFixed(2)} CAD</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || selectedIds.length === 0}
        className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-orange-500 hover:border-[#E6E6FA] hover:text-[#E6E6FA] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? 'Adding…' : `${t.submit} — $${total.toFixed(2)}`}
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
