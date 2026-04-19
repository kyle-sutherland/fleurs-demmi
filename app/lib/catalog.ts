import type { CatalogObject } from 'square'
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

function localizedString(attrs: AttrMap | null | undefined, key: string): string | null {
  return attrs?.[key]?.stringValue ?? null
}

function buildProduct(obj: CatalogObject, locale: string, imageUrlMap: Map<string, string>): CatalogProduct {
  const isFr = locale === 'fr'

  // CatalogObject is a discriminated union — access itemData via the Item variant
  const itemData = 'itemData' in obj ? obj.itemData : undefined
  const attrs = ('customAttributeValues' in obj ? obj.customAttributeValues : undefined) as AttrMap | undefined

  const name = (isFr ? localizedString(attrs, 'name_fr') : null) ?? itemData?.name ?? ''
  const description = (isFr ? localizedString(attrs, 'description_fr') : null) ?? itemData?.description ?? null

  const imageUrls = (itemData?.imageIds ?? [])
    .map((imgId) => imageUrlMap.get(imgId))
    .filter((u): u is string => !!u)

  const variations: CatalogVariation[] = (itemData?.variations ?? []).map((v) => {
    const vData = 'itemVariationData' in v ? v.itemVariationData : undefined
    const vAttrs = ('customAttributeValues' in v ? v.customAttributeValues : undefined) as AttrMap | undefined
    const vName =
      (isFr ? localizedString(vAttrs, 'variation_name_fr') : null) ??
      vData?.name ??
      ''
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
  const client = getSquareClient()

  try {
    // Find the category ID by name
    const catRes = await client.catalog.search({ objectTypes: ['CATEGORY'] })
    const category = (catRes.objects ?? []).find(
      (o) => 'categoryData' in o && o.categoryData?.name === categoryName
    )
    if (!category?.id) return []

    // Search items belonging to that category
    const searchRes = await client.catalog.searchItems({ categoryIds: [category.id] })
    const itemIds = (searchRes.items ?? [])
      .map((i) => i.id)
      .filter((id): id is string => !!id)
    if (!itemIds.length) return []

    // Fetch full objects with related images
    const res = await client.catalog.batchGet({ objectIds: itemIds, includeRelatedObjects: true })

    const imageUrlMap = new Map<string, string>()
    for (const obj of res.relatedObjects ?? []) {
      if (obj.type === 'IMAGE' && 'imageData' in obj && obj.imageData?.url && obj.id) {
        imageUrlMap.set(obj.id, obj.imageData.url)
      }
    }

    return (res.objects ?? [])
      .filter((obj): obj is CatalogObject => obj.type === 'ITEM' && !obj.isDeleted)
      .map((obj) => buildProduct(obj, locale, imageUrlMap))
  } catch (err) {
    console.error(`getCatalogItemsByCategory(${categoryName}) failed:`, err)
    return []
  }
}

export async function getCatalogItem(
  itemId: string,
  locale: string
): Promise<CatalogProduct | null> {
  const client = getSquareClient()

  const res = await client.catalog.batchGet({
    objectIds: [itemId],
    includeRelatedObjects: true,
  })

  if (res.errors?.length || !res.objects?.length) return null

  const obj = res.objects[0]
  if (obj.type !== 'ITEM' || obj.isDeleted) return null

  const imageUrlMap = new Map<string, string>()
  for (const related of res.relatedObjects ?? []) {
    if (related.type === 'IMAGE' && 'imageData' in related && related.imageData?.url && related.id) {
      imageUrlMap.set(related.id, related.imageData.url)
    }
  }

  return buildProduct(obj, locale, imageUrlMap)
}
