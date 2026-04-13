<<<<<<< Updated upstream
'use client'

import { useRouter } from 'next/navigation'

export function CartItemControls({ id, quantity }: { id: string; quantity: number }) {
  const router = useRouter()

  async function update(newQty: number) {
    await fetch('/api/cart', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, quantity: newQty }),
    })
    router.refresh()
  }

  async function remove() {
    await fetch('/api/cart', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3 mt-2">
      <button
        onClick={() => update(quantity - 1)}
        className="w-7 h-7 flex items-center justify-center border-2 border-foreground/30 hover:border-foreground transition-colors font-sans font-bold text-base leading-none"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="font-sans text-sm font-semibold w-5 text-center">{quantity}</span>
      <button
        onClick={() => update(quantity + 1)}
        className="w-7 h-7 flex items-center justify-center border-2 border-foreground/30 hover:border-foreground transition-colors font-sans font-bold text-base leading-none"
        aria-label="Increase quantity"
      >
        +
      </button>
      <button
        onClick={remove}
        className="ml-2 font-sans text-xs uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors underline underline-offset-2"
        aria-label="Remove item"
      >
        Remove
      </button>
    </div>
  )
}
=======
'use client'

import { useRouter } from 'next/navigation'

export function CartItemControls({ id, quantity }: { id: string; quantity: number }) {
  const router = useRouter()

  async function update(newQty: number) {
    await fetch('/api/cart', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, quantity: newQty }),
    })
    router.refresh()
  }

  async function remove() {
    await fetch('/api/cart', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3 mt-2">
      <button
        onClick={() => update(quantity - 1)}
        className="w-7 h-7 flex items-center justify-center border-2 border-foreground/30 hover:border-foreground transition-colors font-sans font-bold text-base leading-none"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="font-sans text-sm font-semibold w-5 text-center">{quantity}</span>
      <button
        onClick={() => update(quantity + 1)}
        className="w-7 h-7 flex items-center justify-center border-2 border-foreground/30 hover:border-foreground transition-colors font-sans font-bold text-base leading-none"
        aria-label="Increase quantity"
      >
        +
      </button>
      <button
        onClick={remove}
        className="ml-2 font-sans text-xs uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors underline underline-offset-2"
        aria-label="Remove item"
      >
        Remove
      </button>
    </div>
  )
}
>>>>>>> Stashed changes
