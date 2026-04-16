import { SquareClient, SquareEnvironment } from 'square'

export function getSquareClient() {
  return new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment:
      process.env.SQUARE_ENVIRONMENT === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
  })
}

export const LOCATION_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!

/**
 * Maps local productId strings (used in cart cookies) to Square Catalog
 * variation IDs. Update this when new products are added to the catalog.
 *
 * Sandbox IDs — production IDs will differ and should be added here when
 * the production catalog is created.
 */
export const PRODUCT_VARIATION_MAP: Record<string, string> = {
  // Vases
  'vase-sgraffito':          'LVRT5VJR4HZUV6P64BSLWMWQ',
  'vase-butter-yellow':      'GYOEAUYDP7ICZTJZTUYFZAPS',
  'vase-seafoam':            'YXZDR2UJIGBWVTLVJ6N6NC6E',
  // Legacy vase IDs used in vases page (placeholder data — update when real vases are mapped)
  'vase-1':                  'LVRT5VJR4HZUV6P64BSLWMWQ',
  'vase-2':                  'GYOEAUYDP7ICZTJZTUYFZAPS',
  'vase-3':                  'YXZDR2UJIGBWVTLVJ6N6NC6E',

  // Bouquet subscriptions
  'subscription-12weeks':    'BXLPJCWJ6ELJGPNWYEYYYMIR',
  'subscription-8weeks':     'BLMORKE4FZ7NHGVUS6IZT4EI',
  'subscription-monthly':    '4CTQOOT56ZDTQUH3JOB2J3G5',

  // Mother's Day
  'mothers-day-bouquet-50':  'GL3XL3UWM6Z3OH653WX4CV2P',
  'mothers-day-bouquet-60':  'GL3XL3UWM6Z3OH653WX4CV2P', // current form uses $60 — maps to small
  'mothers-day-bouquet-75':  'OCPZOYAGO3HTF4TK5HLHJMPQ',

  // Cards
  'card-addon':              '6Y6ABIYXJAA72P7FTXAV7OB4',
}
