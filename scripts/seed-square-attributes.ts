/**
 * One-time script: creates custom attribute definitions on Square and seeds
 * localized French content (plus the `bouquets` numeric attribute) from the
 * existing translation files onto the appropriate catalog items/variations.
 *
 * Run: npx tsx scripts/seed-square-attributes.ts
 */

import { SquareClient, SquareEnvironment } from 'square'
import type { CatalogObject } from 'square'
import * as dotenv from 'fs'

// Load .env.local manually (tsx doesn't load it automatically)
const envLines = dotenv.readFileSync('.env.local', 'utf-8').split('\n')
for (const line of envLines) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
})

// ── IDs from square-catalog.csv ──────────────────────────────────────────────

const ITEM_IDS = {
  sgraffito:    'BMM4FRR3UURM2XJNMDA2N2GK',
  butterYellow: 'R7M4YSWFWQUQ6FK4LYZPPU5S',
  seafoam:      'ZNUTCBCPAJQMI6MV6FN3LKHI',
  subscription: 'KQ7FWE7PBWTX3KLWP2N3YDIB',
  mothersDay:   'WL4TWQBDVWNCTN2O3QJWJ6Z3',
  card:         'GV5OYCB25VFIHAIXPKVVR7EN',
}

const VARIATION_IDS = {
  sub12weeks:  'BXLPJCWJ6ELJGPNWYEYYYMIR',
  sub8weeks:   'BLMORKE4FZ7NHGVUS6IZT4EI',
  subMonthly:  '4CTQOOT56ZDTQUH3JOB2J3G5',
  mdSmall:     'GL3XL3UWM6Z3OH653WX4CV2P',
  mdLarge:     'OCPZOYAGO3HTF4TK5HLHJMPQ',
}

// ── Step 1: Create custom attribute definitions ───────────────────────────────

async function upsertDefinitions() {
  console.log('Creating custom attribute definitions...')

  const res = await client.catalog.batchUpsert({
    idempotencyKey: 'seed-attr-definitions-v1',
    batches: [{
      objects: [
        {
          type: 'CUSTOM_ATTRIBUTE_DEFINITION',
          id: '#name_fr',
          customAttributeDefinitionData: {
            type: 'STRING',
            name: 'French Name',
            key: 'name_fr',
            allowedObjectTypes: ['ITEM'],
            sellerVisibility: 'SELLER_VISIBILITY_READ_WRITE_VALUES',
            appVisibility: 'APP_VISIBILITY_READ_WRITE_VALUES',
          },
        },
        {
          type: 'CUSTOM_ATTRIBUTE_DEFINITION',
          id: '#description_fr',
          customAttributeDefinitionData: {
            type: 'STRING',
            name: 'French Description',
            key: 'description_fr',
            allowedObjectTypes: ['ITEM'],
            sellerVisibility: 'SELLER_VISIBILITY_READ_WRITE_VALUES',
            appVisibility: 'APP_VISIBILITY_READ_WRITE_VALUES',
          },
        },
        {
          type: 'CUSTOM_ATTRIBUTE_DEFINITION',
          id: '#variation_name_fr',
          customAttributeDefinitionData: {
            type: 'STRING',
            name: 'French Variation Name',
            key: 'variation_name_fr',
            allowedObjectTypes: ['ITEM_VARIATION'],
            sellerVisibility: 'SELLER_VISIBILITY_READ_WRITE_VALUES',
            appVisibility: 'APP_VISIBILITY_READ_WRITE_VALUES',
          },
        },
        {
          type: 'CUSTOM_ATTRIBUTE_DEFINITION',
          id: '#bouquets',
          customAttributeDefinitionData: {
            type: 'NUMBER',
            name: 'Bouquet Count',
            key: 'bouquets',
            allowedObjectTypes: ['ITEM_VARIATION'],
            sellerVisibility: 'SELLER_VISIBILITY_READ_WRITE_VALUES',
            appVisibility: 'APP_VISIBILITY_READ_WRITE_VALUES',
          },
        },
      ],
    }],
  })

  if (res.errors?.length) {
    console.error('Definition errors:', res.errors)
    process.exit(1)
  }

  // Extract the real IDs assigned to our definitions
  const defs: Record<string, string> = {}
  for (const obj of res.objects ?? []) {
    if ('customAttributeDefinitionData' in obj && obj.customAttributeDefinitionData?.key && obj.id) {
      defs[obj.customAttributeDefinitionData.key] = obj.id
    }
  }
  console.log('Definitions created:', defs)
  return defs
}

// ── Step 2: Upsert attribute values onto items and variations ────────────────
// Strategy: fetch each object fully, merge custom attributes, then re-upsert
// the complete object so Square doesn't complain about missing required fields.

