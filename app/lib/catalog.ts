import type { CatalogObject, SquareClient } from 'square'
import { getSquareClient } from '@/app/lib/square'

export type CatalogVariation = {
  variationId: string
  name: string          // Localized variation name
  priceMoney: bigint    // In cents (CAD)
  bouquets: number | null
}

export type CatalogProduct = {
  id: string            // Square item ID (used in vase URLs)
  name: string          // Localized item name
  description: string | null
  imageUrls: string[]   // All image URLs from Square CDN
  variations: CatalogVariation[]
}

type AttrMap = Record<string, { stringValue?: string | null; numberValue?: string | null }>
type AttributeKeys = { nameKeys: string[]; descriptionKeys: string[]; bouquetsKey: string }

// Resolves dashboard-created custom attribute keys (stored as "Square:{uuid}") by
// scanning attribute definitions and matching on display name.
async function resolveAttributeKeys(client: SquareClient): Promise<AttributeKeys> {
  const nameKeys: string[] = []
  const descriptionKeys: string[] = []
  let bouquetsKey = 'bouquets' // legacy fallback (plain key)
  try {
    for await (const obj of await client.catalog.list({ types: 'CUSTOM_ATTRIBUTE_DEFINITION' })) {
      if (obj.type !== 'CUSTOM_ATTRIBUTE_DEFINITION' || !('customAttributeDefinitionData' in obj)) continue
      const def = (obj as { customAttributeDefinitionData?: { key?: string; name?: string } }).customAttributeDefinitionData
      const key = def?.key
      const displayName = def?.name?.toLowerCase() ?? ''
      if (!key) continue
      if (key === 'name_fr' || key === 'description_fr') continue // legacy fallbacks added below
      if (displayName === 'name_fr') nameKeys.push(`Square:${key}`)
      else if (displayName === 'description_fr') descriptionKeys.push(`Square:${key}`)
      else if (displayName === 'bouquets') bouquetsKey = `Square:${key}`
    }
  } catch { /* fall through to legacy keys only */ }
  nameKeys.push('name_fr')
  descriptionKeys.push('description_fr')
  return { nameKeys, descriptionKeys, bouquetsKey }
}

function firstString(attrs: AttrMap | null | undefined, keys: string[]): string | null {
  for (const key of keys) {
    const val = attrs?.[key]?.stringValue
    if (val) return val
  }
  return null
}

function buildProduct(obj: CatalogObject, locale: string, imageUrlMap: Map<string, string>, attrKeys: AttributeKeys): CatalogProduct {
  const isFr = locale === 'fr'

  const itemData = 'itemData' in obj ? obj.itemData : undefined
  const attrs = ('customAttributeValues' in obj ? obj.customAttributeValues : undefined) as AttrMap | undefined

  const name = (isFr ? firstString(attrs, attrKeys.nameKeys) : null) ?? itemData?.name ?? ''
  const description = (isFr ? firstString(attrs, attrKeys.descriptionKeys) : null) ?? itemData?.description ?? null

  const imageUrls = (itemData?.imageIds ?? [])
    .map((imgId) => imageUrlMap.get(imgId))
    .filter((u): u is string => !!u)

  const variations: CatalogVariation[] = (itemData?.variations ?? []).map((v) => {
    const vData = 'itemVariationData' in v ? v.itemVariationData : undefined
    const vAttrs = ('customAttributeValues' in v ? v.customAttributeValues : undefined) as AttrMap | undefined
    const vName = (isFr ? firstString(vAttrs, attrKeys.nameKeys) : null) ?? vData?.name ?? ''
    const bouquetsRaw = vAttrs?.[attrKeys.bouquetsKey]?.numberValue
    return {
      variationId: v.id ?? '',
      name: vName,
      priceMoney: vData?.priceMoney?.amount ?? BigInt(0),
      bouquets: bouquetsRaw != null ? Number(bouquetsRaw) : null,
    }
  })

  return { id: obj.id ?? '', name, description, imageUrls, variations }
}

export async function getCatalogItemsByCategory(
  categoryName: string,
  locale: string
): Promise<CatalogProduct[]> {
  try {
    const client = getSquareClient()

    const catRes = await client.catalog.search({ objectTypes: ['CATEGORY'] })
    const category = (catRes.objects ?? []).find(
      (o) => 'categoryData' in o && o.categoryData?.name === categoryName
    )
    if (!category?.id) return []

    const searchRes = await client.catalog.searchItems({ categoryIds: [category.id] })
    const itemIds = (searchRes.items ?? [])
      .map((i) => i.id)
      .filter((id): id is string => !!id)
    if (!itemIds.length) return []

    const [res, attrKeys] = await Promise.all([
      client.catalog.batchGet({ objectIds: itemIds, includeRelatedObjects: true }),
      resolveAttributeKeys(client),
    ])

    if (res.errors?.length) {
      console.error('Catalog fetch error:', res.errors)
      return []
    }

    const imageUrlMap = new Map<string, string>()
    for (const obj of res.relatedObjects ?? []) {
      if (obj.type === 'IMAGE' && 'imageData' in obj && obj.imageData?.url && obj.id) {
        imageUrlMap.set(obj.id, obj.imageData.url)
      }
    }

    return (res.objects ?? [])
      .filter((obj): obj is CatalogObject => obj.type === 'ITEM' && !obj.isDeleted)
      .map((obj) => buildProduct(obj, locale, imageUrlMap, attrKeys))
  } catch (err) {
    console.error(`getCatalogItemsByCategory(${categoryName}) failed:`, err)
    return []
  }
}

export async function getAppointmentServiceVariationId(serviceName: string): Promise<string | null> {
  try {
    const client = getSquareClient()
    for await (const obj of await client.catalog.list({ types: 'ITEM' })) {
      if (
        obj.type !== 'ITEM' ||
        obj.isDeleted ||
        !('itemData' in obj) ||
        obj.itemData?.productType !== 'APPOINTMENTS_SERVICE'
      ) continue
      if (obj.itemData?.name !== serviceName) continue
      const variationId = obj.itemData?.variations?.[0]?.id
      return variationId ?? null
    }
    return null
  } catch (err) {
    console.error('getAppointmentServiceVariationId error:', err)
    return null
  }
}

export async function getCatalogItem(
  itemId: string,
  locale: string
): Promise<CatalogProduct | null> {
  try {
    const client = getSquareClient()

    const [res, attrKeys] = await Promise.all([
      client.catalog.batchGet({ objectIds: [itemId], includeRelatedObjects: true }),
      resolveAttributeKeys(client),
    ])

    if (res.errors?.length || !res.objects?.length) return null

    const obj = res.objects[0]
    if (obj.type !== 'ITEM' || obj.isDeleted) return null

    const imageUrlMap = new Map<string, string>()
    for (const related of res.relatedObjects ?? []) {
      if (related.type === 'IMAGE' && 'imageData' in related && related.imageData?.url && related.id) {
        imageUrlMap.set(related.id, related.imageData.url)
      }
    }

    return buildProduct(obj, locale, imageUrlMap, attrKeys)
  } catch (err) {
    console.error('getCatalogItem error:', err)
    return null
  }
}
