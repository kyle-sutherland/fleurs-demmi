/**
 * Reads name_fr / description_fr / fr_name custom attributes from sandbox
 * catalog items, then upserts them onto matching production items (matched by
 * category name + item name + variation name).
 *
 * Prerequisites:
 *   - .env.local must have production credentials (SQUARE_ACCESS_TOKEN, SQUARE_ENVIRONMENT=production)
 *   - .env.sandbox must exist with SQUARE_ACCESS_TOKEN=<sandbox token>
 *
 * Run: npx tsx scripts/migrate-fr-attributes.ts
 */

import { SquareClient, SquareEnvironment } from 'square'
import type { CatalogObject } from 'square'
import * as fs from 'fs'
import { randomUUID } from 'crypto'

// Load production credentials from .env.local
const prodEnvLines = fs.readFileSync('.env.local', 'utf-8').split('\n')
for (const line of prodEnvLines) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

// Load sandbox token from .env.sandbox
const sandboxEnv: Record<string, string> = {}
const sandboxEnvLines = fs.readFileSync('.env.sandbox', 'utf-8').split('\n')
for (const line of sandboxEnvLines) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) sandboxEnv[key.trim()] = rest.join('=').trim()
}

const sandboxClient = new SquareClient({
  token: sandboxEnv.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox,
})

const prodClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Production,
})

type FrenchData = {
  name_fr: string | null
  description_fr: string | null
  variations: Map<string, string | null> // variationName → fr_name
}

function getStringAttr(obj: CatalogObject, key: string): string | null {
  const attrs = 'customAttributeValues' in obj
    ? (obj.customAttributeValues as Record<string, { stringValue?: string | null }> | undefined)
    : undefined
  return attrs?.[key]?.stringValue ?? null
}

async function fetchCategoryMap(client: SquareClient): Promise<Map<string, string>> {
  const map = new Map<string, string>() // id → name
  for await (const obj of await client.catalog.list({ types: 'CATEGORY' })) {
    if (obj.type === 'CATEGORY' && 'categoryData' in obj && obj.id) {
      map.set(obj.id, (obj as { categoryData?: { name?: string } }).categoryData?.name ?? '')
    }
  }
  return map
}

function itemKey(categoryName: string, itemName: string): string {
  return `${categoryName.toLowerCase()}:${itemName.toLowerCase()}`
}

function resolveCategory(obj: CatalogObject, categoryMap: Map<string, string>): string {
  const itemData = 'itemData' in obj ? (obj as { itemData?: { categories?: { id?: string }[]; reportingCategoryId?: string } }).itemData : undefined
  // Try first category from itemData.categories array
  const firstCatId = itemData?.categories?.[0]?.id ?? itemData?.reportingCategoryId
  return firstCatId ? (categoryMap.get(firstCatId) ?? '') : ''
}

async function fetchSandboxFrenchData(): Promise<Map<string, FrenchData>> {
  console.log('Fetching sandbox categories...')
  const catMap = await fetchCategoryMap(sandboxClient)
  console.log(`  Found ${catMap.size} categories`)

  console.log('Fetching sandbox items...')
  const lookup = new Map<string, FrenchData>()

  for await (const obj of await sandboxClient.catalog.list({ types: 'ITEM' })) {
    if (obj.type !== 'ITEM' || !('itemData' in obj)) continue

    const itemData = (obj as { itemData?: { name?: string; variations?: CatalogObject[] } }).itemData
    if (!itemData?.name) continue

    const catName = resolveCategory(obj, catMap)
    const key = itemKey(catName, itemData.name)

    // sandbox may have been seeded with either key — prefer name_fr (matches catalog.ts)
    const name_fr = getStringAttr(obj, 'name_fr') ?? getStringAttr(obj, 'fr_name')
    const description_fr = getStringAttr(obj, 'description_fr') ?? getStringAttr(obj, 'fr_description')

    const variations = new Map<string, string | null>()
    for (const v of itemData.variations ?? []) {
      const vData = 'itemVariationData' in v ? (v as { itemVariationData?: { name?: string } }).itemVariationData : undefined
      const vName = vData?.name ?? ''
      if (vName) {
        const vFrName = getStringAttr(v, 'name_fr') ?? getStringAttr(v, 'fr_name')
        variations.set(vName.toLowerCase(), vFrName)
      }
    }

    if (name_fr || description_fr || variations.size > 0) {
      lookup.set(key, { name_fr, description_fr, variations })
      console.log(`  ✓ Sandbox [${catName}] ${itemData.name}${name_fr ? ` → "${name_fr}"` : ' (no name_fr)'}`)
    } else {
      console.log(`  ⚠ Sandbox [${catName}] ${itemData.name} — no French attributes found`)
    }
  }

  return lookup
}

