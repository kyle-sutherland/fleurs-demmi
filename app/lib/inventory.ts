import { getSquareClient, LOCATION_ID, PRODUCT_VARIATION_MAP } from '@/app/lib/square'

/**
 * Fetch Square inventory counts for a list of local productIds.
 * Returns a map of productId → count (null = untracked, 0 = sold out).
 * Safe to call from Server Components — talks directly to Square, no HTTP round-trip.
 */
export async function getInventory(productIds: string[]): Promise<Record<string, number | null>> {
  const variationToProductId: Record<string, string> = {}
  const variationIds: string[] = []

  for (const productId of productIds) {
    const variationId = PRODUCT_VARIATION_MAP[productId]
    if (variationId && !variationToProductId[variationId]) {
      variationToProductId[variationId] = productId
      variationIds.push(variationId)
    }
  }

  const counts: Record<string, number | null> = {}
  for (const productId of productIds) {
    if (PRODUCT_VARIATION_MAP[productId]) counts[productId] = null
  }

  if (variationIds.length === 0) return counts

  try {
    const client = getSquareClient()
    const response = await client.inventory.batchGetCounts({
      catalogObjectIds: variationIds,
      locationIds: [LOCATION_ID],
    })

    for (const count of response.data ?? []) {
      if (!count.catalogObjectId) continue
      const productId = variationToProductId[count.catalogObjectId]
      if (!productId) continue
      counts[productId] =
        count.state === 'IN_STOCK' ? Math.max(0, Number(count.quantity ?? 0)) : 0
    }
  } catch (err) {
    console.error('Inventory fetch error:', err)
    // Return nulls (untracked) on error — don't block the page
  }

  return counts
}
