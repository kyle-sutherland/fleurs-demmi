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
type FrenchKeys = { nameKeys: string[]; descriptionKeys: string[] }

// Builds a prioritized key list for French attribute lookup.
// Dashboard-created definitions appear in customAttributeValues as "Square:{uuid}";
// API-created definitions appear as plain "name_fr" / "description_fr".
// Dashboard keys are listed first so the client's UI-managed values take priority.
async function resolveFrenchKeys(client: SquareClient): Promise<FrenchKeys> {
  const nameKeys: string[] = []
  const descriptionKeys: string[] = []
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
    }
  } catch { /* fall through to legacy keys only */ }
  nameKeys.push('name_fr')
  descriptionKeys.push('description_fr')
  return { nameKeys, descriptionKeys }
}

function firstString(attrs: AttrMap | null | undefined, keys: string[]): string | null {
  for (const key of keys) {
    const val = attrs?.[key]?.stringValue
    if (val) return val
  }
  return null
}

function buildProduct(obj: CatalogObject, locale: string, imageUrlMap: Map<string, string>, frKeys: FrenchKeys): CatalogProduct {
  const isFr = locale === 'fr'

  const itemData = 'itemData' in obj ? obj.itemData : undefined
  const attrs = ('customAttributeValues' in obj ? obj.customAttributeValues : undefined) as AttrMap | undefined

  const name = (isFr ? firstString(attrs, frKeys.nameKeys) : null) ?? itemData?.name ?? ''
  const description = (isFr ? firstString(attrs, frKeys.descriptionKeys) : null) ?? itemData?.description ?? null

  const imageUrls = (itemData?.imageIds ?? [])
    .map((imgId) => imageUrlMap.get(imgId))
    .filter((u): u is string => !!u)

  const variations: CatalogVariation[] = (itemData?.variations ?? []).map((v) => {
    const vData = 'itemVariationData' in v ? v.itemVariationData : undefined
    const vAttrs = ('customAttributeValues' in v ? v.customAttributeValues : undefined) as AttrMap | undefined
    const vName = (isFr ? firstString(vAttrs, frKeys.nameKeys) : null) ?? vData?.name ?? ''
    const bouquetsRaw = vAttrs?.['bouquets']?.numberValue
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

    const [res, frKeys] = await Promise.all([
      client.catalog.batchGet({ objectIds: itemIds, includeRelatedObjects: true }),
      resolveFrenchKeys(client),
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
      .map((obj) => buildProduct(obj, locale, imageUrlMap, frKeys))
  } catch (err) {
    console.error(`getCatalogItemsByCategory(${categoryName}) failed:`, err)
    return []
  }
}

export async function getCatalogItem(
  itemId: string,
  locale: string
): Promise<CatalogProduct | null> {
  try {
    const client = getSquareClient()

    const [res, frKeys] = await Promise.all([
      client.catalog.batchGet({ objectIds: [itemId], includeRelatedObjects: true }),
      resolveFrenchKeys(client),
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

    return buildProduct(obj, locale, imageUrlMap, frKeys)
  } catch (err) {
    console.error('getCatalogItem error:', err)
    return null
  }
}
