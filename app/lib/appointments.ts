
import { getSquareClient, LOCATION_ID } from '@/app/lib/square'
import { getAppointmentServiceVariationId } from '@/app/lib/catalog'

export type PickupSlotSerialized = {
  startAt: string
  durationMinutes: number
  serviceVariationId: string
  serviceVariationVersion: string // BigInt as decimal string
  teamMemberId: string
}

export async function searchPickupAvailability(
  startDate: string,
  endDate: string,
): Promise<PickupSlotSerialized[]> {
  const serviceName = 'Pickup'
  const serviceVariationId = await getAppointmentServiceVariationId(serviceName)
  if (!serviceVariationId) throw new Error(`No appointment service variation found for "${serviceName}"`)


  const client = getSquareClient()
  const response = await client.bookings.searchAvailability({
    query: {
      filter: {
        startAtRange: {
          startAt: new Date(Math.max(
            new Date(`${startDate}T00:00:00Z`).getTime(),
            Date.now(),
          )).toISOString(),
          endAt: `${endDate}T23:59:59Z`,
        },
        locationId: LOCATION_ID,
        segmentFilters: [
          {
            serviceVariationId,
          },
        ],
      },
    },
  })

  const availabilities = response.availabilities ?? []
  const seen = new Set<string>()
  const slots: PickupSlotSerialized[] = []

  for (const avail of availabilities) {
    const startAt = avail.startAt
    if (!startAt || seen.has(startAt)) continue
    seen.add(startAt)

    const seg = avail.appointmentSegments?.[0]
    if (!seg) continue

    slots.push({
      startAt,
      durationMinutes: seg.durationMinutes ?? 0,
      serviceVariationId: seg.serviceVariationId ?? serviceVariationId,
      serviceVariationVersion: String(seg.serviceVariationVersion ?? '0'),
      teamMemberId: seg.teamMemberId ?? '',
    })
  }

  slots.sort((a, b) => a.startAt.localeCompare(b.startAt))
  return slots
}

export async function createPickupBooking(
  slot: PickupSlotSerialized,
  customerNote: string,
): Promise<string> {
  const client = getSquareClient()
  const response = await client.bookings.create({
    idempotencyKey: crypto.randomUUID(),
    booking: {
      locationId: LOCATION_ID,
      startAt: slot.startAt,
      customerNote,
      appointmentSegments: [
        {
          durationMinutes: slot.durationMinutes,
          serviceVariationId: slot.serviceVariationId,
          serviceVariationVersion: BigInt(slot.serviceVariationVersion),
          teamMemberId: slot.teamMemberId,
        },
      ],
    },
  })

  const bookingId = response.booking?.id
  if (!bookingId) throw new Error('Square did not return a booking ID')
  return bookingId
}
