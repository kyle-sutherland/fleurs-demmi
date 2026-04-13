'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export function MothersDayForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const fulfillment = data.get('fulfillment') as string
    const bouquetStyle = data.get('bouquet_style') as string
    const customBouquet = data.get('custom_bouquet') as string
    const cardTo = data.get('card_to') as string
    const cardMessage = data.get('card_message') as string

    setSubmitting(true)

    const adds: Promise<Response>[] = []

    // Base bouquet
    const basePrice = 60
    adds.push(
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'mothers-day-bouquet-60',
          name: "Mother's Day Bouquet",
          price: basePrice,
          quantity: 1,
          options: {
            style: bouquetStyle,
            fulfillment: fulfillment === 'pickup'
              ? 'Pick up — Mile End, Fri May 2nd'
              : 'Delivery — Sat May 3rd (+$10)',
          },
        }),
      })
    )

    // Delivery surcharge
    if (fulfillment === 'delivery') {
      adds.push(
        fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: 'mothers-day-delivery',
            name: 'Delivery surcharge',
            price: 10,
            quantity: 1,
            options: {},
          }),
        })
      )
    }

    // Custom bouquet upgrade
    if (customBouquet) {
      const upgradePrice = parseInt(customBouquet, 10)
      adds.push(
        fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: `mothers-day-custom-${upgradePrice}`,
            name: `Custom Bouquet Upgrade`,
            price: upgradePrice,
            quantity: 1,
            options: {},
          }),
        })
      )
    }

    // Card add-on
    if (cardTo || cardMessage) {
      adds.push(
        fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: 'card-addon',
            name: 'Card Add-on',
            price: 4,
            quantity: 1,
            options: {
              ...(cardTo ? { to: cardTo } : {}),
              ...(cardMessage ? { message: cardMessage } : {}),
            },
          }),
        })
      )
    }

    await Promise.all(adds)
    router.push('/cart')
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Name" name="name" type="text" required />
        <Field label="Email" name="email" type="email" required />
      </div>
      <Field label="Phone" name="phone" type="tel" required />

      {/* Pickup / delivery */}
      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">
          Fulfillment *
        </label>
        <div className="flex flex-col gap-2 font-sans text-sm">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="fulfillment" value="pickup" defaultChecked className="accent-purple" />
            Pick up in Mile End — Fri May 2nd, 10am–5pm
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="fulfillment" value="delivery" className="accent-purple" />
            Delivery — Sat May 3rd (+$10)
          </label>
        </div>
      </div>

      <Field label="Delivery Address" name="address" type="text" hint="Only required if choosing delivery." />
      <Field label="Preferred Delivery Time" name="delivery_time" type="text" hint="e.g. Morning, Afternoon" />

      {/* Bouquet selection */}
      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">
          $60 Bouquet Style *
        </label>
        <select name="bouquet_style" required className="border-2 border-foreground bg-background font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple appearance-none">
          <option value="">Select a style…</option>
          <option value="Soft & Warm">Soft &amp; Warm</option>
          <option value="Bold & Bright">Bold &amp; Bright</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">
          Custom Bouquet
        </label>
        <select name="custom_bouquet" className="border-2 border-foreground bg-background font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple appearance-none">
          <option value="">None</option>
          <option value="80">Custom Bouquet — $80</option>
          <option value="100">Custom Bouquet — $100</option>
        </select>
      </div>

      <Textarea label="Notes on Style / Colour" name="style_notes" rows={3} />

      {/* Card */}
      <div className="flex flex-col gap-2 p-5 bg-foreground/5">
        <p className="font-sans text-xs uppercase tracking-widest font-semibold">
          Add a Card — $4 (optional)
        </p>
        <Field label="Name of Mother" name="card_to" type="text" />
        <Textarea label="Message" name="card_message" rows={3} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
      >
        {submitting ? 'Adding to cart…' : 'Add to Cart'}
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
