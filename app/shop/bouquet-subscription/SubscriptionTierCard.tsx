'use client'

import { useState } from 'react'
import { AddToCartButton } from '@/app/components/AddToCartButton'

type Tier = {
  id: string
  productId: string
  label: string
  dates: string
  price: number
  available: number
}

export function SubscriptionTierCard({ tier }: { tier: Tier }) {
  const [delivery, setDelivery] = useState<'pickup' | 'delivery'>('pickup')
  const price = delivery === 'delivery' ? tier.price + 10 : tier.price

  const item = {
    productId: tier.productId,
    name: `Bouquet Subscription — ${tier.label}`,
    price,
    quantity: 1,
    options: {
      delivery: delivery === 'pickup' ? 'Pick up — Mile End, Saturdays' : 'Home delivery (+$10/bouquet)',
      dates: tier.dates,
    },
  }

  return (
    <div className="border-2 border-foreground/20 p-6 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display font-black text-xl leading-tight">{tier.label}</p>
          <p className="font-sans text-sm text-foreground/60 mt-1">From {tier.dates}</p>
          <p className="font-sans text-xs text-foreground/50 mt-0.5">{tier.available} available</p>
        </div>
        <p className="font-display font-black text-2xl whitespace-nowrap">${price}.00</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">Delivery option</label>
        <select
          value={delivery}
          onChange={(e) => setDelivery(e.target.value as 'pickup' | 'delivery')}
          className="border-2 border-foreground bg-background font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple appearance-none"
        >
          <option value="pickup">Pick up — Mile End, Saturdays</option>
          <option value="delivery">Home delivery (+$10/bouquet)</option>
        </select>
      </div>

      <AddToCartButton item={item} label={`Subscribe — $${price}.00`} />
    </div>
  )
}
