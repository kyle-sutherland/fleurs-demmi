'use client'

import { useState } from 'react'
import { AddToCartButton } from '@/app/components/AddToCartButton'
import { VaseSlideshow } from '@/app/[locale]/shop/vases/[vaseId]/VaseSlideshow'

type Variation = {
  variationId: string
  name: string
  priceInCents: number
  priceFormatted: string
  imageUrls: string[]
}

type Labels = {
  default: string
  adding: string
  added: string
  soldOut: string
}

type Props = {
  variations: Variation[]
  itemImageUrls: string[]
  inventory: Record<string, number | null>
  itemName: string
  description: string | null
  pickupText: string | null
  labels: Labels
  selectColourLabel: string
}

export function CardVariationSelector({
  variations,
  itemImageUrls,
  inventory,
  itemName,
  description,
  pickupText,
  labels,
  selectColourLabel,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    variations.length === 1 ? variations[0].variationId : null
  )

  const selected = selectedId ? variations.find(v => v.variationId === selectedId) : null
  const price = selected ? selected.priceInCents / 100 : 0
  const stockCount = selected ? (inventory[selected.variationId] ?? null) : null
  const cartName = variations.length > 1 && selected
    ? `${itemName} — ${selected.name}`
    : itemName

  const slides = (selected?.imageUrls.length ? selected.imageUrls : itemImageUrls)
    .map(src => ({ src }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
      <VaseSlideshow key={selectedId ?? '__default'} slides={slides} title={itemName} />

      <div className="flex flex-col gap-4">
        <h1 className="font-display font-black text-[8.8vw] md:text-[3vw] leading-none">
          {itemName}
        </h1>
        {description && (
          <p className="font-sans text-sm text-foreground/60 tracking-widest">{description}</p>
        )}
        {pickupText && (
          <p className="font-sans text-sm text-foreground/60">{pickupText}</p>
        )}
        {variations.length > 1 && (
          <select
            value={selectedId ?? ''}
            onChange={e => setSelectedId(e.target.value || null)}
            className="font-sans text-sm border-2 border-foreground px-3 py-2 bg-background self-start min-w-[200px] focus:outline-none"
          >
            <option value="" disabled>{selectColourLabel}</option>
            {variations.map(v => (
              <option key={v.variationId} value={v.variationId}>
                {v.name} — {v.priceFormatted}
              </option>
            ))}
          </select>
        )}
        {selected && (
          <>
            <p className="font-display font-black text-2xl">{selected.priceFormatted}</p>
            <AddToCartButton
              item={{ productId: selected.variationId, name: cartName, price, quantity: 1 }}
              labels={labels}
              stockCount={stockCount}
            />
          </>
        )}
      </div>
    </div>
  )
}
