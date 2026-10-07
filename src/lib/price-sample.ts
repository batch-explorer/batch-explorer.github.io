// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type { PostageEvent, PriceUpdateArgs } from '$lib/types'

export interface PricePoint {
  blockTime: Date
  price: bigint
}

function priceOf(e: PostageEvent): bigint {
  return (e.args as PriceUpdateArgs).price
}

// Downsample a dense series to ~`buckets` evenly-spaced points across
// [cutoff, now]: last (most recent) price per bucket, carried forward into
// empty buckets so the line stays continuous. Stops at the newest event's
// bucket, so the series ends on the real current price, not a carried copy.
export function bucketSeries(
  events: PostageEvent[],
  cutoff: Date,
  now: Date,
  buckets = 200,
): PricePoint[] {
  const valid = events
    .filter((e): e is PostageEvent & { blockTime: Date } => e.blockTime !== undefined)
    .sort((a, b) => a.blockTime.getTime() - b.blockTime.getTime())
  if (valid.length === 0) return []

  const span = now.getTime() - cutoff.getTime()
  const bucketMs = span / buckets || 1

  // Last event per bucket index.
  const byBucket = new Map<number, PostageEvent & { blockTime: Date }>()
  for (const e of valid) {
    const idx = Math.min(
      buckets - 1,
      Math.max(0, Math.floor((e.blockTime.getTime() - cutoff.getTime()) / bucketMs)),
    )
    byBucket.set(idx, e) // ascending → last wins
  }

  const lastBucket = Math.max(...byBucket.keys())
  const out: PricePoint[] = []
  let carried: bigint | undefined
  for (let i = 0; i <= lastBucket; i++) {
    const e = byBucket.get(i)
    if (e) {
      carried = priceOf(e)
      out.push({ blockTime: e.blockTime, price: carried })
    } else if (carried !== undefined) {
      out.push({ blockTime: new Date(cutoff.getTime() + (i + 0.5) * bucketMs), price: carried })
    }
  }
  return out
}

// Keep only the moments the price actually changed (the oldest event of each
// run of equal prices). Input is newest-first; output preserves that order.
export function changePoints(events: PostageEvent[]): PostageEvent[] {
  return events.filter((e, i) => i === events.length - 1 || priceOf(e) !== priceOf(events[i + 1]))
}

if (import.meta.env.DEV) {
  const mk = (price: number, minutesAgo: number): PostageEvent => ({
    eventName: 'PriceUpdate',
    args: { price: BigInt(price) },
    blockNumber: 0n,
    blockTime: new Date(Date.now() - minutesAgo * 60_000),
    transactionHash: '0x',
    logIndex: 0,
  })
  // newest-first run: 5,5,5,7,7,9  → changes at 5(oldest),7,9 = 3 points
  const runs = [mk(9, 0), mk(7, 10), mk(7, 20), mk(5, 30), mk(5, 40), mk(5, 50)]
  console.assert(changePoints(runs).length === 3, 'changePoints should collapse runs to 3')
  const now = new Date()
  const cutoff = new Date(now.getTime() - 60 * 60_000)
  console.assert(
    bucketSeries(runs, cutoff, now, 10).length <= 10,
    'bucketSeries should not exceed bucket count',
  )
  // newest event 25 min old → trailing buckets are empty and must not be filled
  const newest = mk(7, 25)
  const stale = bucketSeries([newest, mk(7, 35), mk(5, 55)], cutoff, now, 10)
  console.assert(
    stale[stale.length - 1].blockTime.getTime() === newest.blockTime!.getTime() &&
      stale.filter((p) => p.price === 7n).length === 2,
    'bucketSeries should end on the newest event without carried duplicates',
  )
}
