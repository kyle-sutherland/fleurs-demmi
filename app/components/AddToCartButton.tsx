'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CartItem } from '@/app/lib/cart'

type Props = {
  item: Omit<CartItem, 'id'>
  label?: string
  className?: string
  stockCount?: number | null  // null = untracked, 0 = sold out, >0 = in stock
}

export function AddToCartButton({ item, label, className, stockCount }: Props) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'adding' | 'added'>('idle')

  const soldOut = stockCount === 0

  async function handleClick() {
    setState('adding')
    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    setState('added')
    router.refresh()
    window.dispatchEvent(new Event('cart-updated'))
    setTimeout(() => setState('idle'), 1500)
  }

  const defaultClass =
    'self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-8 py-3 hover:bg-orange-500 hover:border-[#E6E6FA] hover:text-[#E6E6FA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  const buttonLabel = soldOut
    ? 'Sold Out'
    : state === 'adding'
    ? 'Adding…'
    : state === 'added'
    ? 'Added!'
    : (label ?? 'Add to Cart')

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={soldOut || state === 'adding'}
        className={className ?? defaultClass}
      >
        {buttonLabel}
      </button>
    </div>
  )
}
