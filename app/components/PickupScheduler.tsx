'use client'

import { useEffect, useState } from 'react'
import type { PickupSlotSerialized } from '@/app/lib/appointments'
import type { Dictionary } from '@/lib/translations/en'

type Props = {
  onSlotSelect: (slot: PickupSlotSerialized | null) => void
  selectedSlot: PickupSlotSerialized | null
  locale: string
  t: Dictionary['checkout']['scheduler']
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'done'; slotsByDate: Map<string, PickupSlotSerialized[]>; availableDays: string[] }

function getWindow(): { start: string; end: string } {
  const today = new Date()
  const s = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
  const e = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 13))
  return { start: s.toISOString().slice(0, 10), end: e.toISOString().slice(0, 10) }
}

function slotDate(startAt: string): string {
  return new Date(startAt).toLocaleDateString('en-CA', { timeZone: 'America/Toronto' })
}

function slotBlockKey(startAt: string): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(startAt))
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10)
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10)
  return hour * 2 + (minute >= 30 ? 1 : 0)
}

function formatDate(dateStr: string, locale: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

function formatBlock(block: number, locale: string): string {
  const hour = Math.floor(block / 2)
  const minute = block % 2 === 0 ? 0 : 30
  const d = new Date(2000, 0, 1, hour, minute)
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

function formatTime(startAt: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    timeZone: 'America/Toronto',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(startAt))
}

export function PickupScheduler({ onSlotSelect, selectedSlot, locale, t }: Props) {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null)

  useEffect(() => {
    const { start, end } = getWindow()
    let active = true

    async function load() {
      try {
        const res = await fetch(`/api/appointments/availability?start=${start}&end=${end}`)
        if (!res.ok) throw new Error('fetch error')
        const slots: PickupSlotSerialized[] = await res.json()

        const slotsByDate = new Map<string, PickupSlotSerialized[]>()
        for (const slot of slots) {
          const date = slotDate(slot.startAt)
          const existing = slotsByDate.get(date)
          if (existing) existing.push(slot)
          else slotsByDate.set(date, [slot])
        }

        const availableDays = [...slotsByDate.keys()].sort()

        if (active) {
          setLoadState({ status: 'done', slotsByDate, availableDays })
          if (availableDays.length > 0) setSelectedDate(availableDays[0])
        }
      } catch {
        if (active) setLoadState({ status: 'error' })
      }
    }

    load()
    return () => { active = false }
  }, [])

  const currentSlots =
    selectedDate && loadState.status === 'done'
      ? (loadState.slotsByDate.get(selectedDate) ?? [])
      : []

  const blockBuckets = new Map<number, PickupSlotSerialized[]>()
  for (const slot of currentSlots) {
    const h = slotBlockKey(slot.startAt)
    const existing = blockBuckets.get(h)
    if (existing) existing.push(slot)
    else blockBuckets.set(h, [slot])
  }
  const availableBlocks = [...blockBuckets.keys()].sort((a, b) => a - b)
  // Fill the full range so unavailable blocks are visible but disabled
  const sortedBlocks: number[] = []
  if (availableBlocks.length > 0) {
    for (let b = availableBlocks[0]; b <= availableBlocks[availableBlocks.length - 1]; b++) {
      sortedBlocks.push(b)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="font-sans text-xs uppercase tracking-widest font-semibold">{t.heading}</p>

      {loadState.status === 'loading' && (
        <p className="font-sans text-xs text-foreground/40">{t.loadingSlots}</p>
      )}

      {loadState.status === 'error' && (
        <p className="font-sans text-xs text-red-600">{t.fetchError}</p>
      )}

      {loadState.status === 'done' && loadState.availableDays.length === 0 && (
        <p className="font-sans text-xs text-foreground/60">{t.noSlots}</p>
      )}

      {loadState.status === 'done' && loadState.availableDays.length > 0 && (
        <>
          <div className="flex flex-col gap-1">
            <p className="font-sans text-xs text-foreground/60">{t.selectDate}</p>
            <div className="flex flex-wrap gap-2">
              {loadState.availableDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setSelectedDate(day)
                    setSelectedBlock(null)
                    onSlotSelect(null)
                  }}
                  className={`font-sans text-xs px-3 py-2 border-2 transition-colors ${
                    selectedDate === day
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-foreground/30 hover:border-foreground'
                  }`}
                >
                  {formatDate(day, locale)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-sans text-xs uppercase tracking-widest font-semibold">{t.selectTime}</p>

            {sortedBlocks.length === 0 && (
              <p className="font-sans text-xs text-foreground/60">{t.noSlots}</p>
            )}

            {sortedBlocks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sortedBlocks.map((h) => {
                  const bucket = blockBuckets.get(h)
                  const isSelected = selectedBlock === h
                  const isDisabled = !bucket
                  return (
                    <label
                      key={h}
                      className={`font-sans text-sm px-4 py-2 border-2 transition-colors ${
                        isDisabled
                          ? 'border-foreground/15 text-foreground/25 cursor-not-allowed'
                          : isSelected
                            ? 'border-foreground bg-foreground text-background cursor-pointer'
                            : 'border-foreground/30 hover:border-foreground cursor-pointer'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pickupBlock"
                        className="sr-only"
                        disabled={isDisabled}
                        checked={isSelected}
                        onChange={() => {
                          setSelectedBlock(h)
                          onSlotSelect(bucket![0])
                        }}
                      />
                      {bucket ? formatTime(bucket[0].startAt, locale) : formatBlock(h, locale)}
                    </label>
                  )
                })}
              </div>
            )}

            {selectedSlot && (
              <p className="font-sans text-xs text-foreground/60">
                {t.pickupAround} {formatTime(selectedSlot.startAt, locale)}.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
