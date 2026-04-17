/**
 * Uploads vase images from /public/Vases/ to Square and attaches them to the
 * correct catalog items. Run once; safe to re-run (idempotency via name check).
 *
 * Run: npx tsx scripts/upload-vase-images.ts
 */

import { SquareClient, SquareEnvironment } from 'square'
import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'crypto'

const envLines = fs.readFileSync('.env.local', 'utf-8').split('\n')
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

const VASE_IMAGES: { itemId: string; name: string; files: string[] }[] = [
  {
    itemId: 'BMM4FRR3UURM2XJNMDA2N2GK',
    name: 'Sgraffito Vase',
    files: ['1c.jpg', '2b.jpg', '3b.jpg'],
  },
  {
    itemId: 'R7M4YSWFWQUQ6FK4LYZPPU5S',
    name: 'Butter Yellow Vase',
    files: ['4c.jpg', '5.jpg'],
  },
  {
    itemId: 'ZNUTCBCPAJQMI6MV6FN3LKHI',
    name: 'Seafoam Loop Vase',
    files: ['6c.jpg', '7.jpg'],
  },
]

const PUBLIC_VASES = path.join(process.cwd(), 'public', 'Vases')

async function uploadImage(itemId: string, filePath: string, imageName: string): Promise<string | null> {
  const imageData = fs.readFileSync(filePath)
  const blob = new Blob([imageData], { type: 'image/jpeg' })

  try {
    const res = await client.catalog.images.create({
      request: {
        idempotencyKey: randomUUID(),
        objectId: itemId,
        image: {
          type: 'IMAGE',
          id: `#${randomUUID()}`,
          imageData: {
            name: imageName,
            caption: imageName,
          },
        },
      },
      imageFile: blob,
    })

    const url = res.image && 'imageData' in res.image ? res.image.imageData?.url : undefined
    console.log(`  ✓ Uploaded ${path.basename(filePath)} → ${url ?? res.image?.id}`)
    return res.image?.id ?? null
  } catch (err: unknown) {
    console.error(`  ✗ Failed to upload ${path.basename(filePath)}:`, err)
    return null
  }
}

async function main() {
  for (const vase of VASE_IMAGES) {
    console.log(`\nUploading images for ${vase.name} (${vase.itemId})...`)

    for (const file of vase.files) {
      const filePath = path.join(PUBLIC_VASES, file)
      if (!fs.existsSync(filePath)) {
        console.warn(`  ⚠ File not found: ${filePath}`)
        continue
      }
      await uploadImage(vase.itemId, filePath, `${vase.name} — ${file.replace('.jpg', '')}`)
    }
  }

  console.log('\nDone. Images are now attached to their Square catalog items.')
}

main().catch((err) => { console.error(err); process.exit(1) })
