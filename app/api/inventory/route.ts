import { NextResponse } from 'next/server'
import { getSquareClient, LOCATION_ID, PRODUCT_VARIATION_MAP } from '@/app/lib/square'

/**
 * GET /api/inventory?productIds=id1,id2,...
 *
 * Returns stock counts keyed by local productId.
 * Example response: { "subscription-8weeks": 18, "vase-sgraffito": 1 }
 *
 * Items with no catalog mapping (e.g. delivery surcharges) are omitted.
 * Items with no inventory record are returned as null (untracked).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawIds = searchParams.get('productIds')

  if (!rawIds) {
    return NextResponse.json({ error: 'productIds query param required' }, { status: 400 })
  }

  const productIds = rawIds.split(',').map((id) => id.trim()).filter(Boolean)

  // Resolve to variation IDs, keeping track of which local IDs map to which variation IDs
  const variationToProductId: Record<string, string> = {}
  const variationIds: string[] = []

  for (const productId of productIds) {
    const variationId = PRODUCT_VARIATION_MAP[productId]
    if (variationId && !variationToProductId[variationId]) {
      variationToProductId[variationId] = productId
      variationIds.push(variationId)
    }
  }

  if (variationIds.length === 0) {
    return NextResponse.json({})
  }

  try {
    const client = getSquareClient()
    const response = await client.inventory.batchGetCounts({
      catalogObjectIds: variationIds,
      locationIds: [LOCATION_ID],
    })

    const counts: Record<string, number | null> = {}

    // Initialise all requested productIds as null (untracked) by default
    for (const productId of productIds) {
      if (PRODUCT_VARIATION_MAP[productId]) {
        counts[productId] = null
      }
    }

    for (const count of response.counts ?? []) {
      if (!count.catalogObjectId) continue
      const productId = variationToProductId[count.catalogObjectId]
      if (!productId) continue
      counts[productId] =
        count.state === 'IN_STOCK' ? Math.max(0, Number(count.quantity ?? 0)) : 0
    }

    return NextResponse.json(counts)
  } catch (err) {
    console.error('Inventory check error:', err)
    return NextResponse.json({ error: 'Failed to fetch inventory.' }, { status: 500 })
  }
}
