import { getSquareClient, LOCATION_ID } from '@/app/lib/square'

/**
 * Fetch Square inventory counts by Square variation ID.
 * Returns a map of variationId → count (null = untracked, 0 = sold out).
 * Safe to call from Server Components.
 */
export async function getInventoryByVariationId(
  variationIds: string[]
): Promise<Record<string, number | null>> {
  const counts: Record<string, number | null> = {}
  for (const id of variationIds) counts[id] = null

  if (variationIds.length === 0) return counts

  try {
    const client = getSquareClient()
    const response = await client.inventory.batchGetCounts({
      catalogObjectIds: variationIds,
      locationIds: [LOCATION_ID],
    })

    for (const count of response.data ?? []) {
      if (!count.catalogObjectId) continue
      counts[count.catalogObjectId] =
        count.state === 'IN_STOCK' ? Math.max(0, Number(count.quantity ?? 0)) : 0
    }
  } catch (err) {
    console.error('Inventory fetch error:', err)
  }

  return counts
}
