import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { enforceRateLimit } from '@/app/lib/rateLimit'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, 'inquire')
  if (rateLimited) return rateLimited

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_TYPES,
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // No-op: the inquiry route fetches + deletes the blob at submit time.
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (err) {
    console.error('Wedding photo upload token error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 400 })
  }
}
