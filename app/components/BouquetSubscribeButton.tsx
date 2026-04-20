'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  variationId: string
  tierLabel: string
  tierPrice: number
  tierBouquets: number
  subscribeBtn: string
  deliveryLabel: string
  pickUpOption: string
  pickUpOption2: string
  deliveryOption: string
  stockCount?: number | null
}

export function BouquetSubscribeButton({
  variationId,
  tierLabel,
  tierPrice,
  tierBouquets,
  subscribeBtn,
  deliveryLabel,
  pickUpOption,
  pickUpOption2,
  deliveryOption,
  stockCount,
}: Props) {
  const router = useRouter()
  const [delivery, setDelivery] = useState('pickup1')
  const [state, setState] = useState<'idle' | 'adding' | 'added'>('idle')

  const soldOut = stockCount === 0

  const isDelivery = delivery === 'delivery'
  const total = isDelivery ? tierPrice + 10 * tierBouquets : tierPrice

  async function handleClick() {
    setState('adding')

    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: variationId,
        name: tierLabel,
        price: tierPrice,
        quantity: 1,
        options: {
          pickup: delivery === 'pickup1' ? pickUpOption : delivery === 'pickup2' ? pickUpOption2 : 'Delivery',
        },
      }),
    })

    if (isDelivery) {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: `delivery-surcharge:${variationId}`,
          name: 'Home Delivery',
          price: 10 * tierBouquets,
          quantity: 1,
          options: { for: tierLabel },
        }),
      })
    }

    setState('added')
    router.refresh()
    window.dispatchEvent(new Event('cart-updated'))
    setTimeout(() => setState('idle'), 1500)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">{deliveryLabel}</label>
        <div className="relative">
          <select
            value={delivery}
            onChange={(e) => setDelivery(e.target.value)}
            disabled={soldOut}
            className="w-full border-2 border-foreground bg-background font-sans text-sm px-4 py-3 pr-10 focus:outline-none focus:border-orange-500 appearance-none text-foreground disabled:opacity-50"
          >
            <option value="pickup1">{pickUpOption}</option>
            <option value="pickup2">{pickUpOption2}</option>
            <option value="delivery">{deliveryOption}</option>
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-foreground">&#8964;</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={soldOut || state === 'adding'}
        className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-4 py-2 hover:bg-orange-500 hover:border-[#E6E6FA] hover:text-[#E6E6FA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {soldOut ? 'Sold Out' : state === 'adding' ? 'Adding…' : state === 'added' ? 'Added!' : `${subscribeBtn}${total}.00`}
      </button>
    </div>
  )
}
