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
