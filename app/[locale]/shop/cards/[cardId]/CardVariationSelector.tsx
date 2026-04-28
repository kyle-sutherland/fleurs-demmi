'use client'

import { useState } from 'react'
import { AddToCartButton } from '@/app/components/AddToCartButton'

type Variation = {
  variationId: string
  name: string
  priceInCents: number
  priceFormatted: string
}

type Labels = {
  default: string
  adding: string
  added: string
  soldOut: string
}

type Props = {
  variations: Variation[]
  inventory: Record<string, number | null>
  itemName: string
  labels: Labels
}

export function CardVariationSelector({ variations, inventory, itemName, labels }: Props) {
  const [selectedId, setSelectedId] = useState(variations[0]?.variationId ?? '')

  const selected = variations.find(v => v.variationId === selectedId) ?? variations[0]
  const price = selected ? selected.priceInCents / 100 : 0
  const stockCount = selected ? (inventory[selected.variationId] ?? null) : null
  const cartName = variations.length > 1 && selected
    ? `${itemName} — ${selected.name}`
    : itemName

  return (
    <>
      {variations.length > 1 && (
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="font-sans text-sm border-2 border-foreground px-3 py-2 bg-background self-start min-w-[200px] focus:outline-none"
        >
          {variations.map(v => (
            <option key={v.variationId} value={v.variationId}>
              {v.name} — {v.priceFormatted}
            </option>
          ))}
        </select>
      )}
      <p className="font-display font-black text-2xl">
        {selected?.priceFormatted ?? ''}
      </p>
      <AddToCartButton
        item={{ productId: selected?.variationId ?? '', name: cartName, price, quantity: 1 }}
        labels={labels}
        stockCount={stockCount}
      />
    </>
  )
}
