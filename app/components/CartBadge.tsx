'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

function useCartCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    function fetchCount() {
      fetch('/api/cart')
        .then((r) => r.json())
        .then((cart) => {
          const total = (cart.items ?? []).reduce(
            (sum: number, item: { quantity: number }) => sum + item.quantity,
            0
          )
          setCount(total)
        })
        .catch(() => {})
    }
    fetchCount()
    window.addEventListener('cart-updated', fetchCount)
    return () => window.removeEventListener('cart-updated', fetchCount)
  }, [])

  return count
}

export function CartBadge() {
  const count = useCartCount()

  return (
    <Link href="/cart" className="relative flex items-center gap-1.5 text-xs font-semibold hover:opacity-60 transition-opacity">
      <CartIcon />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] font-bold leading-none w-4 h-4 rounded-full flex items-center justify-center">
          {count}
        </span>
      )}
      {count === 0 && <span>0</span>}
    </Link>
  )
}

export function CartBadgeMobile() {
  const count = useCartCount()

  return (
    <Link href="/cart" className="relative flex items-center gap-1 hover:opacity-60 transition-opacity">
      <CartIcon />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-foreground text-background text-[9px] font-bold leading-none w-3.5 h-3.5 rounded-full flex items-center justify-center">
          {count}
        </span>
      )}
      {count === 0 && <span className="text-xs font-sans font-semibold">0</span>}
    </Link>
  )
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}
