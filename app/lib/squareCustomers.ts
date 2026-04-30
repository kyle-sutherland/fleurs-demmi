import { randomUUID } from 'crypto'
import { getSquareClient } from '@/app/lib/square'

export interface UpsertCustomerData {
  name?: string
  email?: string
  phone?: string
  source: string
  subscribed: 'subscribed' | 'unsubscribed' | 'unknown'
  isOrder?: boolean
}

function splitName(fullName: string): { givenName: string; familyName?: string } {
  const idx = fullName.indexOf(' ')
  if (idx === -1) return { givenName: fullName }
  return { givenName: fullName.slice(0, idx), familyName: fullName.slice(idx + 1) }
}

/**
 * Creates or updates a Square Customer Directory entry, then assigns group memberships.
 * Returns the Square customerId on success, or undefined on failure (never throws).
 *
 * Groups (controlled by env vars):
 *   SQUARE_NEWSLETTER_GROUP_ID  — added when subscribed === 'subscribed'
 *   SQUARE_ORDER_CUSTOMERS_GROUP_ID — added when isOrder === true
 */
export async function upsertSquareCustomer(data: UpsertCustomerData): Promise<string | undefined> {
  const { name, email, phone, source, subscribed, isOrder } = data

  // Square requires at least one identifier; email is our canonical key
  if (!email) return undefined

  try {
    const client = getSquareClient()
    let customerId: string | undefined

    const searchResult = await client.customers.search({
      query: { filter: { emailAddress: { exact: email } } },
    })

    const existing = searchResult.customers?.[0]

    if (existing?.id) {
      customerId = existing.id

      const updateFields: {
        customerId: string
        givenName?: string
        familyName?: string
        phoneNumber?: string
        version?: bigint
      } = { customerId }

      if (!existing.phoneNumber && phone) updateFields.phoneNumber = phone
      if (!existing.givenName && name) {
        const { givenName, familyName } = splitName(name)
        updateFields.givenName = givenName
        if (familyName) updateFields.familyName = familyName
      }

      const hasChanges = Object.keys(updateFields).length > 1
      if (hasChanges) {
        if (existing.version !== undefined) updateFields.version = existing.version
        await client.customers.update(updateFields)
      }
    } else {
      const { givenName, familyName } = name ? splitName(name) : {}
      const createResult = await client.customers.create({
        idempotencyKey: randomUUID(),
        ...(givenName ? { givenName } : {}),
        ...(familyName ? { familyName } : {}),
        emailAddress: email,
        ...(phone ? { phoneNumber: phone } : {}),
        note: source,
      })
      customerId = createResult.customer?.id
    }

    if (!customerId) return undefined

    const groupPromises: Promise<unknown>[] = []
    const newsletterGroupId = process.env.SQUARE_NEWSLETTER_GROUP_ID
    const orderGroupId = process.env.SQUARE_ORDER_CUSTOMERS_GROUP_ID

    if (subscribed === 'subscribed' && newsletterGroupId) {
      groupPromises.push(client.customers.groups.add({ customerId, groupId: newsletterGroupId }))
    }
    if (isOrder && orderGroupId) {
      groupPromises.push(client.customers.groups.add({ customerId, groupId: orderGroupId }))
    }
    if (groupPromises.length > 0) {
      await Promise.all(groupPromises)
    }

    return customerId
  } catch (err) {
    console.error('Square customer upsert error:', err)
    return undefined
  }
}
