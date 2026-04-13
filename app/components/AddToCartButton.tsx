<<<<<<< Updated upstream
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CartItem } from '@/app/lib/cart'

type Props = {
  item: Omit<CartItem, 'id'>
  label?: string
  className?: string
}

export function AddToCartButton({ item, label, className }: Props) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'adding' | 'added'>('idle')

  async function handleClick() {
    setState('adding')
    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    setState('added')
    router.refresh()
    setTimeout(() => setState('idle'), 1500)
  }

  const defaultClass =
    'self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-8 py-3 hover:bg-foreground hover:text-background transition-colors disabled:opacity-50'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === 'adding'}
      className={className ?? defaultClass}
    >
      {state === 'adding' ? 'Adding…' : state === 'added' ? 'Added!' : (label ?? 'Add to Cart')}
    </button>
  )
}
=======
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CartItem } from '@/app/lib/cart'

type Props = {
  item: Omit<CartItem, 'id'>
  label?: string
  className?: string
}

export function AddToCartButton({ item, label, className }: Props) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'adding' | 'added'>('idle')

  async function handleClick() {
    setState('adding')
    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    setState('added')
    router.refresh()
    setTimeout(() => setState('idle'), 1500)
  }

  const defaultClass =
    'self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-8 py-3 hover:bg-foreground hover:text-background transition-colors disabled:opacity-50'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === 'adding'}
      className={className ?? defaultClass}
    >
      {state === 'adding' ? 'Adding…' : state === 'added' ? 'Added!' : (label ?? 'Add to Cart')}
    </button>
  )
}
>>>>>>> Stashed changes
