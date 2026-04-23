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

const _locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID
if (!_locationId) throw new Error('NEXT_PUBLIC_SQUARE_LOCATION_ID is not set')
export const LOCATION_ID = _locationId
