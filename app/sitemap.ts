import type { MetadataRoute } from 'next'
import { getCatalogItemsByCategory } from '@/app/lib/catalog'

const BASE = 'https://fleurs-demmi.ca'
const LOCALES = ['en', 'fr'] as const

function urls(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `${BASE}/${locale}${path}`,
    priority,
    changeFrequency,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [vases, cards] = await Promise.all([
    getCatalogItemsByCategory('Vases', 'en'),
    getCatalogItemsByCategory('Cards & Goodies', 'en'),
  ])

  const vasePaths = vases.flatMap((item) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}/shop/vases/${item.id}`,
      priority: 0.7 as number,
      changeFrequency: 'weekly' as const,
    }))
  )

  const cardPaths = cards.flatMap((item) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}/shop/cards/${item.id}`,
      priority: 0.7 as number,
      changeFrequency: 'weekly' as const,
    }))
  )

  return [
    ...urls('', 1.0, 'weekly'),
    ...urls('/about', 0.8, 'monthly'),
    ...urls('/shop', 0.9, 'weekly'),
    ...urls('/shop/vases', 0.9, 'daily'),
    ...urls('/shop/bouquet-subscription', 0.9, 'weekly'),
    ...urls('/shop/mothers-day', 0.8, 'yearly'),
    ...urls('/shop/cards', 0.8, 'weekly'),
    ...urls('/services', 0.8, 'monthly'),
    ...urls('/services/weddings', 0.8, 'monthly'),
    ...urls('/services/funerals', 0.8, 'monthly'),
    ...vasePaths,
    ...cardPaths,
  ]
}
