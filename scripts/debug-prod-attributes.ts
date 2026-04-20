/**
 * Inspects production Square catalog to diagnose French attribute issues.
 * Prints:
 *   1. All custom attribute definitions (their API keys, names, types)
 *   2. A sample of items from each category with their customAttributeValues
 *
 * Run: npx tsx scripts/debug-prod-attributes.ts
 */

import { SquareClient, SquareEnvironment } from 'square'
import type { CatalogObject } from 'square'
import * as fs from 'fs'

// Load production credentials from .env.local
const prodEnvLines = fs.readFileSync('.env.local', 'utf-8').split('\n')
for (const line of prodEnvLines) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox,
})

async function main() {
  console.log(`=== Square environment: ${process.env.SQUARE_ENVIRONMENT ?? 'sandbox'} ===\n`)

  // 1. List all custom attribute definitions
  console.log('--- Custom Attribute Definitions ---')
  const defs: { key: string; name: string; id: string }[] = []
  for await (const obj of await client.catalog.list({ types: 'CUSTOM_ATTRIBUTE_DEFINITION' })) {
    if (obj.type === 'CUSTOM_ATTRIBUTE_DEFINITION' && 'customAttributeDefinitionData' in obj) {
      const d = (obj as { customAttributeDefinitionData?: { key?: string; name?: string; type?: string } }).customAttributeDefinitionData
      console.log(`  key="${d?.key}"  name="${d?.name}"  type=${d?.type}  id=${obj.id}`)
      if (d?.key && d?.name && obj.id) defs.push({ key: d.key, name: d.name, id: obj.id })
    }
  }
  if (defs.length === 0) console.log('  (none found)')

  // 2. Fetch categories
  console.log('\n--- Categories ---')
  const catMap = new Map<string, string>() // id → name
  for await (const obj of await client.catalog.list({ types: 'CATEGORY' })) {
    if (obj.type === 'CATEGORY' && 'categoryData' in obj && obj.id) {
      const name = (obj as { categoryData?: { name?: string } }).categoryData?.name ?? ''
      catMap.set(obj.id, name)
      console.log(`  id=${obj.id}  name="${name}"`)
    }
  }

  // 3. Fetch items — show customAttributeValues per item
  console.log('\n--- Items (customAttributeValues) ---')
  let itemCount = 0
  for await (const obj of await client.catalog.list({ types: 'ITEM' })) {
    if (obj.type !== 'ITEM' || !('itemData' in obj)) continue
    itemCount++

    const itemData = (obj as { itemData?: { name?: string; categories?: { id?: string }[]; reportingCategoryId?: string; variations?: CatalogObject[] } }).itemData
    const catId = itemData?.categories?.[0]?.id ?? itemData?.reportingCategoryId
    const catName = catId ? (catMap.get(catId) ?? `(unknown cat: ${catId})`) : '(no category)'
    const attrs = ('customAttributeValues' in obj
      ? obj.customAttributeValues
      : undefined) as Record<string, { stringValue?: string | null; numberValue?: string | null }> | undefined

    const attrSummary = attrs && Object.keys(attrs).length > 0
      ? Object.entries(attrs).map(([k, v]) => `${k}="${v.stringValue ?? v.numberValue ?? '?'}"`).join(', ')
      : '(none)'

    console.log(`  [${catName}] "${itemData?.name}"  attrs: ${attrSummary}`)

    // Also print variation attributes
    for (const v of itemData?.variations ?? []) {
      const vData = 'itemVariationData' in v ? (v as { itemVariationData?: { name?: string } }).itemVariationData : undefined
      const vAttrs = ('customAttributeValues' in v
        ? v.customAttributeValues
        : undefined) as Record<string, { stringValue?: string | null; numberValue?: string | null }> | undefined
      if (vAttrs && Object.keys(vAttrs).length > 0) {
        const vAttrSummary = Object.entries(vAttrs).map(([k, av]) => `${k}="${av.stringValue ?? av.numberValue ?? '?'}"`).join(', ')
        console.log(`    variation "${vData?.name}"  attrs: ${vAttrSummary}`)
      }
    }
  }

  console.log(`\nTotal items scanned: ${itemCount}`)
  console.log('\nDone.')
}

main().catch((err) => { console.error(err); process.exit(1) })