async function ensureProdAttributeDefinitions(): Promise<void> {
  console.log('\nChecking production custom attribute definitions...')
  const existingByKey = new Map<string, string>() // key → id
  for await (const obj of await prodClient.catalog.list({ types: 'CUSTOM_ATTRIBUTE_DEFINITION' })) {
    if (obj.type === 'CUSTOM_ATTRIBUTE_DEFINITION' && 'customAttributeDefinitionData' in obj && obj.id) {
      const key = (obj as { customAttributeDefinitionData?: { key?: string } }).customAttributeDefinitionData?.key
      if (key) existingByKey.set(key, obj.id)
    }
  }
  console.log(`  Existing definitions: ${[...existingByKey.keys()].join(', ') || '(none)'}`)

  // Delete any spurious definitions using the old key convention
  const spuriousKeys = ['fr_name', 'fr_description']
  const spuriousIds = spuriousKeys.map((k) => existingByKey.get(k)).filter((id): id is string => !!id)
  if (spuriousIds.length > 0) {
    await prodClient.catalog.batchDelete({ objectIds: spuriousIds })
    spuriousKeys.forEach((k) => existingByKey.delete(k))
    console.log(`  ✓ Deleted spurious definitions: ${spuriousKeys.filter((k) => !existingByKey.has(k)).join(', ')}`)
  }

  const needed = [
    { key: 'name_fr', name: 'French Name', allowedObjectTypes: ['ITEM', 'ITEM_VARIATION'] },
    { key: 'description_fr', name: 'French Description', allowedObjectTypes: ['ITEM'] },
  ]

  const toCreate = needed.filter((d) => !existingByKey.has(d.key))
  if (toCreate.length === 0) {
    console.log('  All definitions already exist.')
    return
  }

  const objects: CatalogObject[] = toCreate.map((d) => ({
    type: 'CUSTOM_ATTRIBUTE_DEFINITION',
    id: `#def-${d.key}`,
    customAttributeDefinitionData: {
      type: 'STRING',
      name: d.name,
      key: d.key,
      allowedObjectTypes: d.allowedObjectTypes,
    },
  } as CatalogObject))

  const res = await prodClient.catalog.batchUpsert({
    idempotencyKey: randomUUID(),
    batches: [{ objects }],
  })
  console.log(`  ✓ Created ${res.objects?.length ?? 0} definitions: ${toCreate.map((d) => d.key).join(', ')}`)
}

async function migrateToProd(lookup: Map<string, FrenchData>): Promise<void> {
  console.log('\nFetching production categories...')
  const catMap = await fetchCategoryMap(prodClient)
  console.log(`  Found ${catMap.size} categories`)

  console.log('Fetching production items...')
  const toUpsert: CatalogObject[] = []
  let matched = 0
  let skipped = 0

  for await (const obj of await prodClient.catalog.list({ types: 'ITEM' })) {
    if (obj.type !== 'ITEM' || !('itemData' in obj)) continue

    const itemData = (obj as { itemData?: { name?: string; variations?: CatalogObject[] } }).itemData
    if (!itemData?.name) continue

    const catName = resolveCategory(obj, catMap)
    const key = itemKey(catName, itemData.name)
    const fr = lookup.get(key)

    if (!fr) {
      console.log(`  — No match for [${catName}] ${itemData.name}`)
      skipped++
      continue
    }

    // Clone object and patch custom attributes
    const updatedObj = structuredClone(obj) as CatalogObject & {
      customAttributeValues?: Record<string, { stringValue?: string }>
      itemData?: { variations?: (CatalogObject & { customAttributeValues?: Record<string, { stringValue?: string }> })[] }
    }

    updatedObj.customAttributeValues ??= {}
    if (fr.name_fr) updatedObj.customAttributeValues['name_fr'] = { stringValue: fr.name_fr }
    if (fr.description_fr) updatedObj.customAttributeValues['description_fr'] = { stringValue: fr.description_fr }

    for (const v of updatedObj.itemData?.variations ?? []) {
      const vData = 'itemVariationData' in v ? (v as { itemVariationData?: { name?: string } }).itemVariationData : undefined
      const vName = vData?.name?.toLowerCase() ?? ''
      const fr_name = fr.variations.get(vName)
      if (fr_name) {
        v.customAttributeValues ??= {}
        v.customAttributeValues['name_fr'] = { stringValue: fr_name }
      }
    }

    toUpsert.push(updatedObj)
    console.log(`  ✓ Queued [${catName}] ${itemData.name}`)
    matched++
  }

  console.log(`\nMatched: ${matched}, Skipped: ${skipped}`)

  if (toUpsert.length === 0) {
    console.log('Nothing to upsert.')
    return
  }

  // Batch upsert in groups of 10 objects
  const BATCH_SIZE = 10
  for (let i = 0; i < toUpsert.length; i += BATCH_SIZE) {
    const batch = toUpsert.slice(i, i + BATCH_SIZE)
    console.log(`\nUpserting batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} items)...`)
    try {
      const res = await prodClient.catalog.batchUpsert({
        idempotencyKey: randomUUID(),
        batches: [{ objects: batch }],
      })
      const count = res.objects?.length ?? 0
      console.log(`  ✓ Upserted ${count} objects`)
      if (res.idMappings?.length) {
        console.log(`  ID mappings: ${res.idMappings.length}`)
      }
    } catch (err) {
      console.error(`  ✗ Batch failed:`, err)
    }
  }
}

async function main() {
  console.log('=== Migrating French attributes: sandbox → production ===\n')

  const lookup = await fetchSandboxFrenchData()
  console.log(`\nBuilt lookup with ${lookup.size} entries`)

  if (lookup.size === 0) {
    console.log('No French attributes found in sandbox. Exiting.')
    return
  }

  await ensureProdAttributeDefinitions()
  await migrateToProd(lookup)

  console.log('\nDone.')
}

main().catch((err) => { console.error(err); process.exit(1) })