const ITEM_ATTRS: Record<string, Record<string, string>> = {
  [ITEM_IDS.sgraffito]:    { name_fr: 'Vase sgraffito' },
  [ITEM_IDS.butterYellow]: { name_fr: 'Vase jaune beurre' },
  [ITEM_IDS.seafoam]:      { name_fr: 'Vase boucle bleu vert' },
  [ITEM_IDS.subscription]: {
    name_fr: 'Abonnement de bouquets',
    description_fr:
      'Bouquets saisonniers aux deux semaines avec des fleurs locales.' +
      ' Cueillette le samedi au Caf\u00e9 Replika ou au D\u00e9panneur Le Pick-Up, 11h\u201316h.' +
      ' Livraison \u00e0 domicile (+10\u00a0$/bouquet).',
  },
  [ITEM_IDS.mothersDay]: { name_fr: 'Bouquets f\u00eate des M\u00e8res' },
  [ITEM_IDS.card]:       { name_fr: 'Cartes et petits cadeaux' },
}

const VARIATION_ATTRS: Record<string, Record<string, string>> = {
  [VARIATION_IDS.sub12weeks]: {
    variation_name_fr: 'Aux deux semaines pour 12 semaines (23 mai\u00a0\u2013\u00a024 oct.)',
    bouquets: '12',
  },
  [VARIATION_IDS.sub8weeks]: {
    variation_name_fr: 'Aux deux semaines pour 8 semaines (20 juin\u00a0\u2013\u00a026 sept.)',
    bouquets: '8',
  },
  [VARIATION_IDS.subMonthly]: {
    variation_name_fr: 'Bouquets mensuels pour 4 mois (18 juill., 29 ao\u00fbt, 26 sept., 24 oct.)',
    bouquets: '4',
  },
  [VARIATION_IDS.mdSmall]: {
    variation_name_fr: 'Arrangement \u00e0 50\u00a0$ (pot Mason 490\u00a0mL)',
  },
  [VARIATION_IDS.mdLarge]: {
    variation_name_fr: 'Arrangement \u00e0 75\u00a0$ (pot Mason 750\u00a0mL)',
  },
}

async function seedValues() {
  const allIds = [
    ...Object.values(ITEM_IDS),
    ...Object.values(VARIATION_IDS),
  ]

  console.log('Fetching full catalog objects...')
  const fetchRes = await client.catalog.batchGet({
    objectIds: allIds,
    includeRelatedObjects: true,
  })
  if (fetchRes.errors?.length) {
    console.error('Fetch errors:', fetchRes.errors)
    process.exit(1)
  }

  const fetched = new Map<string, CatalogObject>()
  for (const obj of fetchRes.objects ?? []) {
    if (obj.id) fetched.set(obj.id, obj)
  }

  const objects: CatalogObject[] = []

  // NUMBER attrs use numberValue; all others use stringValue
  const NUMBER_ATTRS = new Set(['bouquets'])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mergeAttrs(obj: any, attrs: Record<string, string>): any {
    return {
      ...obj,
      customAttributeValues: {
        ...(obj.customAttributeValues ?? {}),
        ...Object.fromEntries(Object.entries(attrs).map(([k, v]) => [
          k,
          NUMBER_ATTRS.has(k) ? { key: k, numberValue: v } : { key: k, stringValue: v },
        ])),
      },
    }
  }

  // Items — merge item-level attrs; also merge any variation-level attrs into
  // the nested variation objects inside itemData so they travel together.
  for (const [id, attrs] of Object.entries(ITEM_ATTRS)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orig = fetched.get(id) as any
    if (!orig) { console.warn(`Item ${id} not found, skipping`); continue }

    const variations = orig.itemData?.variations?.map((v: CatalogObject) => {
      const vAttrs = v.id ? VARIATION_ATTRS[v.id] : undefined
      return vAttrs ? mergeAttrs(v, vAttrs) : v
    })

    const merged = mergeAttrs(orig, attrs)
    if (merged.itemData) merged.itemData = { ...merged.itemData, variations }
    objects.push(merged as CatalogObject)
  }

  // Standalone variation upserts (for MD variations whose parent item already
  // carries the merged variations — but we still need them as top-level objects
  // for cases where the item wasn't in ITEM_ATTRS). Actually, since Mother's Day
  // item IS in ITEM_ATTRS, its variations are already embedded. We're done.

  console.log(`Upserting ${objects.length} objects...`)
  const res = await client.catalog.batchUpsert({
    idempotencyKey: 'seed-attr-values-v3',
    batches: [{ objects }],
  })

  if (res.errors?.length) {
    console.error('Upsert errors:', res.errors)
    process.exit(1)
  }

  console.log(`Seeded ${res.objects?.length ?? 0} objects successfully.`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await upsertDefinitions()
  await seedValues()
  console.log('Done.')
}

main().catch((err) => { console.error(err); process.exit(1) })
